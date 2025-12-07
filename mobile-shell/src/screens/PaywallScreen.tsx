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
import { Product } from 'react-native-iap'
import { purchaseService, getTokenAmountFromProduct } from '../lib/purchaseService'

interface PaywallScreenProps {
  navigation: any
  route?: {
    params?: {
      currentTokens?: number
      supabaseUserId?: string
      productId?: string
      onPurchaseComplete?: () => void
      onClose?: () => void
    }
  }
}

// Replace strictly typed Product with any to handle v14 changes
interface PackageCardProps {
  product: any
  onPurchase: (product: any) => void
  purchasing: boolean
}

const PackageCard: React.FC<PackageCardProps> = ({ product, onPurchase, purchasing }) => {
  const tokenAmount = getTokenAmountFromProduct(product.productId)

  // Clean price - aggressively remove all month references
  let cleanPrice = (product.localizedPrice || '').trim()

  // Log original price for debugging
  if (__DEV__) {
    console.log(`[Paywall] Product ${product.productId} - Original price: "${cleanPrice}"`)
  }

  // Remove all variations of /month, per month, monthly
  cleanPrice = cleanPrice
    .split('/')[0]                    // Remove everything after /
    .split('per month')[0]            // Remove "per month"
    .split('per mo')[0]               // Remove "per mo"
    .split('monthly')[0]              // Remove "monthly"
    .trim()

  if (__DEV__) {
    console.log(`[Paywall] Product ${product.productId} - Cleaned price: "${cleanPrice}"`)
  }

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
      borderWidth: 1,
      borderColor: '#e0e0e0',
    }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#000', marginBottom: 4 }}>
            {tokenAmount} tokens
          </Text>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#000' }}>
            {cleanPrice}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => onPurchase(product)}
          disabled={purchasing}
          style={{
            backgroundColor: purchasing ? '#ccc' : '#000',
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 8,
            minWidth: 80,
            alignItems: 'center',
          }}
        >
          {purchasing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>
              Buy
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  )
}

export default function PaywallScreen({ navigation, route }: PaywallScreenProps) {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState<string | null>(null)
  const [currentTokens, setCurrentTokens] = useState(route?.params?.currentTokens || 0)

  const supabaseUserId = route?.params?.supabaseUserId

  useEffect(() => {
    initializePurchases()

    // Cleanup on unmount
    return () => {
      // Cleanup handled by purchaseConfig
    }
  }, [])

  const initializePurchases = async () => {
    try {
      setLoading(true)

      // Initialize with user ID if available
      await purchaseService.initialize(supabaseUserId)

      // Get products
      const fetchedProducts = await purchaseService.getProducts()

      // Sort products by token amount (ascending)
      const sortedProducts = [...fetchedProducts].sort((a: any, b: any) => {
        const tokensA = getTokenAmountFromProduct(a.productId)
        const tokensB = getTokenAmountFromProduct(b.productId)
        return tokensA - tokensB
      })

      setProducts(sortedProducts)
    } catch (error: any) {
      console.error('Failed to initialize purchases:', error)
      Alert.alert(
        'Purchase Setup Issue',
        'In-App Purchases are not fully configured yet. Please ensure:\n\n1. Products are set up in App Store Connect / Google Play Console\n2. Products are configured correctly\n3. App is configured for testing\n\nThis is normal during initial setup.',
        [
          { text: 'OK', onPress: () => navigation?.goBack?.() }
        ]
      )
    } finally {
      setLoading(false)
    }
  }

  const handlePurchase = async (product: any) => {
    try {
      setPurchasing(product.productId)

      const result = await purchaseService.purchasePackage(product.productId)

      const tokenAmount = getTokenAmountFromProduct(result.productIdentifier)

      // FOR TEST PRODUCTS: Increment tokens locally immediately (server bypassed)
      const isTestProduct = product.productId.startsWith('com.yourname.test.')
      if (isTestProduct) {
        // Update UI immediately - increment token count
        setCurrentTokens(prev => {
          const newTotal = prev + tokenAmount
          console.log(`💰 TEST MODE: Tokens updated! ${prev} → ${newTotal} (+${tokenAmount})`)
          return newTotal
        })
      } else {
        // For production: Refresh from server
        await refreshUserData()
      }

      Alert.alert(
        'Purchase Successful!',
        `${tokenAmount} tokens added to your account`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Call onPurchaseComplete if provided
              route?.params?.onPurchaseComplete?.()
              navigation?.goBack?.()
            }
          }
        ]
      )
    } catch (error: any) {
      console.error('Purchase failed:', error)
      if (error.message !== 'Purchase cancelled by user') {
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
      // TODO: Fetch updated token balance from your API
      // const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/wallet`, ...)
      // setCurrentTokens(response.tokens)
    } catch (error) {
      console.error('Failed to refresh user data:', error)
    }
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
          <TouchableOpacity onPress={() => navigation?.goBack?.()}>
            <Text style={{ fontSize: 16, color: '#007AFF' }}>← Back</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: '600' }}>Upgrade your plan</Text>
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
        </View>
      </View>

      {/* Content */}
      <ScrollView style={{ flex: 1, padding: 16 }}>
        <View>
          <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8, color: '#333' }}>
            NailIT token packs
          </Text>
          <Text style={{ fontSize: 14, color: '#666', marginBottom: 16 }}>
            Purchase token packs to use with Practice and Realtime features.
          </Text>

          {products.map(product => (
            <PackageCard
              key={product.productId}
              product={product}
              onPurchase={handlePurchase}
              purchasing={purchasing === product.productId}
            />
          ))}
        </View>

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
            Payment will be charged to your {require('react-native').Platform.OS === 'ios' ? 'Apple' : 'Google Play'} account.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
