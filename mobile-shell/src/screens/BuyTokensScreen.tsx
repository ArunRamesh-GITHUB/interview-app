import React, { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native'
import { Product } from 'react-native-iap'
import { initPurchases, getTokenPacks, buyPack } from '../lib/purchases'

export default function BuyTokensScreen({ userId }: { userId?: string }) {
  const [packs, setPacks] = useState<Product[]>([])
  const [busy, setBusy] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    (async () => {
      try {
        await initPurchases({ appUserId: userId || null })
        const list = await getTokenPacks()
        setPacks(list)
        setReady(true)
      } catch (error: any) {
        Alert.alert('Error', error.message || 'Failed to load products')
        setReady(true)
      }
    })()
  }, [userId])

  async function buy(productId: string) {
    try {
      setBusy(productId)
      await buyPack(productId)
      Alert.alert('Success', 'Tokens will appear shortly.')
    } catch (e: any) {
      Alert.alert('Purchase failed', e?.message || 'Please try again')
    } finally {
      setBusy(null)
    }
  }

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    )
  }

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 22, fontWeight: '700', marginBottom: 12 }}>Buy tokens</Text>
      {packs.length === 0 && <Text>No packs configured.</Text>}
      {packs.map((p: any) => (
        <TouchableOpacity
          key={p.productId}
          onPress={() => buy(p.productId)}
          disabled={busy === p.productId}
          style={{
            backgroundColor: busy === p.productId ? '#666' : '#000',
            padding: 14,
            borderRadius: 12,
            marginBottom: 10,
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '600' }}>
            {((p.title || p.productId).split('/')[0].split('per month')[0].split('monthly')[0].trim())}
          </Text>
          <Text style={{ color: '#fff' }}>
            {((p.localizedPrice || '').split('/')[0].split('per month')[0].split('monthly')[0].trim())}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}
