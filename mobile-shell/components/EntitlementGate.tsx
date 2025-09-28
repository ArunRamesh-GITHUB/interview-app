import React, { useState, useEffect, ReactNode } from 'react'
import { View, ActivityIndicator, Alert } from 'react-native'
import { purchaseService } from '../src/lib/purchaseService'
import PaywallScreen from '../src/screens/PaywallScreen'

interface EntitlementGateProps {
  children: ReactNode
  fallback?: ReactNode
  requireTokens?: number
  supabaseUserId?: string
}

export default function EntitlementGate({
  children,
  fallback,
  requireTokens = 0,
  supabaseUserId
}: EntitlementGateProps) {
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [hasEnoughTokens, setHasEnoughTokens] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showPaywall, setShowPaywall] = useState(false)

  useEffect(() => {
    checkEntitlement()
  }, [])

  const checkEntitlement = async () => {
    try {
      setLoading(true)

      // Initialize RevenueCat with user ID
      if (supabaseUserId) {
        await purchaseService.initialize(supabaseUserId)
      }

      // Check subscription status
      const subscriptionStatus = await purchaseService.isSubscribed()
      setIsSubscribed(subscriptionStatus)

      // Check token balance if required
      if (requireTokens > 0) {
        // TODO: Fetch actual token balance from your API
        // For now, we'll assume subscription gives unlimited tokens
        const tokenBalance = subscriptionStatus ? requireTokens : 0
        setHasEnoughTokens(tokenBalance >= requireTokens)
      } else {
        setHasEnoughTokens(true)
      }

    } catch (error) {
      console.error('Failed to check entitlement:', error)
      // On error, default to not entitled
      setIsSubscribed(false)
      setHasEnoughTokens(false)
    } finally {
      setLoading(false)
    }
  }

  const handleRetry = () => {
    checkEntitlement()
  }

  const handleShowPaywall = () => {
    setShowPaywall(true)
  }

  const handlePaywallClose = () => {
    setShowPaywall(false)
    // Recheck entitlement after potential purchase
    checkEntitlement()
  }

  // Show loading while checking entitlement
  if (loading) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa'
      }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    )
  }

  // Show paywall if showing
  if (showPaywall) {
    return (
      <PaywallScreen
        navigation={{ goBack: handlePaywallClose }}
        route={{
          params: {
            supabaseUserId,
            onClose: handlePaywallClose
          }
        }}
      />
    )
  }

  // Check entitlement conditions
  const hasSubscription = isSubscribed
  const hasTokens = hasEnoughTokens || isSubscribed // Subscription overrides token requirement
  const isEntitled = hasSubscription || hasTokens

  // Show children if entitled
  if (isEntitled) {
    return <>{children}</>
  }

  // Show paywall if not entitled
  return (
    <PaywallScreen
      navigation={{ goBack: handlePaywallClose }}
      route={{
        params: {
          supabaseUserId,
          currentTokens: 0, // Could fetch actual balance here
          onPurchaseComplete: handleRetry,
          onClose: handlePaywallClose
        }
      }}
    />
  )
}

// Hook for checking entitlement status
export function useEntitlement(supabaseUserId?: string) {
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkStatus()
  }, [supabaseUserId])

  const checkStatus = async () => {
    if (!supabaseUserId) {
      setLoading(false)
      return
    }

    try {
      await purchaseService.initialize(supabaseUserId)
      const status = await purchaseService.isSubscribed()
      setIsSubscribed(status)
    } catch (error) {
      console.error('Failed to check subscription status:', error)
      setIsSubscribed(false)
    } finally {
      setLoading(false)
    }
  }

  const refresh = () => {
    checkStatus()
  }

  return { isSubscribed, loading, refresh }
}