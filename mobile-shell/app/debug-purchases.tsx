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
import { Purchase, Product } from 'react-native-iap'
import { purchaseService } from '../src/lib/purchaseService'
import { useRouter } from 'expo-router'

export default function DebugPurchasesScreen() {
  const router = useRouter()
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setRefreshing(true)
      await purchaseService.initialize()

      const [purchasesData, productsData] = await Promise.all([
        purchaseService.getCustomerInfo(),
        purchaseService.getProducts()
      ])

      setPurchases(purchasesData as Purchase[])
      setProducts(productsData)
    } catch (error) {
      console.error('Failed to load purchase data:', error)
      Alert.alert('Error', 'Failed to load purchase data')
    } finally {
      setRefreshing(false)
    }
  }

  const handleRestorePurchases = async () => {
    try {
      setLoading(true)
      const products = await purchaseService.getProducts()
      setProducts(products)
      Alert.alert('Success', 'Purchases restored successfully!')
    } catch (error: any) {
      console.error('Restore failed:', error)
      Alert.alert('Restore Failed', error.message || 'Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'N/A'
    return new Date(timestamp).toLocaleDateString()
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
        {/* Purchase Status */}
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
            Purchase Status
          </Text>
          <Text style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>
            Active Purchases: {purchases.length}
          </Text>
          {purchases.length > 0 && (
            <View style={{ marginTop: 8 }}>
              {purchases.map((purchase, index) => (
                <View key={index} style={{ marginBottom: 8, padding: 8, backgroundColor: '#f8f9fa', borderRadius: 8 }}>
                  <Text style={{ fontSize: 12, fontWeight: '500' }}>
                    Product: {purchase.productId}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#666' }}>
                    Transaction ID: {purchase.transactionId}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#666' }}>
                    Purchase Date: {formatDate(Number(purchase.transactionDate))}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Available Products */}
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
            Available Products
          </Text>
          {products.length > 0 ? (
            products.map((product, index) => (
              <View key={index} style={{ marginBottom: 8, padding: 8, backgroundColor: '#f8f9fa', borderRadius: 8 }}>
                <Text style={{ fontSize: 14, fontWeight: '500' }}>
                  {product.title || product.productId}
                </Text>
                <Text style={{ fontSize: 12, color: '#666' }}>
                  {product.localizedPrice} - {product.productId}
                </Text>
                {product.description && (
                  <Text style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                    {product.description}
                  </Text>
                )}
              </View>
            ))
          ) : (
            <Text style={{ fontSize: 14, color: '#666' }}>No products available</Text>
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
            {JSON.stringify({ purchases, products }, null, 2)}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
