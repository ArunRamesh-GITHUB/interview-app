// web/src/pages/LiveInterview.tsx
import React from 'react'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { LoadingOverlay, Spinner } from '../components/ui/spinner'
import { api, Scoring } from '../lib/utils'
import { prepareOverall, pollOverall } from '../lib/overall'
import { useAuth } from '../lib/auth'
import { QuestionBankManager, PersonaKey, OxbridgeSubject } from '../lib/questionBank'
import { QuestionBankManagerComponent } from '../components/ui/question-bank-manager'
import { getMicStream, pickRecorderMime, pickFileExt } from '../lib/mic'

const OXBRIDGE_SUBJECTS: OxbridgeSubject[] = [
  'Engineering','Mathematics','Computer Science','Natural Sciences (Physics)',
  'Natural Sciences (Chemistry)','Economics','PPE','Law','Medicine',
]

// Helpers
function shuffle<T>(arr: T[]) { const a = arr.slice(); for (let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]} return a }

// Interview Settings Component
function InterviewSettings({
  persona, setPersona,
  subject, setSubject,
  maxRounds, setMaxRounds,
  followupCount, setFollowupCount,
  autoMode, setAutoMode,
  disabled
}: {
  persona: PersonaKey
  setPersona: (p: PersonaKey) => void
  subject: OxbridgeSubject
  setSubject: (s: OxbridgeSubject) => void
  maxRounds: number
  setMaxRounds: (n: number) => void
  followupCount: number
  setFollowupCount: (n: number) => void
  autoMode: boolean
  setAutoMode: (b: boolean) => void
  disabled: boolean
}) {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <div className="rounded-lg border border-divider bg-transparent">
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 text-left hover:bg-card/50 rounded-lg transition-colors"
        disabled={disabled}
      >
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium text-text-primary">Interview Settings</div>
          <div className="text-xs text-text-secondary">
            {persona} • {maxRounds} rounds • {followupCount} follow-ups
          </div>
        </div>
        <div className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </div>
      </button>

      {/* Collapsible Content */}
      {isOpen && (
        <div className="px-3 pb-3 border-t border-divider bg-card rounded-b-lg">
          <div className="grid gap-3 md:grid-cols-2 mt-3">
            {/* Persona */}
            <div className="space-y-1">
              <div className="text-sm text-text-secondary">Persona</div>
              <select 
                className="w-full rounded-md border border-divider bg-card text-text-primary px-3 py-2.5 text-sm"
                value={persona} 
                disabled={disabled} 
                onChange={e => setPersona(e.target.value as PersonaKey)}
              >
                <option value="medical">Medical admissions</option>
                <option value="oxbridge">Oxbridge</option>
                <option value="apprenticeship">Degree apprenticeship</option>
              </select>
            </div>

            {/* Subject */}
            {persona === 'oxbridge' && (
              <div className="space-y-1">
                <div className="text-sm text-text-secondary">Subject</div>
                <select 
                  className="w-full rounded-md border border-divider bg-card text-text-primary px-3 py-2.5 text-sm"
                  value={subject} 
                  disabled={disabled} 
                  onChange={e => setSubject(e.target.value as OxbridgeSubject)}
                >
                  {OXBRIDGE_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}

            {/* Rounds */}
            <div className="space-y-1">
              <div className="text-sm text-text-secondary">Rounds (primary questions)</div>
              <select 
                className="w-full rounded-md border border-divider bg-card text-text-primary px-3 py-2.5 text-sm"
                value={maxRounds} 
                disabled={disabled} 
                onChange={e => setMaxRounds(parseInt(e.target.value, 10))}
              >
                {[3, 5, 7, 10].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>

            {/* Follow-ups */}
            <div className="space-y-1">
              <div className="text-sm text-text-secondary">Follow-ups per question</div>
              <select 
                className="w-full rounded-md border border-divider bg-card text-text-primary px-3 py-2.5 text-sm"
                value={String(followupCount)} 
                disabled={disabled} 
                onChange={e => setFollowupCount(parseInt(e.target.value, 10))}
              >
                {[0, 1, 2, 3].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>

            {/* Auto-advance */}
            <div className="space-y-1 md:col-span-2">
              <div className="text-sm text-text-secondary">Auto-advance</div>
              <select 
                className="w-full rounded-md border border-divider bg-card text-text-primary px-3 py-2.5 text-sm"
                value={autoMode ? '1' : '0'} 
                disabled={disabled} 
                onChange={e => setAutoMode(e.target.value === '1')}
              >
                <option value="0">Manual</option>
                <option value="1">Auto (read next)</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Question Bank Management Component
function QuestionBankSection({
  persona,
  subject,
  disabled,
  onManageQuestions
}: {
  persona: PersonaKey
  subject: OxbridgeSubject
  disabled: boolean
  onManageQuestions: () => void
}) {
  const qbManager = QuestionBankManager.getInstance()
  const questions = qbManager.getQuestions(persona, subject)
  
  return (
    <div className="rounded-lg border border-divider bg-transparent">
      <div className="w-full flex items-center justify-between p-3 text-left">
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium text-text-primary">Question Bank</div>
          <div className="text-xs text-text-secondary">
            {questions.primary.length} primary • {questions.extra.length} extra
          </div>
        </div>
        <Button 
          variant="outline" 
          onClick={onManageQuestions}
          disabled={disabled}
          size="sm"
        >
          Manage Questions
        </Button>
      </div>
    </div>
  )
}

function buildPrimaryQueue(persona: PersonaKey, subject: OxbridgeSubject, maxRounds: number): string[] {
  const qbManager = QuestionBankManager.getInstance()
  return qbManager.buildQuestionQueue(persona, subject, maxRounds)
}

type Round = {
  question: string
  transcript?: string
  scoring?: Scoring | null
  audioURL?: string
  savedAt?: string
  kind?: 'primary' | 'followup'
}

export default function LiveInterview(){
  const { user } = useAuth()
  const [persona, setPersona] = React.useState<PersonaKey>('medical')
  const [subject, setSubject] = React.useState<OxbridgeSubject>('Engineering')
  const [queue, setQueue] = React.useState<string[]>([])
  const [qMeta, setQMeta] = React.useState<Array<'primary'|'followup'>>([])
  const [current, setCurrent] = React.useState<number>(-1)
  const [rounds, setRounds] = React.useState<Round[]>([])
  const [status, setStatus] = React.useState<'idle'|'recording'|'transcribing'|'thinking'|'asking'>('idle')
  const [scoringStatus, setScoringStatus] = React.useState<'idle'|'processing'>('idle')
  const [maxRounds, setMaxRounds] = React.useState<number>(5)
  const [followupCount, setFollowupCount] = React.useState<number>(2)
  const [autoMode, setAutoMode] = React.useState<boolean>(false)
  const [msg, setMsg] = React.useState<string>('')

  // Question bank manager
  const [showQuestionManager, setShowQuestionManager] = React.useState<boolean>(false)

  // Review + finish
  const [viewIndex, setViewIndex] = React.useState<number>(-1)
  const [finished, setFinished] = React.useState<boolean>(false)

  // Background overall "LLM insights"
  const overallJobRef = React.useRef<string | null>(null)
  const [overallLLM, setOverallLLM] = React.useState<any>(null)   // {summary, strengthsTop, improvementsTop, band, avg, ...}
  const [warming, setWarming] = React.useState<boolean>(false)

  // Live STT preview & touch swipe (kept from your fast version)
  const [livePreview, setLivePreview] = React.useState<string>('')
  const srRef = React.useRef<any>(null)
  const touchStartX = React.useRef<number | null>(null)

  // Recording
  const recRef = React.useRef<MediaRecorder | null>(null)
  const chunksRef = React.useRef<BlobPart[]>([])
  const streamRef = React.useRef<MediaStream | null>(null)
  
  // Audio playback management to prevent overlaps
  const audioRef = React.useRef<HTMLAudioElement | null>(null)

  const cvText = (typeof window !== 'undefined' && localStorage.getItem('cvText')) || ''

  React.useEffect(() => {
    const base = buildPrimaryQueue(persona, subject, maxRounds)
    setQueue(base)
    setQMeta(Array(base.length).fill('primary'))
    setRounds([])
    setCurrent(-1)
    setViewIndex(-1)
    setFinished(false)
    overallJobRef.current = null
    setOverallLLM(null)
  }, [persona, subject, maxRounds])

  // Function to refresh questions when the question bank is updated
  const refreshQuestions = React.useCallback(() => {
    const base = buildPrimaryQueue(persona, subject, maxRounds)
    setQueue(base)
    setQMeta(Array(base.length).fill('primary'))
    // Don't reset rounds, current, etc. - allow user to continue with new questions
  }, [persona, subject, maxRounds])

  function currentQuestion() { return (current >= 0 && current < queue.length) ? queue[current] : '' }

  async function readOut(q: string){
    try { 
      // Stop any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }
      
      const b = await api.tts(q)
      const u = URL.createObjectURL(b)
      const audio = new Audio(u)
      audio.playsInline = true
      audio.autoplay = true
      audioRef.current = audio
      await audio.play()
    } catch {}
  }

  // Browser live STT (preview)
  function startBrowserSTT() {
    try {
      const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
      if (!SR) return
      const rec = new SR()
      rec.lang = 'en-GB'
      rec.continuous = true
      rec.interimResults = true
      rec.onresult = (e: any) => {
        let buff = ''
        for (let i = e.resultIndex; i < e.results.length; i++) buff += e.results[i][0].transcript
        setLivePreview(buff.trim())
      }
      srRef.current = rec
      setLivePreview('')
      rec.start()
    } catch {}
  }
  function stopBrowserSTT() { try { srRef.current?.stop() } catch {} srRef.current = null }

  function start(){
    if (status !== 'idle') return
    const idx = current < 0 ? 0 : Math.min(current + 1, queue.length - 1)
    setCurrent(idx); setMsg('')
    setStatus('asking') // Temporarily set status to prevent multiple clicks
    readOut(queue[idx]).finally(() => setStatus('idle'))
  }

  async function startRecording(){
    try {
      const stream = await getMicStream()
      const mime = pickRecorderMime()
      const rec = mime
        ? new MediaRecorder(stream, { mimeType: mime, audioBitsPerSecond: 64000 })
        : new MediaRecorder(stream)
      recRef.current = rec; streamRef.current = stream; chunksRef.current = []
      rec.ondataavailable = e => { if (e.data && e.data.size) chunksRef.current.push(e.data) }
      rec.onstop = () => handleStop(mime)
      startBrowserSTT()
      rec.start()
      setStatus('recording')
    } catch (e: any) { setMsg(e?.message || 'Microphone blocked'); setStatus('idle') }
  }
  function stopRecording(){ try { recRef.current?.stop() } catch {} stopBrowserSTT() }

  function answeredRounds() {
    return queue.map((q, i) => ({ i, q, r: rounds[i] }))
      .filter(x => x.r && x.r.transcript && x.r.scoring) as Array<{i:number;q:string;r:Round}>
  }

  // Poll for detailed results and replace fast follow-ups with better ones
  async function pollForDetailedResults(processingId: string, questionIndex: number, originalFollowupCount: number) {
    try {
      // Poll for up to 15 seconds with 2-second intervals
      for (let attempt = 0; attempt < 8; attempt++) {
        await new Promise(resolve => setTimeout(resolve, 2000))
        try {
          const detailedResult = await api.getDetailedResult(processingId)
          
          // Always update with detailed scoring first
          if (detailedResult?.scoring) {
            setRounds(prev => {
              const c = prev.slice()
              if (c[questionIndex]) {
                c[questionIndex] = { ...c[questionIndex], scoring: detailedResult.scoring }
              }
              return c
            })
            setScoringStatus('idle') // Mark scoring as complete
            
            // If no follow-ups to process, we're done
            if (!detailedResult.scoring.followup_questions || !Array.isArray(detailedResult.scoring.followup_questions)) {
              return // Success - detailed scoring updated
            }
          }
          
          // Then handle follow-up questions if present
          if (detailedResult?.scoring?.followup_questions) {
            const slowFollowups = Array.isArray(detailedResult.scoring.followup_questions) 
              ? detailedResult.scoring.followup_questions : []
            const cleanedSlowFollowups = slowFollowups
              .map((s: any) => typeof s === 'string' ? s.trim() : '')
              .filter((s: string) => s && s.length > 10)
              .slice(0, followupCount)
            
            if (cleanedSlowFollowups.length > 0) {
              // Since we've improved immediate contextual followup generation, 
              // always use the detailed followups if they're better quality
              const fastFollowups = queue.slice(questionIndex + 1, questionIndex + 1 + originalFollowupCount)
              
              // Check if slow questions are contextual (reference user's response)
              const slowAreContextual = cleanedSlowFollowups.some(slowQ => {
                const hasSpecificReference = /\b(you mentioned|you said|you described|you talked about|when you|your answer|your response|your example|your approach|your experience|you stated|you explained|you discussed)\b/i.test(slowQ)
                return hasSpecificReference
              })
              
              // Check if fast questions are contextual
              const fastAreContextual = fastFollowups.some(fastQ => {
                const hasSpecificReference = /\b(you mentioned|you said|you described|you talked about|when you|your answer|your response|your example|your approach|your experience|you stated|you explained|you discussed)\b/i.test(fastQ)
                return hasSpecificReference
              })
              
              console.log('Follow-up quality check:', { 
                fastAreContextual, 
                slowAreContextual, 
                fastFollowups, 
                cleanedSlowFollowups 
              })
              
              // Use slow followups if they are contextual, or if fast ones aren't contextual
              if (slowAreContextual || !fastAreContextual) {
                const uniqueSlowFollowups = cleanedSlowFollowups.filter((slowQ: string, i: number, arr: string[]) => 
                  arr.indexOf(slowQ) === i && // Remove duplicates within slow followups
                  !fastFollowups.some(fastQ => fastQ.toLowerCase().includes(slowQ.toLowerCase().slice(0, 20))) // Remove if too similar to fast followup
                )
                // Replace the fast follow-ups with slow ones
                setQueue(qs => {
                  const nq = qs.slice()
                  // Remove old follow-ups
                  nq.splice(questionIndex + 1, originalFollowupCount)
                  // Add new follow-ups
                  nq.splice(questionIndex + 1, 0, ...uniqueSlowFollowups)
                  return nq
                })
                setQMeta(m => {
                  const nm = m.slice()
                  // Remove old follow-up metadata
                  nm.splice(questionIndex + 1, originalFollowupCount)
                  // Add new follow-up metadata
                  nm.splice(questionIndex + 1, 0, ...Array(uniqueSlowFollowups.length).fill('followup'))
                  return nm
                })
                
                // Scoring already updated above
                
                // Questions updated silently
                return // Success - stop polling
              } else {
                // Fast follow-ups are contextual and slow ones aren't better, keep the fast ones
                console.log('Keeping fast follow-ups - they are already contextual')
                // Fast follow-ups kept silently
                return // Stop polling, keep fast follow-ups
              }
            }
          }
        } catch (error) {
          if (attempt === 7) {
            console.warn('Failed to get detailed results after 8 attempts:', error)
          }
        }
      }
    } catch (error) {
      console.error('Error polling for detailed results:', error)
      // Ensure scoring status gets reset even if polling fails
      setScoringStatus('idle')
    }
  }

  // Warm overall in background (called after each answer; also on Finish)
  async function maybeWarmOverall(force = false) {
    const answered = answeredRounds()
    if (!answered.length) return
    // Start when >= 60% answered OR forced (Finish).
    const readyToWarm = force || answered.length >= Math.max(2, Math.ceil(queue.length * 0.6))
    if (!readyToWarm) return
    if (overallJobRef.current) return // already warming or ready
    try {
      setWarming(true)
      const payload = {
        persona,
        subject: persona === 'oxbridge' ? subject : undefined,
        rounds: answered.map(x => ({
          question: x.r.question,
          transcript: x.r.transcript || '',
          scoring: x.r.scoring || null,
          kind: x.r.kind || 'primary',
        })),
      }
      const { job } = await prepareOverall(payload)
      overallJobRef.current = job
      // poll silently in background; swap in when ready
      const result = await pollOverall(job, { timeoutMs: 15000, intervalMs: 700 })
      if (result) setOverallLLM(result)
    } catch {
      // ignore — still show client-side instant overall
    } finally {
      setWarming(false)
    }
  }

  function handleStop(mime: string){
    (async () => {
      try {
        const stream = streamRef.current; if (stream) { try { stream.getTracks().forEach(t => t.stop()) } catch {} }
        const blob = new Blob(chunksRef.current, { type: mime || 'application/octet-stream' })
        const ext = pickFileExt(mime)
        const audioURL = URL.createObjectURL(blob)
        const q = currentQuestion()
        setStatus('transcribing')
        setScoringStatus('processing')

        const form = new FormData()
        form.append('audio', blob, `answer.${ext}`)
        form.append('question', q)
        form.append('mode', 'live')
        form.append('persona', persona)
        if (persona === 'oxbridge') form.append('subject', subject)
        let cv = cvText || ''
        if (persona === 'oxbridge') cv += `\n[Interviewer persona: OXBRIDGE — Subject: ${subject}]`
        if (persona === 'medical') cv += `\n[Interviewer persona: MEDICAL admissions]`
        if (persona === 'apprenticeship') cv += `\n[Interviewer persona: DEGREE APPRENTICESHIP]`
        if (cv) form.append('cvText', cv)

        const result = await api.transcribeFast(form) // returns transcript + immediate scoring with follow-ups
        const isImmediate = (result as any)?.immediate || false
        const processingId = (result as any)?.processingId || null
        const round: Round = {
          question: q,
          transcript: (result as any)?.transcript || livePreview || '',
          scoring: (result as any)?.scoring || null,
          audioURL,
          savedAt: (result as any)?.saved?.created_at || undefined,
          kind: (qMeta[current] || 'primary'),
        }

        // Fast scoring complete - update rounds with immediate results but don't show scoring immediately
        setRounds(prev => { const c = prev.slice(); c[current] = round; return c })
        
        // Don't set scoring status to idle immediately - keep it processing to show "please wait" message
        // The detailed scoring will handle setting this to idle when complete

        // Insert follow-ups for primary questions (now works with immediate response)
        setStatus('thinking')
        let followupsAdded = 0
        try {
          const meta = qMeta[current] || 'primary'
          if (meta === 'primary' && followupCount > 0) {
            const suggested = Array.isArray((result as any)?.scoring?.followup_questions) ? (result as any).scoring.followup_questions : []
            const cleaned = suggested.map((s:any)=> typeof s === 'string' ? s.trim() : '').filter((s:string)=> s && s.length > 4)
            const toAdd = cleaned.slice(0, followupCount)
            if (toAdd.length) {
              setQueue(qs => { const nq = qs.slice(); nq.splice(current + 1, 0, ...toAdd); return nq })
              setQMeta(m => { const nm = m.slice(); nm.splice(current + 1, 0, ...Array(toAdd.length).fill('followup')); return nm })
              followupsAdded = toAdd.length
              // Follow-ups added silently
            } else if (isImmediate) {
              // Quick response processed silently
            }
          }
        } catch (err) {
          // Ignore follow-up errors silently
        }
        

        // Always poll for detailed results to get better scoring
        if (processingId && isImmediate) {
          pollForDetailedResults(processingId, current, followupsAdded)
        }

        // pre-warm overall in the background as we go
        maybeWarmOverall(false)

        setLivePreview('')
        setStatus('idle')
  // keep scoringStatus as 'processing' until detailed results arrive
  setViewIndex(current)

        if (autoMode) {
          setTimeout(() => {
            setCurrent(c => Math.min(c + 1, queue.length - 1))
            const nq = queue[current + 1]; if (nq) readOut(nq)
          }, 200)
        }
      } catch (e: any) {
        setMsg(e?.message || 'Transcribe failed'); setStatus('idle'); setScoringStatus('idle')
      }
    })()
  }

  // Computed overall (instant, client-side)
  function clientOverall() {
    const ans = answeredRounds().map(x => x.r)
    if (!ans.length) return null
    const validScores = ans.filter(r => r.scoring?.score !== null).map(r => r.scoring?.score || 0)
    if (validScores.length === 0) {
      return {
        avg: null,
        band: 'Processing',
        strengths: [],
        improvements: [],
        summary: `You answered ${ans.length} of ${queue.length} questions. Scores are being processed...`
      }
    }
    const avg = Math.round(validScores.reduce((a, s) => a + s, 0) / validScores.length)
    const band = avg >= 85 ? 'Outstanding' : avg >= 70 ? 'Strong' : avg >= 55 ? 'Mixed' : avg >= 40 ? 'Weak' : 'Poor'
    const strengths = ans.flatMap(r => r.scoring?.strengths || [])
    const improvements = ans.flatMap(r => r.scoring?.improvements || [])
    const summary = `You answered ${ans.length} of ${queue.length} questions. Average score ${avg}.`
    return { avg, band, strengths, improvements, summary }
  }
  const overallLocal = clientOverall()

  // Finish now (instant) — we flip UI immediately and (if needed) kick off / finish warm job
  function finishNow() {
    setFinished(true)
    maybeWarmOverall(true) // force-start background job if we haven't yet
  }

  // Completion detection (auto-finish when all answered)
  React.useEffect(() => {
    const allAnswered = queue.length > 0 && queue.every((_, i) => Boolean(rounds[i]?.scoring && rounds[i]?.transcript))
    if (allAnswered) { setFinished(true); maybeWarmOverall(true) }
  }, [queue, rounds])

  // Swipe for review
  function prevAnsweredIndex(from: number) { for (let i=Math.max(0, from-1); i>=0; i--) if (rounds[i]?.scoring) return i; return from }
  function nextAnsweredIndex(from: number) { for (let i=Math.min(queue.length-1, from+1); i<queue.length; i++) if (rounds[i]?.scoring) return i; return from }

  return (
    <div className="min-h-[calc(100vh-140px)] md:h-[calc(100vh-140px)] overflow-y-auto md:overflow-hidden p-4 md:p-0">
      <div className="space-y-6 md:grid md:gap-6 md:grid-cols-2 md:h-full md:space-y-0">
        {/* LEFT: Controls + Queue */}
        <div className="space-y-3 md:overflow-y-auto md:pr-2">
          <div className="flex items-center justify-between">
            <div className="text-xl font-semibold">Live Interview</div>
          </div>

        {/* Interview Settings Panel */}
        <InterviewSettings
          persona={persona}
          setPersona={setPersona}
          subject={subject}
          setSubject={setSubject}
          maxRounds={maxRounds}
          setMaxRounds={setMaxRounds}
          followupCount={followupCount}
          setFollowupCount={setFollowupCount}
          autoMode={autoMode}
          setAutoMode={setAutoMode}
          disabled={status !== 'idle'}
        />

        {/* Question Bank Management Section */}
        <QuestionBankSection
          persona={persona}
          subject={subject}
          disabled={status !== 'idle'}
          onManageQuestions={() => setShowQuestionManager(true)}
        />

        <div className="flex gap-2">
          <Button onClick={start} disabled={!queue.length || status!=='idle'}>Start / Next</Button>
          {status==='recording'
            ? <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={stopRecording}>Stop</Button>
            : <Button onClick={startRecording} disabled={current<0}>Record</Button>}
          <Button variant="outline" onClick={finishNow} disabled={!answeredRounds().length}>
            Finish now
          </Button>
        </div>

        {msg && <div className="text-sm text-red-600">{msg}</div>}

        {/* Question Queue - Horizontal Swipe */}
        <div>
          <div className="text-sm text-text-secondary mb-2 flex items-center justify-between">
            <span>Question Queue</span>
            <span className="text-xs">{current + 1} of {queue.length}</span>
          </div>
          <div 
            className="rounded-xl border border-divider bg-card p-3 overflow-hidden relative"
            onTouchStart={e => { touchStartX.current = e.touches?.[0]?.clientX ?? null }}
            onTouchEnd={e => {
              const sx = touchStartX.current
              if (sx == null) return
              const dx = (e.changedTouches?.[0]?.clientX ?? sx) - sx
              touchStartX.current = null
              if (Math.abs(dx) < 40) return
              
              if (dx > 0 && current > 0) {
                // Swipe right - go to previous question
                setCurrent(current - 1)
              } else if (dx < 0 && current < queue.length - 1) {
                // Swipe left - go to next question
                setCurrent(current + 1)
              }
            }}
          >
            {/* Current Question Display */}
            {current >= 0 && current < queue.length && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="inline-block px-2 py-1 rounded-full border border-divider text-xs text-text-secondary font-medium">
                    Q{current + 1}
                  </span>
                  <span className="inline-block px-2 py-1 rounded-full border border-divider text-xs text-text-secondary">
                    {qMeta[current]}
                  </span>
                  {rounds[current]?.scoring && (
                    <span className={`inline-block px-2 py-1 rounded-full text-white text-xs ${
                      rounds[current]!.scoring!.score === null ? 'bg-gray-500' : 'bg-success'
                    }`}>
                      {rounds[current]!.scoring!.score === null ? '⏳' : `✓ ${rounds[current]!.scoring!.score}`}
                    </span>
                  )}
                </div>
                <div className="text-sm text-text-primary leading-relaxed">
                  {queue[current]}
                </div>
                
                {/* Navigation Dots */}
                <div className="flex items-center justify-center gap-1 pt-2">
                  {queue.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrent(i)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        i === current 
                          ? 'bg-primary w-6' 
                          : rounds[i]?.scoring
                            ? 'bg-success'
                            : 'bg-divider'
                      }`}
                      disabled={status !== 'idle'}
                    />
                  ))}
                </div>
                
                {/* Swipe Hint */}
                <div className="text-xs text-text-secondary text-center pt-1">
                  ← Swipe or tap dots to navigate →
                </div>
              </div>
            )}
            
            {/* Initial State */}
            {current < 0 && (
              <div className="text-center text-sm text-text-secondary py-4">
                <div>Ready to start your interview</div>
                <div className="text-xs mt-1">{queue.length} questions prepared</div>
              </div>
            )}
          </div>
        </div>
      </div>

        {/* RIGHT: Overall + Current result + Review */}
        <div className="space-y-3 relative md:overflow-y-auto md:pl-2">
        {/* Overall (instant local) + hot-swap AI insights when ready */}
        {finished && overallLocal && (
          <div className="rounded-xl border border-divider bg-card p-4">
            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold">Overall result</div>
              <div className="text-sm">
                Avg: <b>{overallLocal.avg === null ? 'Processing' : overallLocal.avg}</b> ({overallLocal.band})
              </div>
            </div>
            <p className="mt-1 text-sm text-text-secondary">{overallLocal.summary}</p>

            {/* If server AI overall is ready, show it; otherwise show quick local breakdown */}
            {overallLLM ? (
              <div className="mt-3 space-y-2 text-sm">
                <div className="font-semibold">AI overall insights</div>
                {overallLLM.overall_summary && <p>{overallLLM.overall_summary}</p>}
                {!!(overallLLM.strengths_top?.length) && (
                  <div>
                    <div className="font-semibold">Top strengths</div>
                    <ul className="list-disc ml-5">{overallLLM.strengths_top.map((s:string,i:number)=><li key={i}>{s}</li>)}</ul>
                  </div>
                )}
                {!!(overallLLM.improvements_top?.length) && (
                  <div>
                    <div className="font-semibold">Top improvements</div>
                    <ul className="list-disc ml-5">{overallLLM.improvements_top.map((s:string,i:number)=><li key={i}>{s}</li>)}</ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-3 space-y-2 text-sm">
                {!!overallLocal.strengths.length && (
                  <div>
                    <div className="font-semibold">Strengths (quick)</div>
                    <ul className="list-disc ml-5">{overallLocal.strengths.slice(0,3).map((s,i)=><li key={i}>{s}</li>)}</ul>
                  </div>
                )}
                {!!overallLocal.improvements.length && (
                  <div>
                    <div className="font-semibold">Improvements (quick)</div>
                    <ul className="list-disc ml-5">{overallLocal.improvements.slice(0,3).map((s,i)=><li key={i}>{s}</li>)}</ul>
                  </div>
                )}
                {warming && <div className="flex items-center gap-2 text-xs text-text-secondary mt-1"><Spinner/> Preparing AI insights…</div>}
              </div>
            )}
          </div>
        )}

        {/* Current question / results */}
        <div className="rounded-xl border border-divider bg-card p-4">
          {current < 0 ? (
            <p className="text-sm text-text-secondary">Your transcript and score will appear here after you stop recording.</p>
          ) : (
            <>
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge>Q{current + 1}/{queue.length}</Badge>
                  {qMeta[current] === 'followup' && <span className="rounded-full border border-divider px-2 py-0.5 text-xs text-text-secondary">Follow-up</span>}
                </div>
                {rounds[current]?.scoring && scoringStatus === 'idle' && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="text-sm font-bold text-text-primary">
                      {rounds[current]!.scoring!.score === null 
                        ? `${rounds[current]!.scoring!.band}` 
                        : `${rounds[current]!.scoring!.score}/100 — ${rounds[current]!.scoring!.band}`
                      }
                    </div>
                    <span className="text-xs bg-success text-white px-2 py-1 rounded-full">⚡</span>
                  </div>
                )}
                {scoringStatus === 'processing' && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1">
                      <Spinner />
                      <span className="text-sm text-text-secondary">Please wait for your response</span>
                    </div>
                  </div>
                )}
              </div>


              {status==='recording' && livePreview && (
                <div className="mt-3">
                  <div className="font-medium">USER (live preview):</div>
                  <div className="rounded-lg border bg-surface-alt p-2 text-sm italic text-text-secondary whitespace-pre-wrap">{livePreview}</div>
                </div>
              )}

              {rounds[current]?.audioURL && (
                <div className="mt-3"><audio controls src={rounds[current]!.audioURL}/></div>
              )}

              {rounds[current]?.transcript && (
                <div className="mt-3">
                  <div className="font-medium">USER:</div>
                  <div className="rounded-lg border bg-surface-alt p-2 text-sm whitespace-pre-wrap text-text-primary">{rounds[current]!.transcript}</div>
                </div>
              )}

              {(rounds[current]?.scoring || scoringStatus === 'processing') && (
                <div className="mt-3 rounded-xl border border-divider bg-card-tinted-lavender p-4 shadow-level-1">
                  {rounds[current]?.scoring && scoringStatus === 'idle' ? (
                    <>
                      {rounds[current]!.scoring!.summary && (
                        <p className="text-body text-text-secondary mb-3">{rounds[current]!.scoring!.summary}</p>
                      )}
                      <div className="space-y-2">
                        {Array.isArray(rounds[current]!.scoring!.strengths) && rounds[current]!.scoring!.strengths!.length > 0 && (
                          <div>
                            <div className="text-label font-semibold text-success mb-1">Strengths</div>
                            <ul className="list-disc pl-5 text-caption text-text-secondary space-y-1">
                              {rounds[current]!.scoring!.strengths!.map((s, i) => <li key={i}>{s}</li>)}
                            </ul>
                          </div>
                        )}
                        
                        {/* Areas to Improve section */}
                        <div>
                          <div className="text-label font-semibold text-warning mb-1">Areas to Improve</div>
                          {Array.isArray(rounds[current]!.scoring!.improvements) && rounds[current]!.scoring!.improvements!.length > 0 && (
                            <ul className="list-disc pl-5 text-caption text-text-secondary space-y-1">
                              {rounds[current]!.scoring!.improvements!.map((s, i) => <li key={i}>{s}</li>)}
                            </ul>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center gap-2 py-4">
                      <Spinner />
                      <span className="text-sm text-text-secondary">
                        Please wait for your response
                      </span>
                    </div>
                  )}
                </div>
              )}

            </>
          )}
        </div>

        {/* Review answers (swipe / arrows) */}
        <div
          className="rounded-xl border border-divider bg-card p-4 select-none"
          onTouchStart={e=>{ touchStartX.current = e.touches?.[0]?.clientX ?? null }}
          onTouchEnd={e=>{
            const sx = touchStartX.current; if (sx==null) return
            const dx = (e.changedTouches?.[0]?.clientX ?? sx) - sx; touchStartX.current = null
            if (Math.abs(dx) < 40) return
            if (viewIndex < 0) return
            setViewIndex(idx => dx < 0 ? nextAnsweredIndex(idx) : prevAnsweredIndex(idx))
          }}
        >
          <div className="flex items-center justify-between">
            <div className="text-lg font-semibold">Review answers</div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={()=>setViewIndex(i=> i<0? i : prevAnsweredIndex(i))}
                disabled={viewIndex <= 0 || !rounds.some(r=>r?.scoring)}>◀</Button>
              <Button variant="outline" onClick={()=>setViewIndex(i=> i<0? i : nextAnsweredIndex(i))}
                disabled={viewIndex < 0 || viewIndex >= queue.length - 1 || !rounds.some((r,idx)=> idx>viewIndex && r?.scoring)}>▶</Button>
            </div>
          </div>

          {!rounds.some(r => r?.scoring) ? (
            <p className="mt-2 text-sm text-text-secondary">No answered questions yet. Record an answer to start reviewing.</p>
          ) : viewIndex < 0 || !rounds[viewIndex]?.scoring ? (
            <p className="mt-2 text-sm text-text-secondary">Select a scored answer using the arrows or swipe.</p>
          ) : (
            <>
              <div className="mt-3 flex items-center justify-between text-sm">
                <div>
                  Viewing <b>{viewIndex + 1}</b> / {queue.length}{' '}
                  {qMeta[viewIndex] === 'followup' && <span className="ml-2 rounded-full border border-divider px-2 py-0.5 text-xs text-text-secondary">Follow-up</span>}
                </div>
                <div className="text-title font-bold text-text-primary">
                  Score: {rounds[viewIndex]!.scoring!.score === null 
                    ? `${rounds[viewIndex]!.scoring!.band}` 
                    : `${rounds[viewIndex]!.scoring!.score}/100 — ${rounds[viewIndex]!.scoring!.band}`
                  }
                </div>
              </div>

              <div className="mt-2">
                <div className="font-medium">Interviewer:</div>
                <p className="text-text-primary">{queue[viewIndex]}</p>
              </div>

              {rounds[viewIndex]?.transcript && (
                <div className="mt-3">
                  <div className="font-medium">USER:</div>
                  <div className="rounded-lg border bg-surface-alt p-2 text-sm whitespace-pre-wrap text-text-primary">{rounds[viewIndex]!.transcript}</div>
                </div>
              )}

              <div className="mt-3 rounded-xl border border-divider bg-card-tinted-lavender p-4 shadow-level-1">
                {rounds[viewIndex]!.scoring!.summary && (
                  <p className="text-body text-text-secondary mb-3">{rounds[viewIndex]!.scoring!.summary}</p>
                )}
                <div className="space-y-2">
                  {Array.isArray(rounds[viewIndex]!.scoring!.strengths) && rounds[viewIndex]!.scoring!.strengths!.length > 0 && (
                    <div>
                      <div className="text-label font-semibold text-success mb-1">Strengths</div>
                      <ul className="list-disc pl-5 text-caption text-text-secondary space-y-1">
                        {rounds[viewIndex]!.scoring!.strengths!.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                  )}
                  {Array.isArray(rounds[viewIndex]!.scoring!.improvements) && rounds[viewIndex]!.scoring!.improvements!.length > 0 && (
                    <div>
                      <div className="text-label font-semibold text-warning mb-1">Areas to Improve</div>
                      <ul className="list-disc pl-5 text-caption text-text-secondary space-y-1">
                        {rounds[viewIndex]!.scoring!.improvements!.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

            </>
          )}
        </div>

        {(status==='transcribing' || status==='thinking' || status==='asking') && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <LoadingOverlay text={status==='transcribing' ? 'Transcribing & fast scoring…' : status==='thinking' ? 'Preparing follow-ups…' : 'Working…'} />
          </div>
        )}
        </div>
      </div>

      {/* Question Bank Manager Modal */}
      <QuestionBankManagerComponent
        isOpen={showQuestionManager}
        onClose={() => {
          setShowQuestionManager(false)
          refreshQuestions()
        }}
        currentPersona={persona}
        currentSubject={subject}
      />
    </div>
  )
}