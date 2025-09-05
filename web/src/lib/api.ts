// API utilities for fetching user data
export interface Attempt {
  id: string
  mode: string
  question: string
  answer: string
  scoring?: {
    score: number
    band?: string
    summary?: string
    strengths?: string[]
    improvements?: string[]
    followup_questions?: string[]
  } | null
  created_at: string
}

export interface AttemptsResponse {
  items: Attempt[]
}

export async function fetchAttempts(limit = 100): Promise<AttemptsResponse> {
  const response = await fetch(`/api/attempts?limit=${limit}`, {
    credentials: 'include'
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch attempts')
  }
  
  return response.json()
}

export function calculateUserStats(attempts: Attempt[]) {
  if (attempts.length === 0) {
    return {
      totalSessions: 0,
      totalQuestions: 0,
      averageScore: 0,
      questionsThisWeek: 0,
      todayAttempts: 0,
      weeklyProgress: 0
    }
  }

  const now = new Date()
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay())
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  // Count sessions (unique days with attempts)
  const sessionDates = new Set()
  attempts.forEach(attempt => {
    const attemptDate = new Date(attempt.created_at).toDateString()
    sessionDates.add(attemptDate)
  })

  // Count questions this week
  const questionsThisWeek = attempts.filter(attempt => 
    new Date(attempt.created_at) >= weekStart
  ).length

  // Count attempts today
  const todayAttempts = attempts.filter(attempt =>
    new Date(attempt.created_at) >= todayStart
  ).length

  // Calculate average score from attempts with scoring
  const scoredAttempts = attempts.filter(attempt => attempt.scoring?.score)
  const averageScore = scoredAttempts.length > 0 
    ? Math.round(scoredAttempts.reduce((sum, attempt) => sum + (attempt.scoring?.score || 0), 0) / scoredAttempts.length)
    : 0

  // Calculate weekly progress (out of 100, based on target of 10 questions per week)
  const weeklyProgress = Math.min(100, Math.round((questionsThisWeek / 10) * 100))

  return {
    totalSessions: sessionDates.size,
    totalQuestions: attempts.length,
    averageScore,
    questionsThisWeek,
    todayAttempts,
    weeklyProgress
  }
}

export function generateWeeklyChartData(attempts: Attempt[]) {
  const now = new Date()
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const chartData = []

  // Get data for the past 7 days
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(now.getDate() - i)
    const dayName = daysOfWeek[date.getDay()]
    
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const dayEnd = new Date(dayStart)
    dayEnd.setDate(dayEnd.getDate() + 1)

    const dayAttempts = attempts.filter(attempt => {
      const attemptDate = new Date(attempt.created_at)
      return attemptDate >= dayStart && attemptDate < dayEnd
    })

    // Calculate average score for the day
    const scoredAttempts = dayAttempts.filter(attempt => attempt.scoring?.score)
    const avgScore = scoredAttempts.length > 0 
      ? scoredAttempts.reduce((sum, attempt) => sum + (attempt.scoring?.score || 0), 0) / scoredAttempts.length
      : 0

    chartData.push({
      day: dayName,
      attempts: dayAttempts.length,
      score: Math.round(avgScore),
      date: date.toISOString().split('T')[0]
    })
  }

  return chartData
}