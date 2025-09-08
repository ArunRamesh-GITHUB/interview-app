import React from 'react'
import { Button } from '../components/ui/button'
import { useAuth } from '../lib/auth'
import { PersonaKey, OxbridgeSubject, PERSONA_CONFIGS, OXBRIDGE_SUBJECTS, buildInstructions } from '../lib/personas'
import { RealtimeQuestionBankManager, RealtimePersonaKey, RealtimeOxbridgeSubject } from '../lib/realtimeQuestionBank'
import { RealtimeQuestionBankManagerComponent } from '../components/ui/realtime-question-bank-manager'
import { TokenSessionManager, fetchTokenBalance } from '../lib/tokenSession'
import { OutOfTokensModal } from '../components/ui/OutOfTokensModal'
import { Badge } from '../components/ui/badge'
import { useTokenGate } from '../lib/tokenValidation'

type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'error'


export default function RealtimeInterview() {
  const { user } = useAuth()
  const [status, setStatus] = React.useState<ConnectionStatus>('idle')
  const [persona, setPersona] = React.useState<PersonaKey | null>(null)
  const [subject, setSubject] = React.useState<OxbridgeSubject | null>(null)
  const [instructions, setInstructions] = React.useState('You are a concise interview coach. Keep replies brief and ask one question at a time.')
  const [showPreview, setShowPreview] = React.useState(false)
  const [errorMsg, setErrorMsg] = React.useState('')
  const [isMuted, setIsMuted] = React.useState(false)
  const [enableRating, setEnableRating] = React.useState(false)
  const [selectedDuration, setSelectedDuration] = React.useState<number>(5)
  const [timeRemaining, setTimeRemaining] = React.useState<number | null>(null)
  const [timerInterval, setTimerInterval] = React.useState<NodeJS.Timeout | null>(null)
  const [showQuestionManager, setShowQuestionManager] = React.useState<boolean>(false)

  // Token session management
  const [tokenSession] = React.useState(() => new TokenSessionManager("realtime"))
  const [tokenBalance, setTokenBalance] = React.useState<number | null>(null)
  const [showOutOfTokensModal, setShowOutOfTokensModal] = React.useState(false)
  
  // Token gate for zero token validation
  const { checkTokensOrShowModal, TokenGateModal } = useTokenGate()

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

  // Refs for WebRTC
  const pcRef = React.useRef<RTCPeerConnection | null>(null)
  const dcRef = React.useRef<RTCDataChannel | null>(null)
  const localStreamRef = React.useRef<MediaStream | null>(null)
  const audioRef = React.useRef<HTMLAudioElement>(null)
  const primedRef = React.useRef(false)


  const startTimer = () => {
    const durationInSeconds = selectedDuration * 60
    setTimeRemaining(durationInSeconds)
    
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(interval)
          setTimerInterval(null)
          disconnect()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    
    setTimerInterval(interval)
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const cleanup = async () => {
    // Stop token session
    if (tokenSession.isActive()) {
      try {
        await tokenSession.stop()
        await refreshTokenBalance()
      } catch (e) {
        console.warn("Token session stop failed:", e)
      }
    }
    
    // Clear timer
    if (timerInterval) {
      clearInterval(timerInterval)
      setTimerInterval(null)
    }
    setTimeRemaining(null)
    
    // Stop local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop())
      localStreamRef.current = null
    }
    
    // Close data channel
    if (dcRef.current) {
      dcRef.current.close()
      dcRef.current = null
    }
    
    // Close peer connection
    if (pcRef.current) {
      pcRef.current.close()
      pcRef.current = null
    }
    
    setStatus('idle')
    setIsMuted(false)
  }

  const connect = async () => {
    if (!user) {
      setErrorMsg('Please sign in first')
      return
    }
    
    // Check tokens before connecting (realtime requires minimum 5 tokens)
    if (!checkTokensOrShowModal(5)) {
      return
    }

    setStatus('connecting')
    setErrorMsg('')

    try {
      // Start token session before connecting
      if (!tokenSession.isActive()) {
        await tokenSession.start()
        await refreshTokenBalance()
      }
      // 1. Get ephemeral token
      const voice = persona ? PERSONA_CONFIGS[persona].voiceDefault || 'alloy' : 'alloy'
      const finalInstructions = persona ? buildInstructions(persona, subject || undefined, enableRating) : instructions
      
      const sessionRes = await fetch('/api/realtime/session', {
        method: 'POST',
        credentials: 'include',
        headers: { 
          'Content-Type': 'application/json',
          'x-token-session-id': tokenSession.getSessionId() || ''
        },
        body: JSON.stringify({
          instructions: finalInstructions,
          voice
        })
      })

      if (!sessionRes.ok) {
        throw new Error(`Session request failed: ${sessionRes.status}`)
      }

      const sessionData = await sessionRes.json()
      const ephemeralKey = sessionData.client_secret?.value || sessionData.client_secret || sessionData.value
      
      if (!ephemeralKey) {
        throw new Error('No ephemeral key in response')
      }
      

      // 2. Get microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      localStreamRef.current = stream

      // 3. Create peer connection
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      })
      pcRef.current = pc

      // Add local audio track
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream)
      })

      // Add receive transceiver for remote audio
      pc.addTransceiver('audio', { direction: 'recvonly' })

      // Handle remote audio
      pc.ontrack = (event) => {
        if (audioRef.current && event.streams[0]) {
          audioRef.current.srcObject = event.streams[0]
        }
      }

      // 4. Create data channel
      const dc = pc.createDataChannel('oai-events')
      dcRef.current = dc

      dc.onopen = async () => {
        primedRef.current = false
        
        const finalInstructions = persona ? buildInstructions(persona, subject || undefined, enableRating) : instructions
        const voice = persona ? PERSONA_CONFIGS[persona].voiceDefault || 'alloy' : 'alloy'
        const sessionUpdate = {
          type: 'session.update',
          session: {
            instructions: finalInstructions,
            voice,
            turn_detection: { type: 'server_vad' },
            input_audio_transcription: { model: 'whisper-1' }
          }
        }
        dc.send(JSON.stringify(sessionUpdate))
        
        // Start token metering after successful connection
        try {
          await meter.start()
        } catch (e) {
          console.warn("Token metering failed to start:", e)
          // Connection can continue even if metering fails
        }
        
        setStatus('connected')
        startTimer()
      }

      dc.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          
          if ((message.type === 'session.updated' || message.type === 'session.created') && !primedRef.current) {
            primedRef.current = true
            sendFirstQuestion()
          }
        } catch (e) {
        }
      }

      dc.onerror = (error) => {
        setErrorMsg('Data channel error')
      }

      // 5. Create offer and exchange SDP
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      // Send SDP to OpenAI
      const realtimeRes = await fetch('https://api.openai.com/v1/realtime?model=gpt-4o-mini-realtime-preview-2024-12-17', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ephemeralKey}`,
          'Content-Type': 'application/sdp',
          'OpenAI-Beta': 'realtime=v1'
        },
        body: offer.sdp
      })

      if (!realtimeRes.ok) {
        const errorText = await realtimeRes.text()
        
        // Handle specific error cases with user-friendly messages
        if (realtimeRes.status === 503) {
          throw new Error('The AI service is temporarily unavailable. This usually means you\'ve run out of tokens or the service is overloaded. Please try again in a few moments or check your token balance.')
        } else if (realtimeRes.status === 401) {
          throw new Error('Authentication failed. Please refresh the page and try again.')
        } else if (realtimeRes.status === 429) {
          throw new Error('Rate limit exceeded. Please wait a moment before trying again.')
        } else if (realtimeRes.status === 400) {
          throw new Error('Invalid request. Please check your settings and try again.')
        } else {
          throw new Error(`Connection failed (Error ${realtimeRes.status}). Please try again or contact support if the issue persists.`)
        }
      }

      const answerSdp = await realtimeRes.text()
      await pc.setRemoteDescription({
        type: 'answer',
        sdp: answerSdp
      })

    } catch (error: any) {
      if (error?.message === 'INSUFFICIENT_TOKENS') {
        setShowOutOfTokensModal(true)
        setStatus('idle')
      } else {
        setErrorMsg(error.message)
        setStatus('error')
      }
      cleanup().catch(console.error)
    }
  }

  const disconnect = () => {
    cleanup().catch(console.error)
  }

  const sendFirstQuestion = () => {
    if (!dcRef.current || dcRef.current.readyState !== 'open') return
    const responseCreate = {
      type: 'response.create',
      response: { modalities: ['audio', 'text'] }
    }
    dcRef.current.send(JSON.stringify(responseCreate))
  }

  const applyPersona = () => {
    if (!dcRef.current || dcRef.current.readyState !== 'open') return
    
    if (persona === 'oxbridge' && !subject) {
      setErrorMsg('Please select an Oxbridge subject before applying the persona.')
      return
    }
    
    const finalInstructions = persona ? buildInstructions(persona, subject || undefined, enableRating) : instructions
    const voice = persona ? PERSONA_CONFIGS[persona].voiceDefault || 'alloy' : 'alloy'
    
    const sessionUpdate = {
      type: 'session.update',
      session: {
        instructions: finalInstructions,
        voice,
        turn_detection: { type: 'server_vad' },
        input_audio_transcription: { model: 'whisper-1' }
      }
    }
    dcRef.current.send(JSON.stringify(sessionUpdate))
    
    primedRef.current = true
    sendFirstQuestion()
  }

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks()
      audioTracks.forEach(track => {
        track.enabled = isMuted
      })
      setIsMuted(!isMuted)
    }
  }

  // Make RealtimeQuestionBankManager available globally for personas.ts
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).RealtimeQuestionBankManager = RealtimeQuestionBankManager
    }
  }, [])

  // Cleanup on unmount
  React.useEffect(() => {
    return cleanup
  }, [])

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6 min-h-screen overflow-y-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold mb-2">Realtime Interview</h1>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${
            status === 'connected' ? 'bg-green-500' :
            status === 'connecting' ? 'bg-yellow-500 animate-pulse' :
            status === 'error' ? 'bg-red-500' :
            'bg-text-secondary'
          }`} />
          <span className="text-sm text-text-secondary capitalize">{status}</span>
          {timeRemaining !== null && (
            <>
              <span className="text-text-secondary">•</span>
              <span className={`text-sm font-mono ${
                timeRemaining <= 30 ? 'text-error font-bold' : 'text-text-primary'
              }`}>
                {formatTime(timeRemaining)}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Error Display */}
      {errorMsg && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">Connection Error</h3>
              <p className="text-sm text-red-700 dark:text-red-300">{errorMsg}</p>
              {errorMsg.includes('tokens') && (
                <div className="mt-3">
                  <button
                    onClick={() => window.location.href = '/plans'}
                    className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-red-800 dark:text-red-200 bg-red-100 dark:bg-red-800/30 border border-red-300 dark:border-red-700 rounded-md hover:bg-red-200 dark:hover:bg-red-800/50 transition-colors"
                  >
                    Get More Tokens
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={() => setErrorMsg('')}
              className="flex-shrink-0 text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-300"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Question Bank Section */}
      {user && (
        <div className="rounded-lg border border-divider bg-transparent">
          <div className="w-full flex items-center justify-between p-3 text-left">
            <div className="flex items-center gap-2">
              <div className="text-sm font-medium text-text-primary">Question Bank</div>
              <div className="text-xs text-text-secondary">
                {(() => {
                  try {
                    const qbManager = RealtimeQuestionBankManager.getInstance()
                    const realtimePersona = persona === 'medicine' ? 'medicine' : 
                                           persona === 'oxbridge' ? 'oxbridge' : 'apprenticeship'
                    const questions = persona ? qbManager.getQuestions(realtimePersona as RealtimePersonaKey, subject as RealtimeOxbridgeSubject || undefined) : []
                    return `${questions.length} questions available`
                  } catch {
                    return 'Question bank ready'
                  }
                })()}
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setShowQuestionManager(true)}
              disabled={status === 'connecting'}
              size="sm"
            >
              Manage Questions
            </Button>
          </div>
        </div>
      )}

      {/* Auth Check */}
      {!user && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-yellow-800">Please sign in to use the Realtime NailIT Interview.</p>
        </div>
      )}

      {/* Token Warning Banner */}
      {user && tokenBalance !== null && tokenBalance < 1.5 && (
        <div className="mb-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-200">
          <div className="flex items-center justify-between">
            <span>You have {tokenBalance} tokens. You need at least 1.5 tokens to use realtime features.</span>
            <button
              className="ml-2 underline hover:opacity-80 text-amber-200"
              onClick={() => window.location.href = '/plans'}
            >
              Go to Plans
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4 sm:space-y-6">
        {/* Controls */}
        <div className="space-y-3 sm:space-y-4">
          {/* Interview Duration Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Interview Duration</label>
            <div className="flex gap-2 flex-wrap">
              {[1, 2, 3, 5].map((minutes) => (
                <button
                  key={minutes}
                  onClick={() => setSelectedDuration(minutes)}
                  className={`px-4 py-2 text-sm border rounded-md transition-colors ${
                    selectedDuration === minutes
                      ? 'bg-primary text-primary-on border-primary'
                      : 'bg-card text-text-primary border-border hover:border-primary'
                  }`}
                  disabled={status !== 'idle'}
                >
                  {minutes} min{minutes !== 1 ? 's' : ''}
                </button>
              ))}
            </div>
          </div>
          
          {/* Persona Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Interview Persona</label>
            
            <div className="flex gap-2 mb-2 flex-wrap">
              {(Object.keys(PERSONA_CONFIGS) as PersonaKey[]).map((key) => (
                <button
                  key={key}
                  onClick={() => {
                    setPersona(key)
                    if (key !== 'oxbridge') setSubject(null)
                  }}
                  className={`px-3 py-2 text-sm border rounded-md transition-colors ${
                    persona === key
                      ? 'bg-primary text-primary-on border-primary'
                      : 'bg-card text-text-primary border-border hover:border-primary'
                  }`}
                  disabled={status === 'connecting'}
                >
                  {PERSONA_CONFIGS[key].label}
                </button>
              ))}
              <button
                onClick={() => {
                  setPersona(null)
                  setSubject(null)
                }}
                className={`px-3 py-2 text-sm border rounded-md transition-colors ${
                  persona === null
                    ? 'bg-primary text-primary-on border-primary'
                    : 'bg-card text-text-primary border-border hover:border-primary'
                }`}
                disabled={status === 'connecting'}
              >
                Custom
              </button>
            </div>
            
            {persona === 'oxbridge' && (
              <div className="mt-2">
                <label className="block text-sm font-medium mb-1">Subject</label>
                <select
                  className="w-full p-2 border border-divider bg-card text-text-primary rounded-md"
                  value={subject || ''}
                  onChange={(e) => setSubject(e.target.value as OxbridgeSubject || null)}
                  disabled={status === 'connecting'}
                >
                  <option value="">Select subject...</option>
                  {OXBRIDGE_SUBJECTS.map((subj) => (
                    <option key={subj} value={subj}>{subj}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* AI Rating Toggle and Connect Button */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={enableRating}
                  onChange={(e) => setEnableRating(e.target.checked)}
                  disabled={status === 'connecting'}
                  className="w-4 h-4 rounded border-divider"
                />
                Enable AI Rating (1-10 scale after each response)
              </label>
              <p className="text-xs text-text-secondary mt-1">
                When enabled, the AI will rate your answers on a scale of 1-10 after each response.
              </p>
            </div>
            
            {/* Connect/Control Buttons */}
            <div className="flex gap-1 sm:gap-2 flex-wrap items-center">
              <Button
                onClick={connect}
                disabled={status !== 'idle' || !user || (persona === 'oxbridge' && !subject) || (tokenBalance !== null && tokenBalance < 1.5)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm px-2 sm:px-4"
              >
                Connect
              </Button>
              
              {tokenBalance !== null && (
                <Badge variant="outline" className="px-2 py-1 text-xs">
                  Tokens: {tokenBalance?.toFixed(1) || '0.0'}
                </Badge>
              )}
              
              {status === 'connected' && (
                <>
                  <Button
                    onClick={applyPersona}
                    variant="outline"
                    className="bg-white hover:bg-gray-50 text-gray-900 border-gray-300 text-xs sm:text-sm px-2 sm:px-4"
                    disabled={persona === 'oxbridge' && !subject}
                  >
                    Apply Persona
                  </Button>
                  
                  <Button
                    onClick={toggleMute}
                    variant="outline"
                    className="bg-white hover:bg-gray-50 text-gray-900 border-gray-300 text-xs sm:text-sm px-2 sm:px-4"
                  >
                    {isMuted ? 'Unmute' : 'Mute'}
                  </Button>
                  
                  <div className="ml-2 sm:ml-4">
                    <Button
                      onClick={disconnect}
                      className="bg-red-600 hover:bg-red-700 text-white text-sm sm:text-base px-4 sm:px-6 py-2"
                    >
                      Disconnect
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Custom Instructions (only show when no persona) */}
          {persona === null && (
            <div>
              <label className="block text-sm font-medium mb-2">Custom Instructions</label>
              <textarea
                className="w-full p-3 border border-divider bg-card text-text-primary rounded-md"
                rows={4}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                disabled={status !== 'idle'}
              />
            </div>
          )}
          
          {/* Instructions Preview */}
          {persona && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Generated Instructions</label>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="text-sm text-primary hover:text-primary/80"
                >
                  {showPreview ? 'Hide' : 'Show'} Preview
                </button>
              </div>
              {showPreview && (
                <textarea
                  className="w-full p-3 border rounded-md bg-surface-alt text-sm text-text-primary"
                  rows={6}
                  value={buildInstructions(persona, subject || undefined, enableRating)}
                  readOnly
                />
              )}
            </div>
          )}

          
          {persona === 'oxbridge' && !subject && (
            <p className="text-sm text-orange-600">Please select a subject to enable connection.</p>
          )}

        </div>
      </div>
      
      {/* Hidden audio element for remote audio playback */}
      <audio ref={audioRef} autoPlay playsInline style={{ display: 'none' }} />
      
      {/* Realtime Question Bank Manager Modal */}
      <RealtimeQuestionBankManagerComponent
        isOpen={showQuestionManager}
        onClose={() => setShowQuestionManager(false)}
        currentPersona={persona as RealtimePersonaKey | null}
        currentSubject={subject as RealtimeOxbridgeSubject | null}
      />

      {/* Out of Tokens Modal */}
      <OutOfTokensModal
        open={showOutOfTokensModal}
        onClose={() => setShowOutOfTokensModal(false)}
        currentBalance={tokenBalance || 0}
      />
      
      {/* Token Gate Modal */}
      <TokenGateModal />
    </div>
  )
}