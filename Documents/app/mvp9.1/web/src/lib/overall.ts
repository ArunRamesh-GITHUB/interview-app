// web/src/lib/overall.ts
export type OverallJobPayload = {
  persona: 'medical' | 'oxbridge' | 'apprenticeship'
  subject?: string
  rounds: Array<{
    question: string
    transcript: string
    scoring?: {
      score: number
      band?: string
      summary?: string
      strengths?: string[]
      improvements?: string[]
      followup_questions?: string[]
    } | null
    kind?: 'primary' | 'followup'
  }>
}

export async function prepareOverall(payload: OverallJobPayload): Promise<{ job: string }> {
  const r = await fetch('/api/overall/prepare', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    credentials: 'include',
  })
  if (!r.ok) throw new Error('Failed to prepare overall')
  return r.json()
}

export async function pollOverall(job: string, opts: { timeoutMs?: number; intervalMs?: number } = {}) {
  const timeoutMs = opts.timeoutMs ?? 12000
  const intervalMs = opts.intervalMs ?? 600
  const start = Date.now()
  while (true) {
    const r = await fetch(`/api/overall/status?job=${encodeURIComponent(job)}`, { credentials: 'include' })
    if (!r.ok) throw new Error('Failed to check overall status')
    const j = await r.json()
    if (j.status === 'ready') return j.result
    if (Date.now() - start > timeoutMs) return null
    await new Promise(res => setTimeout(res, intervalMs))
  }
}
