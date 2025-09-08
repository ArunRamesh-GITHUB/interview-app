// Enhanced API utility that includes token session headers
export type Scoring = {
  score: number
  band: string
  summary?: string
  strengths?: string[]
  improvements?: string[]
  followup_questions?: string[]
}

// Generic JSON fetch helper with cookie credentials and optional token session
async function j<T = any>(url: string, options: RequestInit = {}, sessionId?: string): Promise<T> {
  const headers = new Headers(options.headers)
  if (sessionId) {
    headers.set('x-token-session-id', sessionId)
  }
  
  const r = await fetch(url, { 
    credentials: 'include', 
    ...options, 
    headers 
  })
  
  const ct = r.headers.get('content-type') || ''
  if (!r.ok) {
    const message = await r.text().catch(() => 'Request failed')
    throw Object.assign(new Error(message), { status: r.status })
  }
  if (ct.includes('application/json')) return r.json() as Promise<T>

  return r as unknown as T
}

export const createApiWithTokens = (getSessionId: () => string | null) => {
  return {
    // --- Text-to-speech (OpenAI) ---
    async tts(text: string): Promise<Blob> {
      const sessionId = getSessionId()
      if (!sessionId) throw new Error('No active token session')
      
      const r = await fetch(`/api/tts?text=${encodeURIComponent(text)}`, { 
        credentials: 'include',
        headers: { 'x-token-session-id': sessionId }
      })
      if (!r.ok) throw new Error('TTS failed')
      return r.blob()
    },

    // --- Text-to-speech (ElevenLabs proxy, optional) ---
    async tts11(text: string, voiceId?: string): Promise<Blob> {
      const sessionId = getSessionId()
      if (!sessionId) throw new Error('No active token session')
      
      const v = voiceId || '21m00Tcm4TlvDq8ikWAM'
      const r = await fetch(`/api/tts11?text=${encodeURIComponent(text)}&voice=${encodeURIComponent(v)}`, { 
        credentials: 'include',
        headers: { 'x-token-session-id': sessionId }
      })
      if (!r.ok) throw new Error('TTS (11) failed')
      return r.blob()
    },

    // --- STT + scoring (server will also SAVE for live mode by default) ---
    transcribe: (form: FormData) => {
      const sessionId = getSessionId()
      if (!sessionId) throw new Error('No active token session')
      
      return j<{ transcript: string; scoring: Scoring; saved?: { id: string; created_at: string } }>(
        '/api/transcribe', 
        { method: 'POST', body: form }, 
        sessionId
      )
    },

    // --- Fast STT + immediate scoring (returns immediately after transcription) ---
    transcribeFast: (form: FormData) => {
      const sessionId = getSessionId()
      if (!sessionId) throw new Error('No active token session')
      
      return j<{ transcript: string; scoring: Scoring; saved?: { id: string; created_at: string } }>(
        '/api/transcribe-fast', 
        { method: 'POST', body: form }, 
        sessionId
      )
    },

    // --- Score text directly ---
    score: (data: { question: string; answer: string; cvText?: string }) => {
      const sessionId = getSessionId()
      if (!sessionId) throw new Error('No active token session')
      
      return j<Scoring>(
        '/api/score', 
        { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify(data) 
        }, 
        sessionId
      )
    },

    // --- Generate model answer ---
    modelAnswer: (data: { question: string; cvText?: string }) => {
      const sessionId = getSessionId()
      if (!sessionId) throw new Error('No active token session')
      
      return j<{ answer: string; scoring?: Scoring }>(
        '/api/model-answer', 
        { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify(data) 
        }, 
        sessionId
      )
    }
  }
}