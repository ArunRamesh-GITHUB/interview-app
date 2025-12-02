// server.js (ESM) — full replacement
// Express API for: Auth (Supabase), Attempts CRUD, TTS, STT+Score, Model Answer
// + Realtime ephemeral token endpoint (HARD-LOCKED to gpt-4o-mini-realtime)
// Works with Vite dev proxy (http://localhost:5173 -> http://localhost:3001)

import express from 'express'
import session from 'express-session'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'
import { TOKEN_RULES, PLAN_TOKEN_GRANTS, practiceSecondsToTokens, realtimeSecondsToTokens } from './config/pricing.js'
import { mountRevenueCatWebhook } from './server/plugins/revenuecatWebhook.js'
import { handleRevenueCatWebhook } from './server/routes/webhooks/revenuecat.js'
import { verifyIAPReceipt } from './server/routes/iap.js'


dotenv.config()

const OVERALL_JOBS = new Map() // jobId -> { status: 'pending'|'ready'|'error', result?, createdAt }

function cleanupOverallJobs() {
  const now = Date.now()
  for (const [id, job] of OVERALL_JOBS.entries()) {
    if (!job?.createdAt) { OVERALL_JOBS.delete(id); continue }
    if (now - job.createdAt > 10 * 60 * 1000) {OVERALL_JOBS.delete(id)} // 10 min TTL
  }
}
setInterval(cleanupOverallJobs, 60 * 1000)

// Cache cleanup functions for memory management
function cleanupCaches() {
  const now = Date.now()
  const DEBUG_CACHE = process.env.DEBUG_CACHE === '1'
  let deletedCount = 0
  
  // Cleanup DETAILED_RESULTS (TTL-based)
  const initialDetailedSize = DETAILED_RESULTS.size
  for (const [key, value] of DETAILED_RESULTS.entries()) {
    if (now - value.timestamp > DETAILED_RESULTS_TTL) {
      DETAILED_RESULTS.delete(key)
      deletedCount++
    }
  }
  
  // Cleanup RUBRIC_CACHE if it gets too large (simple LRU)
  const RUBRIC_CACHE_MAX_SIZE = 50
  const initialRubricSize = RUBRIC_CACHE.size
  if (RUBRIC_CACHE.size > RUBRIC_CACHE_MAX_SIZE) {
    const keysToDelete = Math.floor(RUBRIC_CACHE_MAX_SIZE / 2) // Delete half
    let count = 0
    for (const key of RUBRIC_CACHE.keys()) {
      if (count >= keysToDelete) {break}
      RUBRIC_CACHE.delete(key)
      count++
      deletedCount++
    }
  }
  
  // Cleanup IMMEDIATE_SCORE_CACHE if it gets too large (LRU)
  const IMMEDIATE_CACHE_MAX_SIZE = 100
  const initialImmediateSize = IMMEDIATE_SCORE_CACHE.size
  if (IMMEDIATE_SCORE_CACHE.size > IMMEDIATE_CACHE_MAX_SIZE) {
    const keysToDelete = Math.floor(IMMEDIATE_CACHE_MAX_SIZE / 2) // Delete half
    let count = 0
    for (const key of IMMEDIATE_SCORE_CACHE.keys()) {
      if (count >= keysToDelete) {break}
      IMMEDIATE_SCORE_CACHE.delete(key)
      count++
      deletedCount++
    }
  }
  
  // Optional debug logging
  if (DEBUG_CACHE && deletedCount > 0) {
    console.log(`[Cache Cleanup] Deleted ${deletedCount} entries. Cache sizes: DETAILED_RESULTS=${DETAILED_RESULTS.size}, RUBRIC_CACHE=${RUBRIC_CACHE.size}, IMMEDIATE_SCORE_CACHE=${IMMEDIATE_SCORE_CACHE.size}, SCORING_CACHE=${SCORING_CACHE.size}`)
  }
}
setInterval(cleanupCaches, 5 * 60 * 1000) // Run every 5 minutes

// ---------- Paths / setup ----------
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PORT = parseInt(process.env.PORT || '3001', 10)
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || `http://localhost:${PORT}`

// Environment variable validation
const requiredEnvVars = {
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  SESSION_SECRET: process.env.SESSION_SECRET,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY
}

// Check for missing required environment variables
const missingEnvVars = Object.entries(requiredEnvVars)
  .filter(([key, value]) => !value)
  .map(([key]) => key)

if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`)
}

// Check for insecure default values
if (requiredEnvVars.SESSION_SECRET === 'dev_change_me_long_secret' || 
    requiredEnvVars.SESSION_SECRET === 'change_this_to_a_very_long_random_string') {
  throw new Error('SESSION_SECRET must be changed from the default development value')
}

// Validate Supabase URL format
if (!requiredEnvVars.SUPABASE_URL.startsWith('https://') || !requiredEnvVars.SUPABASE_URL.includes('.supabase.co')) {
  throw new Error('SUPABASE_URL must be a valid Supabase project URL')
}

// Validate OpenAI API key format
if (!requiredEnvVars.OPENAI_API_KEY.startsWith('sk-')) {
  throw new Error('OPENAI_API_KEY must be a valid OpenAI API key starting with sk-')
}

const SUPABASE_URL = requiredEnvVars.SUPABASE_URL
const SUPABASE_ANON_KEY = requiredEnvVars.SUPABASE_ANON_KEY
const SUPABASE_SERVICE_ROLE_KEY = requiredEnvVars.SUPABASE_SERVICE_ROLE_KEY
const SESSION_SECRET = requiredEnvVars.SESSION_SECRET
const OPENAI_API_KEY = requiredEnvVars.OPENAI_API_KEY
const TRANSCRIBE_MODEL = process.env.TRANSCRIBE_MODEL || 'whisper-1'
const TTS_MODEL = process.env.TTS_MODEL || 'tts-1'
const SCORING_MODEL = process.env.SCORING_MODEL || 'gpt-4o-mini'

// Feature flag for contextual follow-up generation
const FOLLOWUP_IMMEDIATE_MICROCALL = process.env.FOLLOWUP_IMMEDIATE_MICROCALL === '1'

// --- FAST SCORING HELPERS (drop right after SCORING_MODEL) ---
const SCORING_MAX_TOKENS = Number(process.env.SCORING_MAX_TOKENS || 250);

const RUBRIC_CACHE = new Map();
const SCORING_CACHE = new Map();
const SCORING_CACHE_MAX_SIZE = 500; // Limit cache size to prevent memory bloat

// Temporary storage for detailed scoring results (with TTL)
const DETAILED_RESULTS = new Map();
const DETAILED_RESULTS_TTL = 5 * 60 * 1000; // 5 minutes TTL

function bandFromScore(s) {
  if (s >= 85) {return 'Outstanding';}
  if (s >= 70) {return 'Strong';}
  if (s >= 55) {return 'Mixed';}
  if (s >= 40) {return 'Weak';}
  return 'Poor';
}

// Generate cache key for scoring
function generateScoringCacheKey(question, answer, persona, subject) {
  const normalized = answer.trim().toLowerCase().replace(/\s+/g, ' ');
  const questionNorm = question.trim().toLowerCase();
  return `${persona}|${subject || ''}|${questionNorm}|${normalized}`;
}

// LRU eviction when cache gets too large
function evictOldestFromScoringCache() {
  if (SCORING_CACHE.size >= SCORING_CACHE_MAX_SIZE) {
    const firstKey = SCORING_CACHE.keys().next().value;
    SCORING_CACHE.delete(firstKey);
  }
}

function compileRubric(persona, subject) {
  const key = `${persona}|${subject || ''}`;
  if (RUBRIC_CACHE.has(key)) {return RUBRIC_CACHE.get(key);}

  let rubric = '';
  switch (String(persona || '').toLowerCase()) {
    case 'medical':
      rubric = [
        'Assess clarity, empathy, and ethics reasoning (autonomy, beneficence, non-maleficence, justice).',
        'Reward structured thinking, concrete examples, patient-centred reasoning.',
        'Penalise vagueness; prefer balanced trade-offs and rationales.',
      ].join(' ');
      break;
    case 'oxbridge':
      rubric = [
        `Subject: ${subject || 'General'}.`,
        'Assess depth, rigour, explicit assumptions, estimation, trade-offs.',
        'Penalise hand-waving; reward models, approximations, limits of approach.',
      ].join(' ');
      break;
    default: // apprenticeship / general
      rubric = [
        'Assess clarity, ownership, hands-on problem-solving, learning speed.',
        'Reward concrete examples, measurable outcomes, reflection.',
      ].join(' ');
      break;
  }

  RUBRIC_CACHE.set(key, rubric);
  return rubric;
}

// Pull persona/subject from the hint we stuff into cvText like:
// "[Interviewer persona: OXBRIDGE — Subject: Engineering]"
function parsePersonaFromCV(cvText = '') {
  const s = String(cvText);
  const m = s.match(/\[Interviewer persona:\s*([^\]\n—-]+)(?:[—-]\s*Subject:\s*([^\]]+))?\]/i);
  const persona = (m?.[1] || '').trim().toLowerCase();
  const subject = (m?.[2] || '').trim();
  if (persona.startsWith('medical')) {return { persona: 'medical', subject: '' };}
  if (persona.startsWith('oxbridge')) {return { persona: 'oxbridge', subject };}
  if (persona.includes('apprentice')) {return { persona: 'apprenticeship', subject: '' };}
  return { persona: 'apprenticeship', subject: '' };
}

function shortText(s, n = 300) {
  const t = String(s || '').replace(/\[Interviewer persona:[^\]]+\]/i, '').trim();
  return t.length > n ? t.slice(0, n) + '…' : t;
}

// ---------- IMMEDIATE SCORING (FAST CLIENT FEEDBACK) ----------
// Cache for immediate scoring patterns to avoid recalculation
const IMMEDIATE_SCORE_CACHE = new Map();

// Generate context-specific follow-up questions using OpenAI
async function generateContextualFollowups(transcript, question, persona = 'medical', subject = '', maxFollowups = 2) {
  try {
    const personaContext = persona === 'oxbridge' ? `Oxbridge ${subject} interview` : 
                          persona === 'medical' ? 'Medical school interview' : 
                          persona === 'apprenticeship' ? 'Degree apprenticeship interview' : 'Interview';
    
    const prompt = `You are an expert interviewer for a ${personaContext}. Generate ${maxFollowups} specific follow-up questions that directly reference what the candidate actually said.

Original Question: "${question}"

Candidate's Response: "${transcript}"

CRITICAL REQUIREMENTS for follow-up questions:
1. MUST quote, paraphrase, or reference specific words/phrases the candidate used
2. MUST probe deeper into their reasoning, examples, assumptions, or claims
3. MUST be specific to this response - avoid generic questions like "Can you elaborate?" or "Tell me more"
4. Start questions with phrases like "You mentioned...", "You said...", "When you described...", "You talked about..."
5. Match interview style: ${persona === 'oxbridge' ? 'analytical, challenging assumptions, testing logical consistency' : persona === 'medical' ? 'exploring ethical reasoning, empathy, patient-centered thinking' : 'practical problem-solving, real-world application, workplace scenarios'}

Examples of GOOD contextual follow-ups:
- "You mentioned X - what led you to that specific conclusion?"
- "When you described Y, how did you ensure Z?"
- "You said 'abc' - can you walk me through your thinking there?"

Return JSON: {"followups": ["question1", "question2"]}`;

    const completion = await retryOpenAICall(async () => {
      return await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200,
        temperature: 0.2,
        response_format: { type: 'json_object' }
      })
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    const parsed = JSON.parse(response);
    const followups = parsed.followups || parsed.questions || [];
    
    if (!Array.isArray(followups) || followups.length === 0) {
      throw new Error('No valid followups generated');
    }
    
    // Filter for truly contextual questions that reference the candidate's response
    const contextualQuestions = followups
      .filter(q => typeof q === 'string' && q.trim().length > 15)
      .filter(q => {
        const lower = q.toLowerCase();
        // Must contain contextual references
        const hasContextualRef = /\b(you mentioned|you said|you described|you talked about|when you|your answer|your response|your example|your approach|your experience|you stated|you explained|you discussed)\b/i.test(q);
        // Must not be too generic
        const isNotGeneric = !(/^(can you|could you|tell me|describe|explain|what|how|why)\b/i.test(q) && q.split(' ').length < 10);
        return hasContextualRef && isNotGeneric;
      })
      .slice(0, maxFollowups);
    
    if (contextualQuestions.length === 0) {
      throw new Error('Generated questions not contextual enough');
    }
    
    return contextualQuestions;
  } catch (error) {
    console.error('Error generating contextual follow-ups:', error);
    return generateBasicFollowups(transcript, question, maxFollowups);
  }
}

// Fallback basic follow-up generator (original logic)
function generateBasicFollowups(transcript, question, maxFollowups = 2) {
  const wordCount = transcript.trim().split(/\s+/).length
  const hasSpecificExamples = /\b(for example|for instance|specifically|such as|like when|in my experience)\b/i.test(transcript)
  const hasQuantifiedResults = /\b(\d+%|\d+ percent|increased|decreased|improved|reduced)\b/i.test(transcript)
  
  const basicFollowups = []
  if (wordCount > 20) {
    if (hasSpecificExamples) {
      basicFollowups.push('Can you elaborate on one of those examples in more detail?')
    } else {
      basicFollowups.push('Can you provide a specific example to illustrate your point?')
    }
    
    if (!hasQuantifiedResults && wordCount > 40) {
      basicFollowups.push('What measurable impact or outcome did you achieve?')
    }
    
    basicFollowups.push('How would you approach this differently now?')
  } else if (wordCount > 10) {
    basicFollowups.push('Could you expand on that with more details?')
  }
  
  return basicFollowups.slice(0, maxFollowups);
}

async function generateImmediateScore(transcript, question, persona = 'medical', subject = '') {
  // Clear any old cached results that might contain word-length assessments
  IMMEDIATE_SCORE_CACHE.clear()
  
  // Simple placeholder while waiting for proper AI scoring
  if (!transcript || transcript.trim().length < 10) {
    return {
      score: null,
      band: 'Processing',
      summary: 'Please wait whilst we mark your response...',
      strengths: [],
      improvements: [],
      followup_questions: [],
      immediate: true
    }
  }

  // Generate contextual follow-up questions immediately
  let followupQuestions = []
  try {
    followupQuestions = await generateContextualFollowups(transcript, question, persona, subject, 2)
  } catch (error) {
    console.error('Contextual followup generation failed:', error)
    // Fallback to basic followups only if contextual fails
    try {
      followupQuestions = generateBasicFollowups(transcript, question, 2)
    } catch (fallbackError) {
      console.error('Basic followup generation failed:', fallbackError)
      followupQuestions = []
    }
  }

  return {
    score: null,
    band: 'Processing',
    summary: 'Please wait whilst we mark your response...',
    strengths: [],
    improvements: [],
    followup_questions: followupQuestions,
    immediate: true
  }
}


// *** HARD-LOCK: ALWAYS use mini realtime ***
const REALTIME_MODEL = 'gpt-4o-mini-realtime-preview'

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || ''
const TTS_CACHE_DIR = process.env.TTS_CACHE_DIR || path.join(__dirname, 'cache_tts')

// ---------- Guards ----------
if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase env vars. Check SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY')
}
if (!OPENAI_API_KEY) {
  console.error('Missing OPENAI_API_KEY in .env')
}
fs.mkdirSync(TTS_CACHE_DIR, { recursive: true })

// ---------- Clients ----------
const app = express()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } }) // 25MB
const openai = new OpenAI({ apiKey: OPENAI_API_KEY })
const sbAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } })
const sbAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

// ---------- Middleware ----------
app.set('trust proxy', 1)
app.use(helmet({ contentSecurityPolicy: false }))
app.use(express.json({ limit: '4mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(
  session({
    name: 'sid',
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { 
      httpOnly: true, 
      sameSite: 'lax', 
      secure: process.env.NODE_ENV === 'production', 
      maxAge: 30 * 24 * 60 * 60 * 1000 
    },
  })
)

const strictLimiter = rateLimit({ windowMs: 60 * 1000, max: 10 })
const lightLimiter = rateLimit({ windowMs: 60 * 1000, max: 30 })

// --- Serve SPA build (Vite) from ./web/dist --- //
const SPA_DIR = path.join(__dirname, 'web', 'dist')
app.use(express.static(SPA_DIR))

// Serve fallback static files from public directory
app.use(express.static(path.join(__dirname, 'public')))

// Mount RevenueCat webhook
mountRevenueCatWebhook(app, { sbAdmin })
// ---------- Helpers ----------
function authRequired(req, res, next) { if (req.session?.user?.id) {return next();} return res.status(401).json({ error: 'Not authenticated' }) }
function currentUser(req) { return req.session?.user || null }
function requireServer(req, res, next) {
  const key = req.headers["x-internal-key"];
  if (!key || key !== process.env.INTERNAL_SERVER_KEY) {
    return res.status(401).json({ error: "Server-only endpoint" });
  }
  next();
}
function hashKey(s) { return crypto.createHash('sha1').update(s).digest('hex') }
function safeJSON(s) { try { return JSON.parse(s) } catch { return null } }

// Enhanced error handling utilities
function isRateLimitError(error) {
  return error?.status === 429 || error?.code === 'rate_limit_exceeded' || 
         (error?.message && error.message.includes('rate limit'))
}

function isQuotaExceededError(error) {
  return error?.code === 'insufficient_quota' || 
         (error?.message && error.message.includes('quota'))
}

function getRetryDelay(attempt) {
  return Math.min(1000 * Math.pow(2, attempt), 30000)
}

async function retryOpenAICall(apiCall, maxRetries = 3) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall()
    } catch (error) {
      console.error(`OpenAI API attempt ${attempt + 1} failed:`, {
        status: error?.status,
        code: error?.code,
        message: error?.message?.substring(0, 200)
      })
      
      if (attempt === maxRetries) {throw error}
      
      if (isQuotaExceededError(error)) {
        throw new Error('OpenAI quota exceeded. Please try again later or check your billing.')
      }
      
      if (isRateLimitError(error)) {
        const delay = getRetryDelay(attempt)
        console.log(`Rate limited, retrying in ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      
      if (error?.status >= 500) {
        const delay = getRetryDelay(attempt)
        console.log(`Server error, retrying in ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      
      throw error
    }
  }
}

// ---------- AUTH ----------
app.post('/api/register', lightLimiter, async (req, res) => {
  try {
    const { email, password, username } = req.body || {}
    if (!email || !password) {return res.status(400).json({ error: 'email and password required' })}
    // Generate username from email if not provided
    const finalUsername = username || email.split('@')[0]
    const { data: created, error: createErr } = await sbAdmin.auth.admin.createUser({
      email, password, email_confirm: true, user_metadata: { username: finalUsername },
    })
    if (createErr) {return res.status(400).json({ error: createErr.message })}
    const userId = created?.user?.id
    if (!userId) {return res.status(500).json({ error: 'Failed to create user' })}
    await sbAdmin.from('profiles').upsert({ id: userId, email, username: finalUsername })
    res.json({ ok: true })
  } catch (e) { console.error(e); res.status(500).json({ error: 'Register failed' }) }
})

app.post('/api/login', lightLimiter, async (req, res) => {
  try {
    const { email, password } = req.body || {}
    if (!email || !password) {return res.status(400).json({ error: 'email and password required' })}
    const { data, error } = await sbAnon.auth.signInWithPassword({ email, password })
    if (error || !data?.user) {return res.status(401).json({ error: 'Invalid email or password' })}
    req.session.user = { id: data.user.id, email: data.user.email }
    res.json({ ok: true })
  } catch (e) { console.error(e); res.status(500).json({ error: 'Login failed' }) }
})

app.post('/api/logout', lightLimiter, (req, res) => { try { req.session.destroy(() => {}) } catch {} res.json({ ok: true }) })
app.get('/api/me', async (req, res) => {
  try {
    const u = currentUser(req)
    if (!u) {return res.json({ user: null })}
    
    // Get basic usage stats
    const { data: attempts, error } = await sbAdmin
      .from('attempts')
      .select('id, scoring, created_at')
      .eq('user_id', u.id)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching user stats:', error)
      return res.json({ 
        user: { id: u.id, email: u.email },
        usage: { totalSessions: 0, totalQuestions: 0, questionsThisWeek: 0, averageScore: 0 }
      })
    }

    const totalQuestions = attempts?.length || 0
    const now = new Date()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    const questionsThisWeek = attempts?.filter(a => 
      new Date(a.created_at) >= oneWeekAgo
    ).length || 0

    let averageScore = 0
    if (attempts?.length > 0) {
      const scores = attempts
        .map(a => a.scoring?.score)
        .filter(score => typeof score === 'number')
      
      if (scores.length > 0) {
        averageScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
      }
    }

    res.json({ 
      user: { id: u.id, email: u.email },
      usage: {
        totalSessions: totalQuestions, // Using questions as session count for now
        totalQuestions,
        questionsThisWeek,
        averageScore
      }
    })
  } catch (e) {
    console.error('Error in /api/me:', e)
    const u = currentUser(req)
    res.json({ 
      user: u ? { id: u.id, email: u.email } : null,
      usage: { totalSessions: 0, totalQuestions: 0, questionsThisWeek: 0, averageScore: 0 }
    })
  }
})

app.post('/api/password/reset', lightLimiter, async (req, res) => {
  try {
    const { email } = req.body || {}
    if (!email) {return res.status(400).json({ error: 'email required' })}
    const { error } = await sbAnon.auth.resetPasswordForEmail(email, { redirectTo: `${PUBLIC_BASE_URL}/reset.html` })
    if (error) {return res.status(400).json({ error: error.message })}
    res.json({ ok: true })
  } catch (e) { console.error(e); res.status(500).json({ error: 'Reset failed' }) }
})

// ---------- ACCOUNT ENDPOINTS ----------
app.get('/api/account/export', authRequired, async (req, res) => {
  try {
    const user = currentUser(req)
    const { data: attempts, error } = await sbAdmin
      .from('attempts')
      .select('id, mode, question, answer, scoring, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Export error:', error)
      return res.status(500).json({ error: 'Export failed' })
    }

    const exportData = {
      user: { id: user.id, email: user.email },
      exported_at: new Date().toISOString(),
      total_attempts: attempts?.length || 0,
      attempts: attempts || []
    }

    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Content-Disposition', 'attachment; filename="interview-data.json"')
    res.json(exportData)
  } catch (e) {
    console.error('Export failed:', e)
    res.status(500).json({ error: 'Export failed' })
  }
})

app.post('/api/account/delete', authRequired, (req, res) => {
  // Placeholder for account deletion - returns 501 Not Implemented
  res.status(501).json({ 
    error: 'Account deletion not yet implemented',
    message: 'This feature will be available in a future update'
  })
})

// ---------- AUTH ALIASES (for legacy public interface compatibility) ----------
app.post('/api/auth/register', lightLimiter, async (req, res) => {
  try {
    const { email, password, username } = req.body || {}
    if (!email || !password || !username) {return res.status(400).json({ error: 'email, password, username required' })}
    const { data: created, error: createErr } = await sbAdmin.auth.admin.createUser({
      email, password, email_confirm: true, user_metadata: { username },
    })
    if (createErr) {return res.status(400).json({ error: createErr.message })}
    const userId = created?.user?.id
    if (!userId) {return res.status(500).json({ error: 'Failed to create user' })}
    await sbAdmin.from('profiles').upsert({ id: userId, email, username })
    res.json({ ok: true })
  } catch (e) { console.error(e); res.status(500).json({ error: 'Register failed' }) }
})

app.post('/api/auth/login', lightLimiter, async (req, res) => {
  try {
    const { email, password } = req.body || {}
    if (!email || !password) {return res.status(400).json({ error: 'email and password required' })}
    const { data, error } = await sbAnon.auth.signInWithPassword({ email, password })
    if (error || !data?.user) {return res.status(401).json({ error: 'Invalid email or password' })}
    req.session.user = { id: data.user.id, email: data.user.email }
    res.json({ ok: true })
  } catch (e) { console.error(e); res.status(500).json({ error: 'Login failed' }) }
})

app.post('/api/auth/logout', lightLimiter, (req, res) => { try { req.session.destroy(() => {}) } catch {} res.json({ ok: true }) })
app.get('/api/auth/me', (req, res) => { const u = currentUser(req); res.json({ user: u ? { id: u.id, email: u.email } : null }) })

app.post('/api/auth/request-password-reset', lightLimiter, async (req, res) => {
  try {
    const { email } = req.body || {}
    if (!email) {return res.status(400).json({ error: 'email required' })}
    const { error } = await sbAnon.auth.resetPasswordForEmail(email, { redirectTo: `${PUBLIC_BASE_URL}/reset.html` })
    if (error) {return res.status(400).json({ error: error.message })}
    res.json({ ok: true })
  } catch (e) { console.error(e); res.status(500).json({ error: 'Reset failed' }) }
})

app.post('/api/overall/prepare', express.json(), async (req, res) => {
  try {
    const { persona, subject, rounds } = req.body || {}
    if (!Array.isArray(rounds) || rounds.length === 0) {return res.status(400).json({ error: 'No rounds' })}

    const job = randomUUID()
    OVERALL_JOBS.set(job, { status: 'pending', createdAt: Date.now() })
    res.json({ job })

    // Background task
    ;(async () => {
      try {
        const bullets = rounds.map((r, i) => {
          const sco = r?.scoring || {}
          return `Q${i+1}. ${r.question}\n- Band: ${sco.band ?? 'n/a'} | Score: ${sco.score ?? 'n/a'}\n- Summary: ${sco.summary ?? ''}\n- Strengths: ${(sco.strengths||[]).join('; ')}\n- Improvements: ${(sco.improvements||[]).join('; ')}`
        }).join('\n\n')

        const personaLine =
          persona === 'oxbridge' ? `Persona: Oxbridge (${subject || 'n/a'})`
          : persona === 'medical' ? 'Persona: Medical admissions'
          : 'Persona: Degree apprenticeship'

        const prompt = `You are an expert interviewer.\n${personaLine}\n\nGiven these per-question assessments, produce a concise overall evaluation.\nReturn JSON with keys:\n- overall_summary (string, 2-4 sentences)\n- strengths_top (array of up to 5 strings)\n- improvements_top (array of up to 5 strings)\n- themes (array of up to 5 strings)\n- band (one of: Outstanding, Strong, Mixed, Weak, Poor)\n- avg (integer 0-100, approximate)\n\nAssessments:\n${bullets}`

        const completion = await retryOpenAICall(async () => {
          return await openai.chat.completions.create({
            model: SCORING_MODEL,
            temperature: 0.3,
            response_format: { type: 'json_object' },
            messages: [
              { role: 'system', content: 'Return ONLY valid JSON. No markdown.' },
              { role: 'user', content: prompt },
            ],
          })
        })

        let result = {}
        try { result = JSON.parse(completion.choices?.[0]?.message?.content || '{}') } catch {}
        OVERALL_JOBS.set(job, { status: 'ready', result, createdAt: Date.now() })
      } catch (err) {
        OVERALL_JOBS.set(job, { status: 'error', error: String(err), createdAt: Date.now() })
      }
    })()
  } catch (e) {
    res.status(500).json({ error: 'failed to start job' })
  }
})

app.get('/api/overall/status', async (req, res) => {
  const job = String(req.query.job || '')
  if (!job || !OVERALL_JOBS.has(job)) {return res.status(404).json({ error: 'job not found' })}
  const j = OVERALL_JOBS.get(job)
  res.json(j)
})


// ---------- OPENAI: SCORING / MODEL ANSWER ----------
// ---------- OPENAI: SCORING / MODEL ANSWER ----------
async function scoreAnswer({ question, answer, cvText }) {
  const { persona, subject } = parsePersonaFromCV(cvText);
  
  // Clear cache to prevent old length-based assessments from being returned
  SCORING_CACHE.clear();
  
  // Check scoring cache first
  const cacheKey = generateScoringCacheKey(question, answer, persona, subject);
  if (SCORING_CACHE.has(cacheKey)) {
    return SCORING_CACHE.get(cacheKey);
  }
  
  const rubric = compileRubric(persona, subject);

  // Strict, small JSON schema → faster & more reliable
  const schema = {
    type: 'object',
    properties: {
      score: { type: 'integer', minimum: 0, maximum: 100 },
      band: { type: 'string' },
      summary: { type: 'string' }, // <= ~40 words
      strengths: { type: 'array', items: { type: 'string' }, maxItems: 3 },
      improvements: { type: 'array', items: { type: 'string' }, maxItems: 3 },
      followup_questions: { type: 'array', items: { type: 'string' }, maxItems: 3 }
    },
    required: ['score', 'summary'],
    additionalProperties: false
  };

  const systemText =
    `You are a strict interviewer. Return ONLY JSON matching this schema:\n` +
    JSON.stringify(schema) +
    `\nKeep "summary" concise (<= 40 words). NEVER mention word count, response length, or structure in your summary. Focus only on the content and ideas presented. For followup_questions, reference something the candidate actually said and probe deeper - avoid generic questions.`;

  const cvNote = shortText(cvText, 300); // tiny CV hint if present
  const userText =
    `Persona: ${persona || 'apprenticeship'}${subject ? ` | Subject: ${subject}` : ''}\n` +
    `Rubric: ${rubric}\n` +
    (cvNote ? `CV note: ${cvNote}\n` : '') +
    `Question: ${question}\n` +
    `Transcript:\n${answer}`;

  const resp = await retryOpenAICall(async () => {
    return await openai.chat.completions.create({
      model: SCORING_MODEL,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      max_tokens: SCORING_MAX_TOKENS,
      messages: [
        { role: 'system', content: systemText },
        { role: 'user', content: userText },
      ],
    })
  });

  let json = {};
  try { json = JSON.parse(resp.choices?.[0]?.message?.content || '{}') } catch {}
  const score = Math.max(0, Math.min(100, parseInt(json.score ?? 0, 10) || 0));
  const band = String(json.band || bandFromScore(score));
  
  // Filter out any summary that mentions word count or length
  let summary = String(json.summary || '');
  if (summary.toLowerCase().includes('word') || summary.toLowerCase().includes('length') || summary.toLowerCase().includes('structure') || /\(\d+\s*words?\)/.test(summary)) {
    summary = 'Response demonstrates understanding of the question and provides relevant points for discussion.';
  }

  // Generate better follow-ups using the same contextual method as fast scoring
  let contextualFollowups = []
  try {
    if (answer && answer.trim().split(/\s+/).length > 15) {
      contextualFollowups = await generateContextualFollowups(answer.slice(0, 800), question, persona, subject, 3)
    }
  } catch (error) {
    console.error('Slow contextual followup generation failed:', error)
  }

  const result = {
    score,
    band,
    summary: summary,
    strengths: Array.isArray(json.strengths) ? json.strengths.slice(0, 3) : [],
    improvements: Array.isArray(json.improvements) ? json.improvements.slice(0, 3) : [],
    followup_questions: contextualFollowups.length > 0 ? contextualFollowups : (Array.isArray(json.followup_questions) ? json.followup_questions.slice(0, 3) : []),
  };
  
  // Cache the result for future identical requests
  evictOldestFromScoringCache();
  SCORING_CACHE.set(cacheKey, result);
  
  return result;
}


async function makeModelAnswer({ question, cvText }) {
  const sys = `You are an expert interviewer. Produce a concise, high-quality model answer (180–220 words).
Use clear structure. If CV/context is provided, tailor appropriately. Return plain text.`
  const user = `Question: ${question}\nCV/context (optional):\n${cvText || '(none)'}`
  const resp = await retryOpenAICall(async () => {
    return await openai.chat.completions.create({
      model: SCORING_MODEL, temperature: 0.4,
      messages: [{ role: 'system', content: sys }, { role: 'user', content: user }],
    })
  })
  const answer = resp.choices?.[0]?.message?.content?.trim() || ''
  const scoring = await scoreAnswer({ question, answer, cvText })
  return { answer, scoring }
}

// ---------- API: SCORE / MODEL ANSWER ----------
app.post('/api/score', strictLimiter, requireActiveTokenSession, async (req, res) => {
  try {
    const { question, answer, cvText } = req.body || {}
    if (!question || !answer) {return res.status(400).json({ error: 'question and answer required' })}
    const scoring = await scoreAnswer({ question, answer, cvText })
    res.json(scoring)
  } catch (e) { 
    console.error('Scoring failed:', {
      status: e?.status,
      code: e?.code,
      message: e?.message?.substring(0, 200)
    })
    const userMessage = isQuotaExceededError(e) ? 'OpenAI quota exceeded' : 
                       isRateLimitError(e) ? 'Service temporarily busy, please try again' : 
                       'Scoring failed'
    res.status(500).json({ error: userMessage })
  }
})

app.post('/api/model-answer', strictLimiter, requireActiveTokenSession, async (req, res) => {
  try {
    const { question, cvText } = req.body || {}
    if (!question) {return res.status(400).json({ error: 'question required' })}
    const result = await makeModelAnswer({ question, cvText })
    res.json(result)
  } catch (e) { 
    console.error('Model answer failed:', {
      status: e?.status,
      code: e?.code,
      message: e?.message?.substring(0, 200)
    })
    const userMessage = isQuotaExceededError(e) ? 'OpenAI quota exceeded' : 
                       isRateLimitError(e) ? 'Service temporarily busy, please try again' : 
                       'Model answer failed'
    res.status(500).json({ error: userMessage })
  }
})

// ---------- OPENAI: TTS ----------
app.get('/api/tts', strictLimiter, async (req, res) => {
  try {
    const text = (req.query.text || '').toString().slice(0, 3000)
    const voice = (req.query.voice || 'alloy').toString()
    if (!text) {return res.status(400).json({ error: 'text required' })}
    const key = hashKey([TTS_MODEL, voice, text].join('||'))
    const filePath = path.join(TTS_CACHE_DIR, `${key}.mp3`)
    if (fs.existsSync(filePath)) { res.setHeader('content-type', 'audio/mpeg'); return fs.createReadStream(filePath).pipe(res) }
    const speech = await retryOpenAICall(async () => {
      return await openai.audio.speech.create({ model: TTS_MODEL, voice, input: text, format: 'mp3' })
    })
    const buf = Buffer.from(await speech.arrayBuffer())
    fs.writeFileSync(filePath, buf)
    res.setHeader('content-type', 'audio/mpeg')
    res.send(buf)
  } catch (e) { 
    console.error('TTS failed:', {
      status: e?.status,
      code: e?.code,
      message: e?.message?.substring(0, 200)
    })
    const userMessage = isQuotaExceededError(e) ? 'OpenAI quota exceeded' : 
                       isRateLimitError(e) ? 'Service temporarily busy, please try again' : 
                       'Text-to-speech failed'
    res.status(500).json({ error: userMessage })
  }
})

// ---------- ElevenLabs proxy (optional) ----------
app.get('/api/tts11', strictLimiter, async (req, res) => {
  try {
    if (!ELEVENLABS_API_KEY) {return res.status(400).json({ error: 'ELEVENLABS_API_KEY missing' })}
    const text = (req.query.text || '').toString()
    const voice = (req.query.voice || '21m00Tcm4TlvDq8ikWAM').toString()
    if (!text) {return res.status(400).json({ error: 'text required' })}
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}/stream`, {
      method: 'POST',
      headers: { 'xi-api-key': ELEVENLABS_API_KEY, 'content-type': 'application/json' },
      body: JSON.stringify({ text, model_id: 'eleven_multilingual_v2' }),
    })
    if (!r.ok) { const t = await r.text(); return res.status(400).json({ error: t || 'ElevenLabs error' }) }
    res.setHeader('content-type', 'audio/mpeg')
    r.body.pipe(res)
  } catch (e) { 
    console.error('ElevenLabs TTS failed:', {
      status: e?.status,
      message: e?.message?.substring(0, 200)
    })
    res.status(500).json({ error: 'ElevenLabs TTS service failed' })
  }
})

// ---------- FAST TRANSCRIBE (IMMEDIATE RESPONSE) + SCORE ----------
app.post('/api/transcribe-fast', strictLimiter, requireActiveTokenSession, upload.single('audio'), async (req, res) => {
  try {
    const file = req.file
    const question = (req.body?.question || '').toString()
    const mode = (req.body?.mode || 'live').toString()
    const save = (req.body?.save || '').toString() !== '0'
    const persona = (req.body?.persona || 'medical').toString()
    const subject = (req.body?.subject || '').toString()
    let cvText = (req.body?.cvText || '').toString()
    const CV_MAX_CHARS = 1200
    if (cvText.length > CV_MAX_CHARS) {cvText = cvText.slice(0, CV_MAX_CHARS)}

    if (!file) {return res.status(400).json({ error: 'audio file required' })}
    if (!question) {return res.status(400).json({ error: 'question required' })}

    const audioFile = new File([file.buffer], file.originalname || 'audio.webm', { type: file.mimetype || 'audio/webm' })
    const user = currentUser(req)

    // Start both transcription and basic scoring immediately
    const transcriptionPromise = retryOpenAICall(async () => {
      return await openai.audio.transcriptions.create({ 
        file: audioFile, 
        model: TRANSCRIBE_MODEL 
      })
    }).then(tr => tr.text || '').catch(err => {
      console.error('Transcription error:', {
        status: err?.status,
        code: err?.code,
        message: err?.message?.substring(0, 200)
      })
      return ''
    })

    // Wait only for transcription (fastest part)
    const transcript = await transcriptionPromise

    // Return immediate response with transcript and basic score estimate
    const immediateScore = await generateImmediateScore(transcript, question, persona, subject)
    
    // Send immediate response
    const processingId = randomUUID() // For background processing
    res.json({ 
      transcript, 
      scoring: immediateScore,
      immediate: true, // Flag to indicate this is a fast response
      processingId
    })

    // Continue background processing (don't await)
    setImmediate(async () => {
      try {
        // Background: Get detailed scoring
        const detailedScoring = await scoreAnswer({ question, answer: transcript, cvText })
        
        // Store detailed results temporarily for follow-up retrieval
        const detailedResultKey = `${user?.id || 'anon'}_${Date.now()}_${question.substring(0, 20).replace(/[^a-zA-Z0-9]/g, '')}`
        DETAILED_RESULTS.set(detailedResultKey, {
          timestamp: Date.now(),
          question,
          transcript,
          scoring: detailedScoring,
          processingId
        })
        
        // Cleanup old entries to prevent memory leaks
        const now = Date.now()
        for (const [key, value] of DETAILED_RESULTS.entries()) {
          if (now - value.timestamp > DETAILED_RESULTS_TTL) {
            DETAILED_RESULTS.delete(key)
          }
        }
        
        // Background: Save to database
        if (save && user?.id) {
          const payload = { user_id: user.id, mode, question, answer: transcript, scoring: detailedScoring }
          await sbAdmin.from('attempts').insert(payload).select('id, created_at').single()
        }
        
        console.log('Background processing complete for question:', question.substring(0, 50))
        console.log('Stored detailed result with key:', detailedResultKey)
        console.log('Current DETAILED_RESULTS size:', DETAILED_RESULTS.size)
      } catch (err) {
        console.error('Background processing error:', err)
      }
    })

  } catch (e) { 
    console.error(e) 
    res.status(500).json({ error: 'Fast transcribe failed' }) 
  }
})

// ---------- GET DETAILED RESULTS ----------
app.get('/api/detailed-results/:processingId', lightLimiter, async (req, res) => {
  try {
    const user = currentUser(req)
    const processingId = req.params.processingId
    if (!processingId) {return res.status(400).json({ error: 'processingId required' })}
    
    // Find detailed result matching this processing ID and user
    let foundResult = null
    for (const [key, value] of DETAILED_RESULTS.entries()) {
      if (value.processingId === processingId && key.startsWith(user?.id || 'anon')) {
        foundResult = value
        break
      }
    }
    
    if (!foundResult) {return res.status(404).json({ error: 'Result not found or expired' })}
    
    res.json({
      processingId: foundResult.processingId,
      question: foundResult.question,
      transcript: foundResult.transcript,
      scoring: foundResult.scoring,
      timestamp: foundResult.timestamp
    })
  } catch (e) { 
    console.error(e)
    res.status(500).json({ error: 'Failed to get detailed results' }) 
  }
})

// ---------- TRANSCRIBE + SCORE (LEGACY - FULL PROCESSING) ----------
app.post('/api/transcribe', strictLimiter, requireActiveTokenSession, upload.single('audio'), async (req, res) => {
  try {
    const file = req.file
    const question = (req.body?.question || '').toString()
    const mode = (req.body?.mode || 'live').toString()
    const save = (req.body?.save || '').toString() !== '0'
    let cvText = (req.body?.cvText || '').toString()
const CV_MAX_CHARS = 1200
if (cvText.length > CV_MAX_CHARS) {cvText = cvText.slice(0, CV_MAX_CHARS)}

    if (!file) {return res.status(400).json({ error: 'audio file required' })}
    if (!question) {return res.status(400).json({ error: 'question required' })}

    const audioFile = new File([file.buffer], file.originalname || 'audio.webm', { type: file.mimetype || 'audio/webm' })

    let transcript = ''
    try {
      const tr = await retryOpenAICall(async () => {
        return await openai.audio.transcriptions.create({ file: audioFile, model: TRANSCRIBE_MODEL })
      })
      transcript = tr.text || ''
    } catch (err) { 
      console.error('Transcription error:', {
        status: err?.status,
        code: err?.code,
        message: err?.message?.substring(0, 200)
      })
      transcript = ''
    }

    const scoring = await scoreAnswer({ question, answer: transcript, cvText })

    let saved = null
    const user = currentUser(req)
    if (save && user?.id) {
      const payload = { user_id: user.id, mode, question, answer: transcript, scoring }
      const { data, error } = await sbAdmin.from('attempts').insert(payload).select('id, created_at').single()
      if (!error && data) {saved = data}
    }

    res.json({ transcript, scoring, saved })
  } catch (e) { 
    console.error('Transcribe failed:', {
      status: e?.status,
      code: e?.code,
      message: e?.message?.substring(0, 200)
    })
    const userMessage = isQuotaExceededError(e) ? 'OpenAI quota exceeded' : 
                       isRateLimitError(e) ? 'Service temporarily busy, please try again' : 
                       'Transcription failed'
    res.status(500).json({ error: userMessage })
  }
})

// ---------- ATTEMPTS CRUD ----------
app.post('/api/attempts', authRequired, lightLimiter, async (req, res) => {
  try {
    const user = currentUser(req)
    const { mode, question, answer, scoring } = req.body || {}
    if (!mode || !question || !answer) {return res.status(400).json({ error: 'mode, question, answer required' })}
    const payload = { user_id: user.id, mode: String(mode), question: String(question), answer: String(answer), scoring: scoring ?? null }
    const { data, error } = await sbAdmin.from('attempts').insert(payload).select('id, created_at').single()
    if (error) {return res.status(400).json({ error: error.message })}
    res.json(data)
  } catch (e) { console.error(e); res.status(500).json({ error: 'Save failed' }) }
})

app.get('/api/attempts', authRequired, async (req, res) => {
  try {
    const user = currentUser(req)
    const limit = Math.max(1, Math.min(parseInt(req.query.limit || '100', 10) || 100, 500))
    const { data, error } = await sbAdmin
      .from('attempts')
      .select('id, mode, question, answer, scoring, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) {return res.status(400).json({ error: error.message })}
    res.json({ items: data || [] })
  } catch (e) { console.error(e); res.status(500).json({ error: 'List failed' }) }
})

app.delete('/api/attempts/:id', authRequired, async (req, res) => {
  try {
    const user = currentUser(req)
    const id = req.params.id
    const { error } = await sbAdmin.from('attempts').delete().eq('id', id).eq('user_id', user.id)
    if (error) {return res.status(400).json({ error: error.message })}
    res.json({ ok: true })
  } catch (e) { console.error(e); res.status(500).json({ error: 'Delete failed' }) }
})

// Get detailed scoring results for follow-up questions
app.get('/api/detailed-results/:userId', lightLimiter, async (req, res) => {
  try {
    const user = currentUser(req)
    const requestedUserId = req.params.userId
    
    // Only allow users to access their own results, or anonymous results
    if (user?.id !== requestedUserId && requestedUserId !== 'anon') {
      return res.status(403).json({ error: 'Access denied' })
    }
    
    // Return all detailed results for this user that are still valid
    const now = Date.now()
    const results = []
    
    console.log('Searching detailed results for userId:', requestedUserId)
    console.log('Current DETAILED_RESULTS keys:', Array.from(DETAILED_RESULTS.keys()))
    
    for (const [key, value] of DETAILED_RESULTS.entries()) {
      if (key.startsWith(`${requestedUserId}_`) && (now - value.timestamp < DETAILED_RESULTS_TTL)) {
        results.push({
          processingId: value.processingId,
          question: value.question,
          transcript: value.transcript,
          scoring: value.scoring,
          timestamp: value.timestamp
        })
      }
    }
    
    console.log('Found', results.length, 'results for user', requestedUserId)
    
    res.json({ results })
  } catch (e) { 
    console.error(e) 
    res.status(500).json({ error: 'Failed to fetch detailed results' }) 
  }
})

// ---------- REALTIME: ephemeral token endpoint (locks to mini) ----------
async function createRealtimeSession(req, res) {
  try {
    if (!OPENAI_API_KEY) {return res.status(500).json({ error: 'Missing OPENAI_API_KEY env var' })}
    if (!req.session?.user?.id) {return res.status(401).json({ error: 'Authentication required' })}

    const instructions = (req.body?.instructions || '').toString() ||
      'English only. One short question at a time. No scoring or evaluating.'
    const voice = (req.body?.voice ?? 'alloy') // null → text-only
    const body = {
      model: REALTIME_MODEL,
      modalities: ["audio", "text"],
      instructions,
      turn_detection: { type: 'server_vad' },
      tools: [
        {
          type: 'function',
          name: 'score_answer',
          description: 'Score a candidate answer and save it to the database',
          parameters: {
            type: 'object',
            properties: {
              question: { type: 'string' },
              answer: { type: 'string' },
              score: { type: 'number', minimum: 0, maximum: 100 },
              band: { type: 'string' },
              summary: { type: 'string' },
              strengths: { type: 'array', items: { type: 'string' } },
              improvements: { type: 'array', items: { type: 'string' } }
            },
            required: ['question', 'answer', 'score', 'band']
          }
        }
      ]
    }
    if (voice) {body.voice = String(voice)}
    const r = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'realtime=v1',
      },
      body: JSON.stringify(body),
    })
    if (!r.ok) {
      const text = await r.text()
      console.error('❌ Realtime session creation failed:', r.status, text)
      return res.status(500).json({ error: 'Failed to create Realtime session', detail: text })
    }
    const session = await r.json()
    return res.json({
      client_secret: session.client_secret?.value || session.client_secret,
      expires_at: session.expires_at,
      model: REALTIME_MODEL, // will always be mini (dated alias)
    })
  } catch (err) {
    console.error('Realtime session error:', {
      status: err?.status,
      code: err?.code,
      message: err?.message?.substring(0, 200)
    })
    const userMessage =
      err?.code === 'billing_hard_limit_reached' ? 'OpenAI quota exceeded' :
      err?.status === 429 ? 'Service temporarily busy, please try again' :
      'Failed to create session'
    return res.status(500).json({ error: userMessage })
  }
}

app.post('/api/realtime/session', requireActiveTokenSession, createRealtimeSession)
app.post('/realtime/session', requireActiveTokenSession, createRealtimeSession)

// ---------- Realtime Function Calls ----------
async function handleRealtimeFunctionCall(req, res) {
  if (!req.session?.user?.id) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  const { function_name, arguments: args } = req.body

  try {
    if (function_name === 'score_answer') {
      const { question, answer, score, band, summary, strengths = [], improvements = [] } = args
      
      // Validate the scoring data
      if (!question || !answer || typeof score !== 'number' || !band) {
        return res.status(400).json({ error: 'Missing required scoring fields' })
      }

      // Save the attempt to database
      const attemptResult = await sbAdmin
        .from('attempts')
        .insert({
          user_id: req.session.user.id,
          mode: 'realtime',
          question,
          answer,
          scoring: {
            score: Math.max(0, Math.min(100, score)),
            band,
            summary: summary || '',
            strengths: Array.isArray(strengths) ? strengths : [],
            improvements: Array.isArray(improvements) ? improvements : []
          }
        })
        .select('id, created_at')
        .single()

      if (attemptResult.error) {
        console.error('Failed to save realtime attempt:', attemptResult.error)
        return res.status(500).json({ error: 'Failed to save attempt' })
      }

      return res.json({ 
        success: true, 
        saved: attemptResult.data,
        message: `Answer scored: ${score}/100 (${band})`
      })
    }

    return res.status(400).json({ error: `Unknown function: ${function_name}` })
  } catch (error) {
    console.error('Realtime function call error:', error)
    return res.status(500).json({ error: 'Function call failed' })
  }
}

app.post('/api/realtime/function-call', handleRealtimeFunctionCall)

// ==================== METERING ROUTES ====================
// Note: Using existing token consumption endpoints instead of custom routes

// ==================== TOKEN SYSTEM ROUTES ====================

// GET /api/tokens/balance
app.get('/api/tokens/balance', authRequired, async (req, res) => {
  try {
    const userId = currentUser(req).id;

    const { data, error } = await sbAdmin
      .from("user_wallets")
      .select("balance_tokens")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) return res.status(500).json({ error: error.message });
    const balance = data?.balance_tokens ?? 0;
    res.json({ balanceTokens: Number(balance), rules: TOKEN_RULES });
  } catch (err) {
    console.error('Token balance error:', err);
    res.status(500).json({ error: 'Failed to get token balance' });
  }
});

// POST /api/tokens/grant (server-only; used by webhooks)
app.post('/api/tokens/grant', requireServer, async (req, res) => {
  try {
    const { userId, amount, reason, metadata } = req.body ?? {};
    if (!userId || !amount || !reason) {
      return res.status(400).json({ error: "userId, amount, reason required" });
    }

    const { data, error } = await sbAdmin.rpc("sp_grant_tokens", {
      p_user_id: userId,
      p_amount: amount,
      p_reason: reason,
      p_metadata: metadata ?? {},
    });

    if (error) return res.status(500).json({ error: error.message });
    res.json({ newBalance: Number(data) });
  } catch (err) {
    console.error('Token grant error:', err);
    res.status(500).json({ error: 'Failed to grant tokens' });
  }
});

// POST /api/tokens/consume
// body: { kind: "practice"|"realtime", seconds: number, metadata?: any }
app.post('/api/tokens/consume', authRequired, async (req, res) => {
  try {
    const userId = currentUser(req).id;
    const { kind, seconds, metadata } = req.body ?? {};
    if (!kind || typeof seconds !== "number") {
      return res.status(400).json({ error: "kind and seconds required" });
    }

    const tokens = kind === "realtime"
      ? realtimeSecondsToTokens(seconds)
      : practiceSecondsToTokens(seconds);

    const { data, error } = await sbAdmin.rpc("sp_consume_tokens", {
      p_user_id: userId,
      p_amount: tokens,
      p_reason: `consume_${kind}`,
      p_metadata: metadata ?? {},
    });

    if (error) {
      if (String(error.message).includes("INSUFFICIENT_TOKENS")) {
        return res.status(402).json({ error: "INSUFFICIENT_TOKENS" });
      }
      return res.status(500).json({ error: error.message });
    }
    res.json({ consumedTokens: tokens, newBalance: Number(data) });
  } catch (err) {
    console.error('Token consume error:', err);
    res.status(500).json({ error: 'Failed to consume tokens' });
  }
});

// Token session management for proper gating
const inMemoryTokenSessions = new Map(); // sessionId -> { userId, mode, startedAt, startCharge }

// POST /api/token-session/start
app.post('/api/token-session/start', authRequired, async (req, res) => {
  try {
    const userId = currentUser(req).id;
    const { mode = "practice" } = req.body;

    // Minimum start charge based on mode
    const startCharge = mode === "realtime" ? 1.5 : 0.25;

    // Immediately charge the minimum to start the session
    let tokenConsumed = false;
    try {
      const { data, error } = await sbAdmin.rpc("sp_consume_tokens", {
        p_user_id: userId,
        p_amount: startCharge,
        p_reason: `session_start_${mode}`,
        p_metadata: { mode, startCharge },
      });

      if (error) {
        if (String(error.message).includes("INSUFFICIENT_TOKENS")) {
          return res.status(402).json({ error: "INSUFFICIENT_TOKENS" });
        }
        // Check if it's a function not found error (database schema not set up)
        if (String(error.message).includes("function") && String(error.message).includes("does not exist")) {
          console.warn(`⚠️  Token database schema not set up. Running in development mode. Error: ${error.message}`);
          tokenConsumed = false; // Continue without consuming tokens
        } else {
          return res.status(500).json({ error: error.message });
        }
      } else {
        tokenConsumed = true;
      }
    } catch (dbError) {
      console.warn(`⚠️  Token system error, continuing in development mode: ${dbError.message}`);
      tokenConsumed = false;
    }

    const sessionId = randomUUID();
    inMemoryTokenSessions.set(sessionId, {
      userId,
      mode,
      startedAt: Date.now(),
      startCharge
    });

    res.json({ 
      sessionId, 
      charged: tokenConsumed ? startCharge : 0,
      developmentMode: !tokenConsumed 
    });
  } catch (err) {
    console.error('Token session start error:', err);
    res.status(500).json({ error: 'Failed to start token session' });
  }
});

// POST /api/token-session/stop
app.post('/api/token-session/stop', authRequired, async (req, res) => {
  try {
    const userId = currentUser(req).id;
    const { sessionId, durationMs } = req.body;
    
    const session = inMemoryTokenSessions.get(sessionId);
    if (!session || session.userId !== userId) {
      return res.status(400).json({ error: "INVALID_SESSION" });
    }

    const actualMs = Math.max(0, Number(durationMs ?? (Date.now() - session.startedAt)));
    const actualSeconds = Math.floor(actualMs / 1000);
    
    // Calculate total tokens needed for this session
    const totalTokens = session.mode === "realtime"
      ? realtimeSecondsToTokens(actualSeconds)
      : practiceSecondsToTokens(actualSeconds);

    // Calculate what we still need to charge (total - already charged at start)
    const toSettle = Math.max(0, totalTokens - session.startCharge);

    let settledTokens = 0;
    if (toSettle > 0) {
      try {
        const { data, error } = await sbAdmin.rpc("sp_consume_tokens", {
          p_user_id: userId,
          p_amount: toSettle,
          p_reason: `session_settle_${session.mode}`,
          p_metadata: {
            mode: session.mode,
          durationMs: actualMs,
          startCharge: session.startCharge,
          settleCharge: toSettle,
          totalTokens
        },
      });

        if (error) {
          if (String(error.message).includes("INSUFFICIENT_TOKENS")) {
            return res.status(402).json({ error: "INSUFFICIENT_TOKENS_DURING_SETTLE" });
          }
          // Check if it's a function not found error (database schema not set up)
          if (String(error.message).includes("function") && String(error.message).includes("does not exist")) {
            console.warn(`⚠️  Token database schema not set up. Running in development mode for session stop.`);
            settledTokens = 0; // Continue without settling tokens
          } else {
            return res.status(500).json({ error: error.message });
          }
        } else {
          settledTokens = toSettle;
        }
      } catch (dbError) {
        console.warn(`⚠️  Token system error during session stop, continuing in development mode: ${dbError.message}`);
        settledTokens = 0;
      }
    }

    inMemoryTokenSessions.delete(sessionId);
    res.json({ totalTokens, settledNow: toSettle });
  } catch (err) {
    console.error('Token session stop error:', err);
    res.status(500).json({ error: 'Failed to stop token session' });
  }
});

// POST /api/tokens/ensure - Check if user has enough tokens before starting
app.post('/api/tokens/ensure', authRequired, async (req, res) => {
  try {
    const userId = currentUser(req).id;
    const { min } = req.body;
    
    const { data, error } = await sbAdmin
      .from("user_wallets")
      .select("balance_tokens")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) return res.status(500).json({ error: error.message });
    const balance = Number(data?.balance_tokens ?? 0);
    
    if (balance < Number(min || 0)) {
      return res.status(402).json({
        error: "INSUFFICIENT_TOKENS",
        balance,
        required: Number(min || 0)
      });
    }
    
    res.json({ ok: true, balance });
  } catch (err) {
    console.error('Token ensure error:', err);
    res.status(500).json({ error: 'Failed to ensure tokens' });
  }
});

// Middleware to require active token session for costly operations
function requireActiveTokenSession(req, res, next) {
  const sessionId = req.header("x-token-session-id");
  if (!sessionId) {
    return res.status(401).json({ error: "NO_ACTIVE_SESSION" });
  }
  
  const session = inMemoryTokenSessions.get(sessionId);
  if (!session) {
    return res.status(401).json({ error: "INVALID_SESSION" });
  }
  
  const userId = currentUser(req)?.id;
  if (!userId || session.userId !== userId) {
    return res.status(401).json({ error: "SESSION_USER_MISMATCH" });
  }
  
  // Attach session info to request for potential use
  req.tokenSession = session;
  next();
}

// Optional: session reservation (pre-auth) for realtime
// POST /api/realtime/start { estimateSeconds } -> returns reserved tokens
app.post('/api/realtime/start', authRequired, async (req, res) => {
  try {
    const userId = currentUser(req).id;
    const estimateSeconds = Math.max(10, Number(req.body?.estimateSeconds) || 60);
    const tokens = realtimeSecondsToTokens(estimateSeconds);

    const { data, error } = await sbAdmin.rpc("sp_consume_tokens", {
      p_user_id: userId,
      p_amount: tokens,
      p_reason: "reserve_realtime",
      p_metadata: { estimateSeconds },
    });
    if (error) {
      if (String(error.message).includes("INSUFFICIENT_TOKENS")) {
        return res.status(402).json({ error: "INSUFFICIENT_TOKENS" });
      }
      return res.status(500).json({ error: error.message });
    }
    res.json({ reservedTokens: tokens, reservationBalance: Number(data) });
  } catch (err) {
    console.error('Realtime start error:', err);
    res.status(500).json({ error: 'Failed to start realtime session' });
  }
});

// POST /api/realtime/finish { actualSeconds }
app.post('/api/realtime/finish', authRequired, async (req, res) => {
  try {
    const userId = currentUser(req).id;
    const actualSeconds = Math.max(10, Number(req.body?.actualSeconds) || 60);
    const actualTokens = realtimeSecondsToTokens(actualSeconds);

    // We reserved on start; now reconcile: if actual > reserved, consume diff; if less, grant back diff.
    const reserved = Number(req.body?.reservedTokens) || actualTokens;
    const diff = +(actualTokens - reserved).toFixed(2);

    if (diff === 0) return res.json({ settled: true });

    const fn = diff > 0 ? "sp_consume_tokens" : "sp_grant_tokens";
    const { data, error } = await sbAdmin.rpc(fn, {
      p_user_id: userId,
      p_amount: Math.abs(diff),
      p_reason: "realtime_settlement",
      p_metadata: { actualSeconds, reservedTokens: reserved },
    });

    if (error) return res.status(500).json({ error: error.message });
    res.json({ settled: true, newBalance: Number(data) });
  } catch (err) {
    console.error('Realtime finish error:', err);
    res.status(500).json({ error: 'Failed to finish realtime session' });
  }
});

// ==================== BILLING WEBHOOK ROUTES ====================

// Stripe webhook stub (listen to 'invoice.paid' or 'checkout.session.completed')
app.post('/api/billing/stripe/webhook', async (req, res) => {
  try {
    // TODO: verify signature; here we simulate
    const event = req.body || {};
    const userId = event?.metadata?.userId;
    const planId = event?.metadata?.planId || "starter";

    if (!userId || !PLAN_TOKEN_GRANTS[planId]) {
      return res.status(400).json({ error: "missing userId/planId" });
    }

    const grant = PLAN_TOKEN_GRANTS[planId].monthlyTokens;
    const { data, error } = await sbAdmin.rpc("sp_grant_tokens", {
      p_user_id: userId,
      p_amount: grant,
      p_reason: `stripe_${planId}_monthly_grant`,
      p_metadata: { eventId: event.id || "simulated" },
    });
    if (error) return res.status(500).json({ error: error.message });
    res.json({ ok: true, newBalance: Number(data) });
  } catch (err) {
    console.error('Stripe webhook error:', err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// RevenueCat webhook stub (listen to ENTITLEMENT_ACTIVE)
app.post('/api/billing/revenuecat/webhook', async (req, res) => {
  try {
    const event = req.body || {};
    const userId = event?.app_user_id;
    const planId = event?.entitlement_id || "starter";

    if (!userId || !PLAN_TOKEN_GRANTS[planId]) {
      return res.status(400).json({ error: "missing userId/planId" });
    }

    const grant = PLAN_TOKEN_GRANTS[planId].monthlyTokens;
    const { data, error } = await sbAdmin.rpc("sp_grant_tokens", {
      p_user_id: userId,
      p_amount: grant,
      p_reason: `revenuecat_${planId}_monthly_grant`,
      p_metadata: { event },
    });
    if (error) return res.status(500).json({ error: error.message });
    res.json({ ok: true, newBalance: Number(data) });
  } catch (err) {
    console.error('RevenueCat webhook error:', err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});
// Simple affiliate bind endpoint
app.post('/api/affiliate/bind', authRequired, async (req, res) => {
  try {
    const user = currentUser(req)
    // This is just a placeholder endpoint - affiliate binding logic
    // could be implemented here or may already exist in your profiles table
    res.json({ ok: true, message: 'Affiliate bind endpoint called' })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Affiliate bind failed' })
  }
})
// ---------- RevenueCat Webhook ----------
app.post('/webhooks/revenuecat', express.raw({ type: 'application/json' }), async (req, res) => {
  await handleRevenueCatWebhook(req, res, sbAdmin)
})

// ---------- IAP Receipt Verification ----------
// Note: This endpoint accepts requests from mobile apps, so we don't require auth
// but we'll try to get userId from session if available
app.post('/api/iap/verify', express.json(), async (req, res) => {
  await verifyIAPReceipt(req, res, sbAdmin)
})

// ---------- Health ----------
app.get('/api/health', (req, res) => res.json({ ok: true }))

// Fallback to index.html for client-side routes
app.get('*', (req, res, next) => {
  // Only fall back if this isn't an API route
  if (req.path.startsWith('/api') || req.path.startsWith('/auth')) return next()
  res.sendFile(path.join(SPA_DIR, 'index.html'))
})

// ---------- Start ----------
console.log('Realtime model (locked):', REALTIME_MODEL)
app.listen(PORT, () => { console.log(`API listening on http://localhost:${PORT}`) })
