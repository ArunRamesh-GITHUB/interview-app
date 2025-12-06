import { useState, useEffect, useRef } from 'react'
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

  // Track processed transactions to prevent duplicates (outside useEffect so it persists)
  const processedTransactions = useRef<Set<string>>(new Set());

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
    
    // Expose global function for token updates (this is what the UI uses!)
    const updateBalance = (tokensToAdd: number, transactionId?: string) => {
      const txId = transactionId || `tx_${Date.now()}_${Math.random()}`;
      
      // Check if already processed
      if (processedTransactions.current.has(txId)) {
        console.log(`⚠️⚠️⚠️⚠️⚠️ useTokenBalance: Transaction already processed, skipping: ${txId}`);
        console.log(`⚠️⚠️⚠️⚠️⚠️ Current processed set:`, Array.from(processedTransactions.current));
        return;
      }
      
      // Mark as processed IMMEDIATELY before any async operations
      processedTransactions.current.add(txId);
      if (processedTransactions.current.size > 100) {
        const arr = Array.from(processedTransactions.current);
        processedTransactions.current = new Set(arr.slice(-100));
      }
      
      console.log(`💰💰💰💰💰 useTokenBalance: Adding ${tokensToAdd} tokens (tx: ${txId})`);
      console.log(`💰💰💰💰💰 useTokenBalance: Processed transactions count: ${processedTransactions.current.size}`);
      setTokenData((prev: TokenBalance | null) => {
        if (!prev) {
          // If no data yet, fetch it first
          fetchBalance();
          return prev;
        }
        const newBalance = prev.balanceTokens + tokensToAdd;
        console.log(`💰💰💰💰💰 useTokenBalance: Balance updated ${prev.balanceTokens} → ${newBalance} (+${tokensToAdd})`);
        return {
          ...prev,
          balanceTokens: newBalance
        };
      });
    };

    (window as any).__TOKEN_BALANCE_UPDATE__ = updateBalance;
    console.log('✅✅✅ useTokenBalance: Exposed __TOKEN_BALANCE_UPDATE__ function');
    
    return () => {
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