// web/src/pages/Drill.tsx
import React from 'react'
import { Button } from '../components/ui/button'
import { Textarea } from '../components/ui/textarea'
import { Badge } from '../components/ui/badge'
import { Spinner } from '../components/ui/spinner'
import { api, Scoring } from '../lib/utils'
import { CoursesLayout } from '../layouts'
import { Home as HomeIcon, Mic, Archive, BookOpen, CreditCard, Shuffle, Volume2, Play, Square } from 'lucide-react'
import { getMicStream, pickRecorderMime, pickFileExt } from '../lib/mic'
import { TokenSessionManager, fetchTokenBalance } from '../lib/tokenSession'
import { OutOfTokensModal } from '../components/ui/OutOfTokensModal'
import { createApiWithTokens } from '../lib/apiWithTokens'
import { useTokenGate } from '../lib/tokenValidation'
import { usePracticeMeter } from '../tokens/usePracticeMeter'

const DRILL_BANK = [
  'Tell me about yourself.',
  'Why this course and not a similar one?',
  'Describe a time you handled a setback.',
  'What is your greatest strength?',
  'Explain a complex idea simply.',
  'Tell me about a time you worked in a team.',
]

export default function Drill(){
  const [question, setQuestion] = React.useState(DRILL_BANK[0])
  const [transcript, setTranscript] = React.useState('')
  const [audioURL, setAudioURL] = React.useState<string>('')
  const [myScore, setMyScore] = React.useState<Scoring | null>(null)
  const [modelAnswer, setModelAnswer] = React.useState('')
  const [modelScore, setModelScore] = React.useState<Scoring | null>(null)
  const [loading, setLoading] = React.useState<'idle'|'recording'|'thinking'>('idle')
  const [msg, setMsg] = React.useState<string>('')

  // Live transcription preview
  const [livePreview, setLivePreview] = React.useState<string>('')
  const srRef = React.useRef<any>(null)

  // Token session management
  const [tokenSession] = React.useState(() => new TokenSessionManager("practice"))
  const [tokenBalance, setTokenBalance] = React.useState<number | null>(null)
  const [showOutOfTokensModal, setShowOutOfTokensModal] = React.useState(false)
  
  // Token gate for zero token validation
  const { checkTokensOrShowModal, TokenGateModal } = useTokenGate()
  
  // Practice meter for token consumption
  const meter = usePracticeMeter("DRILL")
  
  // Button handlers that show token modal even when disabled
  const handleStartRecording = () => {
    // If user doesn't have tokens, show modal instead of starting recording
    if (tokenBalance !== null && tokenBalance < 0.25) {
      checkTokensOrShowModal(1)
      return
    }
    // If meter is cooling down or disabled for other reasons, still check tokens
    if (meter.coolingDown && tokenBalance !== null && tokenBalance < 0.25) {
      checkTokensOrShowModal(1)
      return
    }
    // Otherwise, proceed with the original token validation and start recording
    startRecording()
  }
  
  const handleScoreText = () => {
    // If user doesn't have tokens, show modal instead of scoring
    if (tokenBalance !== null && tokenBalance < 0.25) {
      checkTokensOrShowModal(1)
      return
    }
    // Otherwise, proceed with scoring
    scoreText()
  }
  
  // Create API instance with token session support
  const tokenApi = React.useMemo(() => 
    createApiWithTokens(() => tokenSession.getSessionId()), 
    [tokenSession]
  )

  // Refresh token balance
  const refreshTokenBalance = React.useCallback(async () => {
    try {
      const balance = await fetchTokenBalance()
      setTokenBalance(balance)
    } catch (error) {
      console.error('Failed to fetch token balance:', error)
      setTokenBalance(0)
    }
  }, [])

  // Initialize token balance
  React.useEffect(() => {
    refreshTokenBalance()
  }, [refreshTokenBalance])

  // Pull CV text if available (uploaded elsewhere in your app)
  const cvText = (typeof window !== 'undefined' && localStorage.getItem('cvText')) || ''

  // --- Mic recording (simple) ---
  const recRef = React.useRef<MediaRecorder | null>(null)
  const chunksRef = React.useRef<BlobPart[]>([])
  const streamRef = React.useRef<MediaStream | null>(null)

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

  async function startRecording(){
    // Check tokens before starting recording
    if (!checkTokensOrShowModal(1)) {
      return
    }
    
    setMsg('')
    setAudioURL('')
    setTranscript('')
    setMyScore(null)
    setModelAnswer('')
    setModelScore(null)
    try {
      // Start token metering before opening microphone
      await meter.start()
      
      const stream = await getMicStream()
      const mime = pickRecorderMime()
      const rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream)
      recRef.current = rec
      streamRef.current = stream
      chunksRef.current = []
      rec.ondataavailable = e => { if (e.data && e.data.size) chunksRef.current.push(e.data) }
      rec.onstop = async () => {
        try { stream.getTracks().forEach(t => t.stop()) } catch {}
        const blob = new Blob(chunksRef.current, { type: mime || 'application/octet-stream' })
        const url = URL.createObjectURL(blob)
        setAudioURL(url)
        await transcribeAndScore(blob)
      }
      startBrowserSTT()
      rec.start()
      setLoading('recording')
    } catch (e: any) {
      setMsg(e?.message || 'Microphone permission denied')
      setLoading('idle')
    }
  }

  function stopRecording(){
    try { recRef.current?.stop(); setLoading('thinking') } catch {}
    stopBrowserSTT()
    // Don't stop token metering here - it's needed for transcription
    // Metering will be stopped after successful transcription or on error
  }

  // --- STT + scoring flow for audio ---
  async function transcribeAndScore(blob: Blob){
    try {
      const form = new FormData()
      const ext = pickFileExt(blob.type || 'audio/webm')
      // IMPORTANT: field name must match your server's multer config (single('audio'))
      form.append('audio', blob, `audio.${ext}`)
      form.append('question', question)
      if (cvText) form.append('cvText', cvText)

      // Use original transcribe API for detailed scoring
      const { transcript: t, scoring } = await api.transcribe(form)
      const finalTranscript = t || livePreview || ''
      setTranscript(finalTranscript)
      setMyScore(scoring || null)

      // Fetch model answer quickly
      setLoading('thinking')
      const model = await api.modelAnswer({ question, cvText })
      setModelAnswer(model.answer || '')
      setModelScore(model.scoring || null)

      // Save attempt (best-effort)
      try {
        await api.saveAttempt({ mode: 'drill', question, answer: finalTranscript, scoring: scoring || {} })
      } catch {}

      // Clear live preview after successful processing
      setLivePreview('')
      setLoading('idle')
      
      // Stop token metering after successful transcription
      meter.stop()
    } catch (e: any) {
      const text = e?.message || 'Transcription/scoring failed'
      setMsg(text.includes('Unexpected field') ? 'Upload failed: server expected a field named "audio".' : text)
      setLoading('idle')
      
      // Stop token metering on error
      meter.stop()
    }
  }

  // --- Strict scoring for typed text ---
  async function scoreText(ans?: string){
    // Check tokens before scoring typed text
    if (!checkTokensOrShowModal(1)) {
      return
    }
    
    const answer = (ans ?? transcript) || ''
    if (!answer.trim()) return
    setMsg('')
    setLoading('thinking')
    try {
      // Run model answer and scoring in parallel for speed
      const [model, scoring] = await Promise.all([
        api.modelAnswer({ question, cvText }),
        api.score({ question, answer, cvText }),
      ])
      setMyScore(scoring)
      setModelAnswer(model.answer || '')
      setModelScore(model.scoring || null)

      // Save attempt (best-effort, don't block UI)
      try {
        await api.saveAttempt({ mode: 'drill', question, answer, scoring })
      } catch {}

      setLoading('idle')
    } catch (e: any) {
      setMsg(e?.message || 'Scoring failed'); setLoading('idle')
    }
  }

  function pickAnother(){
    const others = DRILL_BANK.filter(q => q !== question)
    const q = others[Math.floor(Math.random() * others.length)] || DRILL_BANK[0]
    setQuestion(q); setTranscript(''); setMyScore(null); setModelAnswer(''); setModelScore(null); setAudioURL(''); setLivePreview('')
  }

  async function readQuestion(){
    try {
      const b = await api.tts(question)
      const u = URL.createObjectURL(b)
      const a = new Audio(u)
      a.playsInline = true
      a.autoplay = true
      await a.play()
    } catch {}
  }

  const recording = loading === 'recording'

  const navigationItems = [
    { id: 'home', icon: <HomeIcon size={24} />, href: '/' },
    { id: 'drill', icon: <Mic size={24} />, label: 'Practice' },
    { id: 'answers', icon: <Archive size={24} />, href: '/answers' },
    { id: 'resources', icon: <BookOpen size={24} />, href: '/resources' },
    { id: 'account', icon: <CreditCard size={24} />, href: '/account' }
  ]

  const questionFilters = [
    { id: 'all', label: 'All Questions', selected: true },
    { id: 'behavioral', label: 'Behavioral', selected: false },
    { id: 'technical', label: 'Technical', selected: false },
    { id: 'situational', label: 'Situational', selected: false }
  ]

  return (
    <CoursesLayout
      headerTitle="Question Practice"
      headerSubtitle="Master common interview questions with AI feedback"
      filters={questionFilters}
      navItems={navigationItems}
      activeNavId="drill"
      showFilters={false}
    >
      {/* Token Warning Banner */}
      {tokenBalance !== null && tokenBalance < 0.25 && (
        <div className="mb-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-200">
          <div className="flex items-center justify-between">
            <span>You have 0 tokens. Buy tokens to use this feature.</span>
            <button
              className="ml-2 underline hover:opacity-80 text-amber-200"
              onClick={() => window.location.href = '/plans'}
            >
              Go to Plans
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4 mt-4">
        {/* Question Section */}
        <div className="bg-card rounded-xl border border-divider p-4 shadow-level-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-title font-bold text-text-primary">Practice Question</h2>
            <Button variant="ghost" size="sm" onClick={pickAnother}>
              <Shuffle size={16} className="mr-2" />
              Shuffle
            </Button>
          </div>

          <div className="text-label font-semibold text-text-secondary mb-2">Question</div>
          <div className="flex items-center justify-between gap-3 mb-4">
            <select
              className="flex-1 rounded-lg border border-border pl-3 pr-8 py-2 bg-card text-text-primary font-primary focus:border-primary focus:outline-none"
              value={question}
              onChange={e => setQuestion(e.target.value)}
            >
              {DRILL_BANK.map((q, i) => <option key={i} value={q}>{q}</option>)}
            </select>
            <Button variant="ghost" size="sm" onClick={readQuestion}>
              <Volume2 size={16} />
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
            {!recording ? (
              <Button 
                variant="primary" 
                className="!text-white w-full sm:min-w-[140px] sm:w-auto" 
                onClick={handleStartRecording}
                disabled={meter.coolingDown}
              >
                <Mic size={16} className="mr-2" />
                Record Answer
              </Button>
            ) : (
              <Button variant="destructive" className="!text-white w-full sm:min-w-[140px] sm:w-auto" onClick={stopRecording}>
                <Square size={16} className="mr-2" />
                Stop Recording
              </Button>
            )}
            <Badge variant={recording ? "destructive" : meter.coolingDown ? "outline" : "secondary"} className="w-full sm:min-w-[120px] sm:w-auto px-6 py-3 text-center text-subtitle">
              {recording ? 'Recording…' : meter.coolingDown ? 'Cooling down…' : 'Ready'}
            </Badge>
            <div className="flex items-center gap-2 ml-auto">
              {cvText ? (
                <Badge variant="outline" title="Using your uploaded CV to personalize the model answer">
                  CV: Active
                </Badge>
              ) : (
                <Badge variant="secondary" title="Upload your CV to personalize model answers">
                  CV: Off
                </Badge>
              )}
              {tokenBalance !== null && (
                <Badge variant="outline" className="px-2 py-1 text-xs">
                  Tokens: {tokenBalance.toFixed(1)}
                </Badge>
              )}
              <Button variant="primary" size="sm" onClick={handleScoreText}>
                <Play size={16} className="mr-2" />
                Score Text
              </Button>
            </div>
          </div>

          {/* Live transcription preview */}
          {loading === 'recording' && livePreview && (
            <div className="mb-4">
              <label className="text-label font-semibold text-text-secondary mb-2 block">
                Live Preview (Recording...)
              </label>
              <div className="rounded-lg border bg-surface-alt p-3 text-sm italic text-text-secondary whitespace-pre-wrap min-h-[2.5rem]">
                {livePreview}
              </div>
            </div>
          )}

          <div>
            <label className="text-label font-semibold text-text-secondary mb-2 block">
              Your Answer
            </label>
            <Textarea
              className="h-24 rounded-lg border-border focus:border-primary resize-none"
              value={transcript}
              onChange={e => setTranscript(e.target.value)}
              placeholder="Type or dictate your answer, then click Score text."
            />
          </div>

          {audioURL && (
            <div className="mt-3 p-3 bg-surface-alt rounded-lg">
              <audio src={audioURL} controls className="w-full" />
            </div>
          )}
        </div>

        {/* Results Section - Only show when there's content */}
        {(myScore || modelAnswer) && (
          <div className="grid gap-4 md:grid-cols-2">
            {/* Your Score */}
            {myScore && (
              <div className="rounded-xl border border-divider bg-card-tinted-lavender p-4 shadow-level-1">
                <div className="text-title font-bold text-text-primary mb-2">
                  Score: {myScore.score}/100 — {myScore.band}
                </div>
                {myScore.summary && (
                  <p className="text-body text-text-secondary mb-3">{myScore.summary}</p>
                )}
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {Array.isArray(myScore.strengths) && myScore.strengths.length > 0 && (
                    <div>
                      <div className="text-label font-semibold text-success mb-1">Strengths</div>
                      <ul className="list-disc pl-5 text-caption text-text-secondary space-y-1">
                        {myScore.strengths.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                  )}
                  {Array.isArray(myScore.improvements) && myScore.improvements.length > 0 && (
                    <div>
                      <div className="text-label font-semibold text-warning mb-1">Areas to Improve</div>
                      <ul className="list-disc pl-5 text-caption text-text-secondary space-y-1">
                        {myScore.improvements.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Model Answer */}
            {modelAnswer && (
              <div className="bg-card rounded-xl border border-divider p-4 shadow-level-1">
                <h3 className="text-title font-bold text-text-primary mb-3">Model Answer</h3>
                {modelScore && (
                  <div className="mb-3 p-3 bg-card-tinted-orange rounded-lg">
                    <div className="text-subtitle font-bold text-text-primary">
                      Model Score: {modelScore.score ?? '—'}/100 — {modelScore.band || '—'}
                    </div>
                    {modelScore.summary && (
                      <p className="text-caption text-text-secondary mt-1">{modelScore.summary}</p>
                    )}
                  </div>
                )}
                <div className="whitespace-pre-wrap text-body text-text-primary leading-relaxed max-h-40 overflow-y-auto">
                  {modelAnswer}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Loading State */}
        {loading === 'thinking' && (
          <div className="bg-card rounded-xl border border-divider p-4 shadow-level-1">
            <div className="flex items-center gap-2 text-body text-text-secondary">
              <Spinner /> Analyzing your answer...
            </div>
          </div>
        )}

        {/* Error Message */}
        {msg && (
          <div className="p-3 bg-error/10 border border-error/20 rounded-lg">
            <p className="text-caption text-error">{msg}</p>
          </div>
        )}
      </div>
      
      {/* Token Gate Modal */}
      <TokenGateModal />
    </CoursesLayout>
  )
}
