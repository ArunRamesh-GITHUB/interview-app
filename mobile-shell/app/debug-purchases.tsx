import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native'
import { purchaseService } from '../src/lib/purchaseService'
import { useRouter } from 'expo-router'

export default function DebugPurchasesScreen() {
  const router = useRouter()
  const [customerInfo, setCustomerInfo] = useState(null)
  const [offerings, setOfferings] = useState(null)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setRefreshing(true)

      console.log('🔍 Debug: Starting to load purchase data...')
      await purchaseService.initialize()
      console.log('✅ Debug: Purchase service initialized')

      const [customerData, offeringsData] = await Promise.all([
        purchaseService.getCustomerInfo(),
        purchaseService.getOfferings()
      ])

      console.log('📦 Debug: Offerings:', JSON.stringify(offeringsData, null, 2))
      console.log('👤 Debug: Customer Info:', JSON.stringify(customerData, null, 2))

      setCustomerInfo(customerData)
      setOfferings(offeringsData)

      // Test log for offerings
      if (offeringsData?.current) {
        console.log('✅ Current offering found:', offeringsData.current.identifier)
        console.log('📦 Available packages:', offeringsData.current.availablePackages.length)
        offeringsData.current.availablePackages.forEach((pkg, i) => {
          console.log(`  ${i + 1}. ${pkg.identifier} - ${pkg.product.priceString}`)
        })
      } else {
        console.warn('⚠️ No current offering found!')
      }

      Alert.alert('Success', `Loaded ${offeringsData?.current?.availablePackages?.length || 0} packages`)
    } catch (error: any) {
      console.error('❌ Failed to load purchase data:', error)
      Alert.alert('Error', error.message || 'Failed to load purchase data')
    } finally {
      setRefreshing(false)
    }
  }

  const handleRestorePurchases = async () => {
    try {
      setLoading(true)
      const restored = await purchaseService.restorePurchases()
      setCustomerInfo(restored)
      Alert.alert('Success', 'Purchases restored successfully!')
    } catch (error: any) {
      console.error('Restore failed:', error)
      Alert.alert('Restore Failed', error.message || 'Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString()
  }

  const getEntitlementStatus = () => {
    if (!customerInfo?.entitlements?.active) return 'No active entitlements'

    const activeEntitlements = Object.keys(customerInfo.entitlements.active)
    if (activeEntitlements.length === 0) return 'No active entitlements'

    return `Active: ${activeEntitlements.join(', ')}`
  }

  const getSubscriptionInfo = () => {
    if (!customerInfo?.entitlements?.active) return null

    const entitlements = customerInfo.entitlements.active
    const premiumEntitlement = entitlements.premium || entitlements.pro || entitlements.plus || entitlements.starter

    if (!premiumEntitlement) return null

    return {
      productId: premiumEntitlement.productIdentifier,
      expirationDate: premiumEntitlement.expirationDate,
      willRenew: premiumEntitlement.willRenew,
      store: premiumEntitlement.store
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={{
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ fontSize: 16, color: '#007AFF' }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '600' }}>Debug Purchases</Text>
        <TouchableOpacity onPress={loadData} disabled={refreshing}>
          {refreshing ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <Text style={{ fontSize: 16, color: '#007AFF' }}>Refresh</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1, padding: 16 }}>
        {/* Entitlement Status */}
        <View style={{
          backgroundColor: '#fff',
          borderRadius: 12,
          padding: 16,
          marginBottom: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}>
          <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12 }}>
            Entitlement Status
          </Text>
          <Text style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>
            {getEntitlementStatus()}
          </Text>

          {getSubscriptionInfo() && (
            <View style={{ marginTop: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: '500', marginBottom: 4 }}>
                Subscription Details:
              </Text>
              <Text style={{ fontSize: 12, color: '#666' }}>
                Product: {getSubscriptionInfo()?.productId}
              </Text>
              <Text style={{ fontSize: 12, color: '#666' }}>
                Expires: {formatDate(getSubscriptionInfo()?.expirationDate)}
              </Text>
              <Text style={{ fontSize: 12, color: '#666' }}>
                Will Renew: {getSubscriptionInfo()?.willRenew ? 'Yes' : 'No'}
              </Text>
              <Text style={{ fontSize: 12, color: '#666' }}>
                Store: {getSubscriptionInfo()?.store}
              </Text>
            </View>
          )}
        </View>

        {/* Customer Info */}
        <View style={{
          backgroundColor: '#fff',
          borderRadius: 12,
          padding: 16,
          marginBottom: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}>
          <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12 }}>
            Customer Info
          </Text>
          {customerInfo ? (
            <>
              <Text style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
                User ID: {customerInfo.originalAppUserId}
              </Text>
              <Text style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
                First Seen: {formatDate(customerInfo.firstSeen)}
              </Text>
              <Text style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
                Active Entitlements: {Object.keys(customerInfo.entitlements?.active || {}).length}
              </Text>
              <Text style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
                Non-Subscriptions: {Object.keys(customerInfo.nonSubscriptionTransactions || {}).length}
              </Text>
            </>
          ) : (
            <Text style={{ fontSize: 14, color: '#666' }}>Loading...</Text>
          )}
        </View>

        {/* Available Offerings */}
        <View style={{
          backgroundColor: '#fff',
          borderRadius: 12,
          padding: 16,
          marginBottom: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}>
          <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12 }}>
            Available Offerings
          </Text>
          {offerings?.current?.availablePackages ? (
            offerings.current.availablePackages.map((pkg, index) => (
              <View key={index} style={{ marginBottom: 8 }}>
                <Text style={{ fontSize: 14, fontWeight: '500' }}>
                  {pkg.product.title || pkg.identifier}
                </Text>
                <Text style={{ fontSize: 12, color: '#666' }}>
                  {pkg.product.priceString} - {pkg.product.identifier}
                </Text>
              </View>
            ))
          ) : (
            <Text style={{ fontSize: 14, color: '#666' }}>No offerings available</Text>
          )}
        </View>

        {/* Actions */}
        <TouchableOpacity
          onPress={handleRestorePurchases}
          disabled={loading}
          style={{
            backgroundColor: loading ? '#ccc' : '#007AFF',
            paddingVertical: 16,
            paddingHorizontal: 24,
            borderRadius: 12,
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
              Restore Purchases
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/paywall')}
          style={{
            backgroundColor: '#34C759',
            paddingVertical: 16,
            paddingHorizontal: 24,
            borderRadius: 12,
            alignItems: 'center',
            marginBottom: 32,
          }}
        >
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
            Show Paywall
          </Text>
        </TouchableOpacity>

        {/* Raw Data (for debugging) */}
        <View style={{
          backgroundColor: '#f8f9fa',
          borderRadius: 8,
          padding: 12,
          marginBottom: 32,
        }}>
          <Text style={{ fontSize: 12, color: '#666', fontFamily: 'monospace' }}>
            {JSON.stringify({ customerInfo, offerings }, null, 2)}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}