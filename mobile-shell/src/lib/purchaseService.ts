import { Product, Purchase } from 'react-native-iap'
import { purchaseConfig, TOKEN_PACKS } from '../config/purchases'

export interface PurchaseResult {
  productIdentifier: string
  transactionId: string
  purchase: Purchase
}

export interface PurchaseService {
  initialize(userId?: string): Promise<void>
  getProducts(): Promise<Product[]>
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

  async getProducts(): Promise<Product[]> {
    return purchaseConfig.getProducts()
  }

  async purchasePackage(productId: string): Promise<PurchaseResult> {
    const purchase = await purchaseConfig.purchaseProduct(productId)
    return {
      productIdentifier: purchase.productId || productId,
      transactionId: purchase.transactionId || '',
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
  if (!productId) return 0;

  // Find the pack that matches any of the product IDs (iOS, Android, or Web)
  const pack = Object.values(TOKEN_PACKS).find(p =>
    p.productIdIOS === productId ||
    p.productIdAndroid === productId ||
    p.productIdWeb === productId
  );

  return pack ? pack.tokens : 0;
}

// Helper to check if product is subscription
// Note: All token packs are now consumables (one-time purchases)
export function isSubscriptionProduct(productId: string): boolean {
  return false // All products are consumables
}

// Helper to check if product is consumable pack
export function isConsumableProduct(productId: string): boolean {
  if (!productId) return false;
  return Object.values(TOKEN_PACKS).some(p =>
    p.productIdIOS === productId ||
    p.productIdAndroid === productId ||
    p.productIdWeb === productId
  );
}
