import React from 'react'
import { useTokenBalance } from './useTokenBalance'
import { OutOfTokensModal } from '../components/ui/OutOfTokensModal'

export interface TokenValidationResult {
  hasEnoughTokens: boolean
  currentBalance: number
  requiredTokens: number
  message: string
}

export function useTokenValidation() {
  const { balance, rules, loading, error } = useTokenBalance()

  const validateTokensForAction = (actionType: 'practice' | 'realtime', durationMinutes: number = 1): TokenValidationResult => {
    if (loading || !rules) {
      return {
        hasEnoughTokens: false,
        currentBalance: balance,
        requiredTokens: 0,
        message: 'Loading token information...'
      }
    }

    let requiredTokens: number
    
    if (actionType === 'practice') {
      // Practice: 1 token per minute, rounds to 0.25 tokens (15 seconds)
      requiredTokens = Math.max(rules.PRACTICE_ROUNDING_TOKENS, Math.ceil(durationMinutes / (1 / rules.TOKEN_PER_PRACTICE_MIN)))
    } else {
      // Realtime: 9 tokens per minute, minimum 5 tokens per session
      const calculatedTokens = Math.ceil(durationMinutes * rules.TOKEN_PER_REALTIME_MIN)
      requiredTokens = Math.max(rules.REALTIME_MIN_TOKENS_PER_SESSION, calculatedTokens)
    }

    const hasEnoughTokens = balance >= requiredTokens

    return {
      hasEnoughTokens,
      currentBalance: balance,
      requiredTokens,
      message: hasEnoughTokens 
        ? `You have ${balance} tokens available`
        : `You need ${requiredTokens} tokens but only have ${balance}. Get more tokens to continue.`
    }
  }

  const hasAnyTokens = () => balance > 0

  return {
    balance,
    rules,
    loading,
    error,
    validateTokensForAction,
    hasAnyTokens,
  }
}

export function useTokenGate() {
  const { balance, loading } = useTokenBalance()
  const [showModal, setShowModal] = React.useState(false)

  const checkTokensOrShowModal = React.useCallback((requiredTokens: number = 1) => {
    if (loading) return false
    
    if (balance < requiredTokens) {
      setShowModal(true)
      return false
    }
    
    return true
  }, [balance, loading])

  const TokenGateModal = React.useCallback(() => (
    <OutOfTokensModal
      open={showModal}
      onClose={() => setShowModal(false)}
      currentBalance={balance}
    />
  ), [showModal, balance])

  return {
    checkTokensOrShowModal,
    TokenGateModal,
    hasTokens: balance > 0,
    balance,
    loading
  }
}

export function checkTokensBeforeAction(
  balance: number, 
  rules: any, 
  actionType: 'practice' | 'realtime', 
  durationMinutes: number = 1
): TokenValidationResult {
  if (!rules) {
    return {
      hasEnoughTokens: false,
      currentBalance: balance,
      requiredTokens: 0,
      message: 'Token system not available'
    }
  }

  let requiredTokens: number
  
  if (actionType === 'practice') {
    requiredTokens = Math.max(rules.PRACTICE_ROUNDING_TOKENS, Math.ceil(durationMinutes * rules.TOKEN_PER_PRACTICE_MIN))
  } else {
    const calculatedTokens = Math.ceil(durationMinutes * rules.TOKEN_PER_REALTIME_MIN)
    requiredTokens = Math.max(rules.REALTIME_MIN_TOKENS_PER_SESSION, calculatedTokens)
  }

  const hasEnoughTokens = balance >= requiredTokens

  return {
    hasEnoughTokens,
    currentBalance: balance,
    requiredTokens,
    message: hasEnoughTokens 
      ? `You have ${balance} tokens available`
      : `You need ${requiredTokens} tokens but only have ${balance}. Get more tokens to continue.`
  }
}