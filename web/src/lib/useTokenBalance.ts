import { useState, useEffect } from 'react'
import { useAuth } from './auth'

export interface TokenBalance {
  balanceTokens: number
  rules: {
    TOKEN_PER_PRACTICE_MIN: number
    TOKEN_PER_REALTIME_MIN: number
    PRACTICE_ROUNDING_TOKENS: number
    REALTIME_ROUNDING_TOKENS: number
    REALTIME_MIN_TOKENS_PER_SESSION: number
  }
}

export function useTokenBalance() {
  const [balance, setBalance] = useState<TokenBalance | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const fetchBalance = async () => {
    if (!user) {
      setBalance(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/tokens/balance', {
        credentials: 'include',
      })

      if (!response.ok) {
        // If it's a 404 or 500, the token system might not be set up yet
        if (response.status === 404 || response.status === 500) {
          setBalance({ 
            balanceTokens: 0, 
            rules: {
              TOKEN_PER_PRACTICE_MIN: 1,
              TOKEN_PER_REALTIME_MIN: 9,
              PRACTICE_ROUNDING_TOKENS: 0.25,
              REALTIME_ROUNDING_TOKENS: 1.5,
              REALTIME_MIN_TOKENS_PER_SESSION: 5,
            }
          })
          setLoading(false)
          return
        }
        throw new Error('Failed to fetch token balance')
      }

      const data = await response.json()
      setBalance(data)
      setError(null)
    } catch (err) {
      console.error('Token balance fetch error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      // Fallback to 0 balance on error
      setBalance({ 
        balanceTokens: 0, 
        rules: {
          TOKEN_PER_PRACTICE_MIN: 1,
          TOKEN_PER_REALTIME_MIN: 9,
          PRACTICE_ROUNDING_TOKENS: 0.25,
          REALTIME_ROUNDING_TOKENS: 1.5,
          REALTIME_MIN_TOKENS_PER_SESSION: 5,
        }
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBalance()
  }, [user])

  const refetch = () => {
    fetchBalance()
  }

  return {
    balance: balance?.balanceTokens ?? 0,
    rules: balance?.rules,
    loading,
    error,
    refetch,
  }
}