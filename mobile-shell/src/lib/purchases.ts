import { Product, Purchase } from 'react-native-iap'
import { purchaseConfig } from '../config/purchases'

export async function initPurchases({ appUserId }: { appUserId?: string | null }) {
  await purchaseConfig.initialize(appUserId || undefined)
}

export async function getTokenPacks(): Promise<Product[]> {
  return await purchaseConfig.getProducts()
}

export async function buyPack(productId: string): Promise<Purchase> {
  return await purchaseConfig.purchaseProduct(productId)
}
