import { useState, useEffect } from 'react'
import { fetchAttempts, calculateUserStats, generateWeeklyChartData, type Attempt } from './api'

interface DashboardData {
  stats: {
    totalSessions: number
    totalQuestions: number
    averageScore: number
    questionsThisWeek: number
    todayAttempts: number
    weeklyProgress: number
  }
  chartData: Array<{
    day: string
    attempts: number
    score: number
    date: string
  }>
  cvReady: boolean
  loading: boolean
  error: string | null
}

export function useDashboardData(): DashboardData {
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Check if CV is uploaded
  const cvReady = typeof window !== 'undefined' && Boolean(localStorage.getItem('cvText'))

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        setError(null)
        const data = await fetchAttempts(200) // Get last 200 attempts
        setAttempts(data.items)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data')
        console.error('Failed to load dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const stats = calculateUserStats(attempts)
  const chartData = generateWeeklyChartData(attempts)

  return {
    stats,
    chartData,
    cvReady,
    loading,
    error
  }
}