// web/src/lib/utils.ts
export function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(' ')
}

// Generic JSON fetch helper with cookie credentials
async function j<T = any>(url: string, options: RequestInit = {}): Promise<T> {
  const r = await fetch(url, { credentials: 'include', ...options })
  const ct = r.headers.get('content-type') || ''
  if (!r.ok) {
    const message = await r.text().catch(() => 'Request failed')
    throw Object.assign(new Error(message), { status: r.status })
  }
  if (ct.includes('application/json')) return r.json() as Promise<T>

  return r as unknown as T
}

export type Scoring = {
  score: number
  band: string
  summary?: string
  strengths?: string[]
  improvements?: string[]
  followup_questions?: string[]
}

export const api = {
  // --- Auth (optional helpers if you need them anywhere) ---
  me: () => j<{ user: { id: string; email: string } | null }>('/api/me'),

  // --- Text-to-speech (OpenAI) ---
  async tts(text: string): Promise<Blob> {
    const r = await fetch(`/api/tts?text=${encodeURIComponent(text)}`, { credentials: 'include' })
    if (!r.ok) throw new Error('TTS failed')
    return r.blob()
  },

  // --- Text-to-speech (ElevenLabs proxy, optional) ---
  async tts11(text: string, voiceId?: string): Promise<Blob> {
    const v = voiceId || '21m00Tcm4TlvDq8ikWAM'
    const r = await fetch(`/api/tts11?text=${encodeURIComponent(text)}&voice=${encodeURIComponent(v)}`, { credentials: 'include' })
    if (!r.ok) throw new Error('TTS (11) failed')
    return r.blob()
  },

  // --- STT + scoring (server will also SAVE for live mode by default) ---
  transcribe: (form: FormData) => j<{ transcript: string; scoring: Scoring; saved?: { id: string; created_at: string } }>('/api/transcribe', { method: 'POST', body: form }),

  // --- Fast STT + immediate scoring (returns immediately after transcription) ---
  transcribeFast: (form: FormData) => j<{ transcript: string; scoring: Scoring; immediate?: boolean; processingId?: string }>('/api/transcribe-fast', { method: 'POST', body: form }),

  // --- Get detailed results by processing ID ---
  getDetailedResult: (processingId: string) => j<{ processingId: string; question: string; transcript: string; scoring: Scoring; timestamp: number }>(`/api/detailed-results/${processingId}`),

  // --- Strict scoring for typed/speech answers ---
  score: (payload: { question: string; answer: string; cvText?: string }) =>
    j<Scoring>('/api/score', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) }),

  // --- Concise model answer + its score ---
  modelAnswer: (payload: { question: string; cvText?: string }) =>
    j<{ answer: string; scoring: Scoring }>('/api/model-answer', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) }),

  // --- Attempts CRUD ---
  saveAttempt: (payload: { mode: 'live' | 'drill' | 'agent'; question: string; answer: string; scoring: any }) =>
    j<{ id: string; created_at: string }>('/api/attempts', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) }),

  listAttempts: (limit = 100) =>
    j<{ items: any[] }>(`/api/attempts?limit=${limit}&include_content=true`),

  deleteAttempt: (id: string) =>
    j<{ ok: true }>(`/api/attempts/${id}`, { method: 'DELETE' }),
  
  // --- Realtime function calls ---
  realtimeFunctionCall: (payload: { function_name: string; arguments: any }) =>
    j<{ success: boolean; saved?: any; message?: string }>('/api/realtime/function-call', { 
      method: 'POST', 
      headers: { 'content-type': 'application/json' }, 
      body: JSON.stringify(payload) 
    }),
}
