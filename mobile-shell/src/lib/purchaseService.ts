import { Product, Purchase } from 'react-native-iap'
import { purchaseConfig, PRODUCT_TOKEN_MAP } from '../config/purchases'

export interface PurchaseResult {
  productIdentifier: string
  transactionId: string
  purchase: Purchase
}

export interface Offerings {
  products: Product[]
}

export interface PurchaseService {
  initialize(userId?: string): Promise<void>
  getOfferings(): Promise<Offerings>
  purchasePackage(productId: string): Promise<PurchaseResult>
  restorePurchases(): Promise<Purchase[]>
  getCustomerInfo(): Promise<Purchase[]>
  isSubscribed(): Promise<boolean>
  setAppUserID(userId: string): Promise<void>
}

// Standard IAP implementation
class StandardIAPService implements PurchaseService {
  async initialize(userId?: string): Promise<void> {
    return purchaseConfig.initialize(userId)
  }

  async getOfferings(): Promise<Offerings> {
    const products = await purchaseConfig.getProducts()
    return { products }
  }

  async purchasePackage(productId: string): Promise<PurchaseResult> {
    const purchase = await purchaseConfig.purchaseProduct(productId)
    return {
      productIdentifier: purchase.productId,
      transactionId: purchase.transactionId,
      purchase
    }
  }

  async restorePurchases(): Promise<Purchase[]> {
    return purchaseConfig.restorePurchases()
  }

  async getCustomerInfo(): Promise<Purchase[]> {
    return purchaseConfig.getAvailablePurchases()
  }

  async isSubscribed(): Promise<boolean> {
    return purchaseConfig.isSubscribed()
  }

  async setAppUserID(userId: string): Promise<void> {
    // For standard IAP, user ID is handled server-side
    // Reinitialize with new user ID if needed
    await purchaseConfig.initialize(userId)
  }
}

export const purchaseService = new StandardIAPService()

// Helper function to get token amount from product ID
export function getTokenAmountFromProduct(productId: string): number {
  return PRODUCT_TOKEN_MAP[productId] || 0
}

// Helper to check if product is subscription
// Note: All token packs are now consumables (one-time purchases)
export function isSubscriptionProduct(productId: string): boolean {
  return false // All products are consumables
}

// Helper to check if product is consumable pack
export function isConsumableProduct(productId: string): boolean {
  return productId.startsWith('pack_')
}
