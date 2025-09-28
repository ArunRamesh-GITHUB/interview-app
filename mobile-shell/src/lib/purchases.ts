import Purchases from 'react-native-purchases'
import AsyncStorage from '@react-native-async-storage/async-storage'

export async function initPurchases({ apiKey, appUserId }: { apiKey: string, appUserId?: string|null }) {
  await Purchases.configure({ apiKey })
  if (appUserId) {
    const res = await Purchases.logIn(appUserId)
  }
}

export async function getTokenPacks() {
  const offerings = await Purchases.getOfferings()
  return offerings.current?.availablePackages ?? []
}

export async function buyPack(pkg: any) {
  const p = await Purchases.purchasePackage(pkg)
  // Tokens will be granted by our server via webhook; here we can show a toast
  return p
}