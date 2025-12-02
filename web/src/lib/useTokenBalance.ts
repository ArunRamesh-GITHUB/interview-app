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
  const [tokenData, setTokenData] = useState<TokenBalance | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const fetchBalance = async () => {
    if (!user) {
      setTokenData(null)
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
          setTokenData({ 
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
      setTokenData(data)
      setError(null)
    } catch (err) {
      console.error('Token balance fetch error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      // Fallback to 0 balance on error
      setTokenData({ 
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

  // Listen for purchase completion messages from mobile app
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Check if we're in a React Native WebView
    const isWebView = !!(window as any).ReactNativeWebView;
    if (!isWebView) return;

    console.log('📱 useTokenBalance: Setting up purchase listener...');

    // Expose global function for token updates
    const updateBalance = (tokensToAdd: number) => {
      console.log(`💰💰💰 useTokenBalance: Adding ${tokensToAdd} tokens`);
      setTokenData((prev) => {
        if (!prev) {
          // If no data yet, fetch it first
          fetchBalance();
          return prev;
        }
        const newBalance = prev.balanceTokens + tokensToAdd;
        console.log(`💰💰💰 useTokenBalance: Balance updated ${prev.balanceTokens} → ${newBalance}`);
        return {
          ...prev,
          balanceTokens: newBalance
        };
      });
    };

    (window as any).__TOKEN_BALANCE_UPDATE__ = updateBalance;

    const handleCustomEvent = (event: CustomEvent) => {
      if (event.detail?.tokens && event.detail?.isTestProduct) {
        console.log(`💰 useTokenBalance: Custom event received: +${event.detail.tokens} tokens`);
        updateBalance(event.detail.tokens);
      }
    };

    const handleStorageEvent = (event: StorageEvent) => {
      if (event.key === 'purchase_tokens' && event.newValue) {
        try {
          const data = JSON.parse(event.newValue);
          if (data.tokens) {
            console.log(`💰 useTokenBalance: Storage event received: +${data.tokens} tokens`);
            updateBalance(data.tokens);
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    };

    // Listen for custom purchaseCompleted events
    window.addEventListener('purchaseCompleted', handleCustomEvent as EventListener);
    // Listen for storage events
    window.addEventListener('storage', handleStorageEvent);
    
    // Also poll localStorage as a fallback
    const pollInterval = setInterval(() => {
      try {
        const stored = localStorage.getItem('purchase_tokens');
        if (stored) {
          const data = JSON.parse(stored);
          // Only process if recent (within last 30 seconds)
          if (data.timestamp && Date.now() - data.timestamp < 30000 && data.tokens) {
            console.log(`💰💰💰 useTokenBalance: Polled localStorage: +${data.tokens} tokens`);
            updateBalance(data.tokens);
            localStorage.removeItem('purchase_tokens'); // Clear after processing
          }
        }
      } catch (e) {
        // Ignore errors
      }
    }, 500); // Poll every 500ms
    
    return () => {
      window.removeEventListener('purchaseCompleted', handleCustomEvent as EventListener);
      window.removeEventListener('storage', handleStorageEvent);
      clearInterval(pollInterval);
      delete (window as any).__TOKEN_BALANCE_UPDATE__;
    };
  }, [user]);

  const refetch = () => {
    fetchBalance()
  }

  return {
    balance: tokenData?.balanceTokens ?? 0,
    rules: tokenData?.rules,
    loading,
    error,
    refetch,
  }
}