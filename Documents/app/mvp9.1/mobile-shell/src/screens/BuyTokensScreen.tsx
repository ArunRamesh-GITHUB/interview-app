import React, { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native'
import { initPurchases, getTokenPacks, buyPack } from '../lib/purchases'

export default function BuyTokensScreen({ userId }: { userId?: string }) {
  const [packs, setPacks] = useState<any[]>([])
  const [busy, setBusy] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    (async () => {
      const apiKey = Platform.OS === 'ios'
        ? process.env.EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY || process.env.REVENUECAT_APPLE_API_KEY
        : process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY || process.env.REVENUECAT_GOOGLE_API_KEY
      await initPurchases({ apiKey: String(apiKey), appUserId: userId || null })
      const list = await getTokenPacks()
      setPacks(list)
      setReady(true)
    })()
  }, [userId])

  async function buy(p:any) {
    try {
      setBusy(p.identifier)
      await buyPack(p)
      Alert.alert('Success', 'Tokens will appear shortly.')
    } catch (e:any) {
      Alert.alert('Purchase failed', e?.message || 'Please try again')
    } finally {
      setBusy(null)
    }
  }

  if (!ready) return <View style={{flex:1,alignItems:'center',justifyContent:'center'}}><ActivityIndicator/></View>

  return (
    <View style={{ flex:1, padding:20 }}>
      <Text style={{ fontSize:22, fontWeight:'700', marginBottom:12 }}>Buy tokens</Text>
      {packs.length === 0 && <Text>No packs configured.</Text>}
      {packs.map((p:any)=>(
        <TouchableOpacity key={p.identifier} onPress={()=>buy(p)}
          style={{ backgroundColor:'#000', padding:14, borderRadius:12, marginBottom:10 }}>
          <Text style={{ color:'#fff', fontWeight:'600' }}>{p.storeProduct?.title || p.identifier}</Text>
          <Text style={{ color:'#fff' }}>{p.storeProduct?.priceString || ''}</Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}