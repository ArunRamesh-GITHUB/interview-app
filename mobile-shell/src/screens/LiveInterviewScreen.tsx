import React from 'react'
import { View, Text, TouchableOpacity, SafeAreaView, Alert } from 'react-native'
import { router } from 'expo-router'
import ZeroTokenBanner from '../components/ZeroTokenBanner'
import { useTokens, useTokenGuard } from '../hooks/useTokens'

// Example integration showing how to use ZeroTokenBanner and token guards
export default function LiveInterviewScreen() {
  // TODO: Get user ID from your auth context/provider
  const userId = 'your-supabase-user-id' // Replace with actual user ID
  
  const { balance, loading, checkBalance, isSubscribed } = useTokens(userId)
  const checkTokens = useTokenGuard(1) // Live interviews require 1 token minimum

  const handleStartInterview = () => {
    const hasEnoughTokens = checkTokens(balance, () => {
      Alert.alert(
        'Insufficient Tokens',
        'You need tokens to start a live interview. Buy a token pack or subscribe to get started.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Buy Tokens', onPress: () => router.push('/paywall') }
        ]
      )
    })

    if (hasEnoughTokens) {
      // TODO: Implement your interview start logic
      console.log('Starting live interview...')
      Alert.alert('Success', 'Interview started! (This is a demo)')
    }
  }

  const navigateToPaywall = () => {
    router.push({
      pathname: '/paywall',
      params: {
        currentTokens: balance,
        supabaseUserId: userId
      }
    })
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
      {/* Zero Token Banner */}
      <ZeroTokenBanner
        visible={balance <= 0}
        currentTokens={balance}
        onBuyTokensPress={navigateToPaywall}
      />

      <View style={{ flex: 1, padding: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 10, color: '#333' }}>
          Live Interview
        </Text>
        
        <View style={{
          backgroundColor: '#fff',
          borderRadius: 12,
          padding: 16,
          marginBottom: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}>
          <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8 }}>
            Current Balance: {loading ? '...' : balance} tokens
          </Text>
          {isSubscribed && (
            <Text style={{ fontSize: 14, color: '#007AFF' }}>
              ✓ Active Subscription
            </Text>
          )}
          <TouchableOpacity
            onPress={checkBalance}
            style={{ marginTop: 8 }}
          >
            <Text style={{ color: '#007AFF', fontSize: 14 }}>
              Refresh Balance
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={{ fontSize: 16, color: '#666', marginBottom: 20, lineHeight: 22 }}>
          Practice with AI-powered interview questions. Each session uses tokens based on duration.
        </Text>

        <TouchableOpacity
          onPress={handleStartInterview}
          style={{
            backgroundColor: balance > 0 ? '#007AFF' : '#ccc',
            padding: 16,
            borderRadius: 12,
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <Text style={{
            color: '#fff',
            fontSize: 16,
            fontWeight: '600',
          }}>
            Start Live Interview
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={navigateToPaywall}
          style={{
            backgroundColor: 'transparent',
            padding: 16,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: '#007AFF',
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#007AFF', fontSize: 16, fontWeight: '600' }}>
            Buy More Tokens
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}