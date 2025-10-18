import React from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useIAP } from '../hooks/useIAP'
import { IAP, tokensFor, getProductLabel, STARTER_PACK } from '../../../config/iapProducts'

interface PaywallScreenProps {
  navigation?: any
  route?: {
    params?: {
      user?: { id: string; email?: string }
    }
  }
}

export default function PaywallScreen({ navigation, route }: PaywallScreenProps) {
  const router = useRouter()
  const user = route?.params?.user

  const { products, loading, buy } = useIAP(user)

  // Map products to display data
  const productRows = [
    {
      sku: Platform.select({ ios: IAP.ios.STARTER, android: IAP.android.STARTER })!,
      label: 'Starter',
      tokens: 120,
      price: '$9.99',
    },
    {
      sku: Platform.select({ ios: IAP.ios.PLUS, android: IAP.android.PLUS })!,
      label: 'Plus',
      tokens: 250,
      price: '$19.99',
    },
    {
      sku: Platform.select({ ios: IAP.ios.PRO, android: IAP.android.PRO })!,
      label: 'Pro',
      tokens: 480,
      price: '$39.99',
    },
    {
      sku: Platform.select({ ios: IAP.ios.POWER, android: IAP.android.POWER })!,
      label: 'Power',
      tokens: 1000,
      price: '$79.99',
    },
  ]

  // Get actual store price for a SKU
  const getStorePrice = (sku: string): string => {
    const product = products.find((p) => p.productId === sku)
    return product?.localizedPrice || ''
  }

  const handleBack = () => {
    if (navigation?.goBack) {
      navigation.goBack()
    } else {
      router.back()
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
        <StatusBar barStyle="dark-content" />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={{ marginTop: 16, fontSize: 16, color: '#666' }}>
            Loading purchase options...
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View
        style={{
          backgroundColor: '#fff',
          paddingHorizontal: 16,
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: '#e0e0e0',
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <TouchableOpacity onPress={handleBack}>
            <Text style={{ fontSize: 16, color: '#007AFF' }}>← Back</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: '600' }}>Buy Tokens</Text>
          <View style={{ width: 50 }} />
        </View>
      </View>

      {/* Content */}
      <ScrollView style={{ flex: 1, padding: 16 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 12, color: '#333' }}>
          Token Packs
        </Text>
        <Text style={{ fontSize: 14, color: '#666', marginBottom: 16 }}>
          Buy tokens once and use them anytime. All purchases are one-time only.
        </Text>

        {/* Token Packs */}
        {productRows.map((row) => {
          const storePrice = getStorePrice(row.sku)

          return (
            <View
              key={row.sku}
              style={{
                backgroundColor: '#fff',
                borderRadius: 12,
                padding: 16,
                marginBottom: 12,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 18, fontWeight: '600', color: '#000', marginBottom: 4 }}>
                    {row.label} Pack
                  </Text>
                  <Text style={{ fontSize: 14, color: '#666' }}>{row.tokens} tokens</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 20, fontWeight: '700', color: '#000', marginBottom: 8 }}>
                    {storePrice || row.price}
                  </Text>
                  <TouchableOpacity
                    onPress={() => buy(row.sku)}
                    style={{
                      backgroundColor: '#007AFF',
                      paddingHorizontal: 20,
                      paddingVertical: 10,
                      borderRadius: 8,
                      minWidth: 80,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>Buy</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )
        })}

        {/* Info Text */}
        <View style={{ paddingVertical: 20, alignItems: 'center' }}>
          <Text
            style={{ fontSize: 12, color: '#666', textAlign: 'center', lineHeight: 16 }}
          >
            All purchases are one-time payments. Tokens never expire. Prices shown in your local
            currency.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
