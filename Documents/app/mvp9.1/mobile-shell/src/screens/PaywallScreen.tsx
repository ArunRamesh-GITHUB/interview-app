import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
} from 'react-native'
import { Offerings, PurchasesPackage } from 'react-native-purchases'
import { purchaseService, getTokenAmountFromProduct, isSubscriptionProduct } from '../lib/purchaseService'

interface PaywallScreenProps {
  navigation: any
  route?: {
    params?: {
      currentTokens?: number
      supabaseUserId?: string
    }
  }
}

interface TabButtonProps {
  title: string
  active: boolean
  onPress: () => void
}

const TabButton: React.FC<TabButtonProps> = ({ title, active, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    style={{
      flex: 1,
      paddingVertical: 12,
      alignItems: 'center',
      borderBottomWidth: 2,
      borderBottomColor: active ? '#000' : 'transparent',
    }}
  >
    <Text style={{
      fontSize: 16,
      fontWeight: active ? '600' : '400',
      color: active ? '#000' : '#666',
    }}>
      {title}
    </Text>
  </TouchableOpacity>
)

interface PackageCardProps {
  package: PurchasesPackage
  onPurchase: (pkg: PurchasesPackage) => void
  purchasing: boolean
}

const PackageCard: React.FC<PackageCardProps> = ({ package: pkg, onPurchase, purchasing }) => {
  const tokenAmount = getTokenAmountFromProduct(pkg.product.identifier)
  const isSubscription = isSubscriptionProduct(pkg.product.identifier)
  
  return (
    <View style={{
      backgroundColor: '#fff',
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#000', marginBottom: 4 }}>
            {pkg.product.title || pkg.identifier}
          </Text>
          <Text style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>
            {tokenAmount} tokens{isSubscription ? ' per month' : ''}
          </Text>
          {pkg.product.description && (
            <Text style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>
              {pkg.product.description}
            </Text>
          )}
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#000', marginBottom: 8 }}>
            {pkg.product.priceString}
          </Text>
          <TouchableOpacity
            onPress={() => onPurchase(pkg)}
            disabled={purchasing}
            style={{
              backgroundColor: purchasing ? '#ccc' : '#007AFF',
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 8,
              minWidth: 80,
              alignItems: 'center',
            }}
          >
            {purchasing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>
                {isSubscription ? 'Subscribe' : 'Buy'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

export default function PaywallScreen({ navigation, route }: PaywallScreenProps) {
  const [activeTab, setActiveTab] = useState<'subscriptions' | 'topups'>('subscriptions')
  const [offerings, setOfferings] = useState<Offerings | null>(null)
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState<string | null>(null)
  const [currentTokens, setCurrentTokens] = useState(route?.params?.currentTokens || 0)
  const [isSubscribed, setIsSubscribed] = useState(false)

  const supabaseUserId = route?.params?.supabaseUserId

  useEffect(() => {
    initializePurchases()
  }, [])

  const initializePurchases = async () => {
    try {
      setLoading(true)
      
      // Initialize with user ID if available
      await purchaseService.initialize(supabaseUserId)
      
      // Get offerings and subscription status
      const [offeringsData, subscriptionStatus] = await Promise.all([
        purchaseService.getOfferings(),
        purchaseService.isSubscribed()
      ])
      
      setOfferings(offeringsData)
      setIsSubscribed(subscriptionStatus)
    } catch (error) {
      console.error('Failed to initialize purchases:', error)
      Alert.alert('Error', 'Failed to load purchase options. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handlePurchase = async (pkg: PurchasesPackage) => {
    try {
      setPurchasing(pkg.identifier)
      
      const result = await purchaseService.purchasePackage(pkg.identifier)
      
      // Refresh subscription status and token balance
      await refreshUserData()
      
      const tokenAmount = getTokenAmountFromProduct(result.productIdentifier)
      const isSubscription = isSubscriptionProduct(result.productIdentifier)
      
      Alert.alert(
        'Purchase Successful!',
        `${tokenAmount} tokens ${isSubscription ? 'will be added monthly' : 'added to your account'}`
      )
    } catch (error: any) {
      console.error('Purchase failed:', error)
      if (!error.userCancelled) {
        Alert.alert('Purchase Failed', error.message || 'Please try again.')
      }
    } finally {
      setPurchasing(null)
    }
  }

  const handleRestorePurchases = async () => {
    try {
      setLoading(true)
      await purchaseService.restorePurchases()
      await refreshUserData()
      Alert.alert('Success', 'Purchases restored successfully!')
    } catch (error: any) {
      console.error('Restore failed:', error)
      Alert.alert('Restore Failed', error.message || 'Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const refreshUserData = async () => {
    try {
      const subscriptionStatus = await purchaseService.isSubscribed()
      setIsSubscribed(subscriptionStatus)
      
      // TODO: Fetch updated token balance from your API
      // const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/wallet`, ...)
      // setCurrentTokens(response.tokens)
    } catch (error) {
      console.error('Failed to refresh user data:', error)
    }
  }

  const getPackagesByType = (isSubscription: boolean) => {
    if (!offerings?.current) return []
    
    return offerings.current.availablePackages.filter(pkg => 
      isSubscriptionProduct(pkg.product.identifier) === isSubscription
    )
  }

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
        <StatusBar barStyle="dark-content" />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={{ marginTop: 16, fontSize: 16, color: '#666' }}>Loading purchase options...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={{ backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={{ fontSize: 16, color: '#007AFF' }}>← Back</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: '600' }}>Get Tokens</Text>
          <View style={{ width: 50 }} />
        </View>
        
        {/* Current Token Balance */}
        <View style={{
          backgroundColor: '#f0f0f0',
          padding: 12,
          borderRadius: 8,
          alignItems: 'center',
        }}>
          <Text style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>Current Balance</Text>
          <Text style={{ fontSize: 24, fontWeight: '700', color: '#000' }}>
            {currentTokens} tokens
          </Text>
          {isSubscribed && (
            <Text style={{ fontSize: 12, color: '#007AFF', marginTop: 4 }}>
              ✓ Subscribed
            </Text>
          )}
        </View>
      </View>

      {/* Tabs */}
      <View style={{ backgroundColor: '#fff', flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' }}>
        <TabButton
          title="Subscriptions"
          active={activeTab === 'subscriptions'}
          onPress={() => setActiveTab('subscriptions')}
        />
        <TabButton
          title="Token Packs"
          active={activeTab === 'topups'}
          onPress={() => setActiveTab('topups')}
        />
      </View>

      {/* Content */}
      <ScrollView style={{ flex: 1, padding: 16 }}>
        {activeTab === 'subscriptions' && (
          <View>
            <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 12, color: '#333' }}>
              Monthly Subscriptions
            </Text>
            <Text style={{ fontSize: 14, color: '#666', marginBottom: 16 }}>
              Get tokens automatically every month. Cancel anytime.
            </Text>
            {getPackagesByType(true).map(pkg => (
              <PackageCard
                key={pkg.identifier}
                package={pkg}
                onPurchase={handlePurchase}
                purchasing={purchasing === pkg.identifier}
              />
            ))}
          </View>
        )}

        {activeTab === 'topups' && (
          <View>
            <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 12, color: '#333' }}>
              One-Time Token Packs
            </Text>
            <Text style={{ fontSize: 14, color: '#666', marginBottom: 16 }}>
              Buy tokens once and use them anytime.
            </Text>
            {getPackagesByType(false).map(pkg => (
              <PackageCard
                key={pkg.identifier}
                package={pkg}
                onPurchase={handlePurchase}
                purchasing={purchasing === pkg.identifier}
              />
            ))}
          </View>
        )}

        {/* Restore Purchases Button */}
        <TouchableOpacity
          onPress={handleRestorePurchases}
          style={{
            backgroundColor: 'transparent',
            padding: 16,
            alignItems: 'center',
            marginTop: 24,
          }}
        >
          <Text style={{ color: '#007AFF', fontSize: 16 }}>Restore Purchases</Text>
        </TouchableOpacity>

        {/* Footer Info */}
        <View style={{ paddingVertical: 20, alignItems: 'center' }}>
          <Text style={{ fontSize: 12, color: '#666', textAlign: 'center', lineHeight: 16 }}>
            Payment will be charged to your Google Play account. Subscriptions automatically renew unless cancelled at least 24 hours before the current period ends.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}