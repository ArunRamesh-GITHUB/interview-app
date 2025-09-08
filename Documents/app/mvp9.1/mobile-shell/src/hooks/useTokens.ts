import { useState, useEffect, useCallback } from 'react'
import { purchaseService } from '../lib/purchaseService'

interface TokenState {
  balance: number
  loading: boolean
  error: string | null
}

interface UseTokensResult extends TokenState {
  checkBalance: () => Promise<void>
  initializePurchases: (userId: string) => Promise<void>
  isSubscribed: boolean
}

export function useTokens(userId?: string): UseTokensResult {
  const [tokenState, setTokenState] = useState<TokenState>({
    balance: 0,
    loading: true,
    error: null,
  })
  const [isSubscribed, setIsSubscribed] = useState(false)

  const checkBalance = useCallback(async () => {
    if (!userId) return

    try {
      setTokenState(prev => ({ ...prev, loading: true, error: null }))
      
      // TODO: Replace with actual API call to your server
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/wallet`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setTokenState(prev => ({ 
          ...prev, 
          balance: data.balance || 0, 
          loading: false 
        }))
      } else {
        throw new Error('Failed to fetch token balance')
      }
    } catch (error) {
      console.error('Failed to fetch token balance:', error)
      setTokenState(prev => ({ 
        ...prev, 
        error: 'Failed to load balance', 
        loading: false 
      }))
    }
  }, [userId])

  const initializePurchases = useCallback(async (userId: string) => {
    try {
      await purchaseService.initialize(userId)
      const subscriptionStatus = await purchaseService.isSubscribed()
      setIsSubscribed(subscriptionStatus)
    } catch (error) {
      console.error('Failed to initialize purchases:', error)
    }
  }, [])

  useEffect(() => {
    if (userId) {
      checkBalance()
      initializePurchases(userId)
    }
  }, [userId, checkBalance, initializePurchases])

  return {
    ...tokenState,
    checkBalance,
    initializePurchases,
    isSubscribed,
  }
}

// Helper hook for checking if user has sufficient tokens
export function useTokenGuard(requiredTokens: number = 1) {
  return useCallback((currentBalance: number, onInsufficientTokens: () => void) => {
    if (currentBalance < requiredTokens) {
      onInsufficientTokens()
      return false
    }
    return true
  }, [requiredTokens])
}