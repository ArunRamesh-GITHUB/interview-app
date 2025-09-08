import { CustomerInfo, Offerings } from 'react-native-purchases'
import { purchaseConfig } from '../config/purchases'

// Direct IAP imports (behind feature flag)
// import RNIap, { Product, Purchase } from 'react-native-iap' // Unused for now

export interface PurchaseResult {
  customerInfo: CustomerInfo
  productIdentifier: string
}

export interface PurchaseService {
  initialize(userId?: string): Promise<void>
  getOfferings(): Promise<Offerings>
  purchasePackage(packageIdentifier: string): Promise<PurchaseResult>
  restorePurchases(): Promise<CustomerInfo>
  getCustomerInfo(): Promise<CustomerInfo>
  isSubscribed(): Promise<boolean>
  setAppUserID(userId: string): Promise<void>
}

// RevenueCat implementation
class RevenueCatService implements PurchaseService {
  async initialize(userId?: string): Promise<void> {
    return purchaseConfig.initialize(userId)
  }

  async getOfferings(): Promise<Offerings> {
    return purchaseConfig.getOfferings()
  }

  async purchasePackage(packageIdentifier: string): Promise<PurchaseResult> {
    return purchaseConfig.purchasePackage(packageIdentifier)
  }

  async restorePurchases(): Promise<CustomerInfo> {
    return purchaseConfig.restorePurchases()
  }

  async getCustomerInfo(): Promise<CustomerInfo> {
    return purchaseConfig.getCustomerInfo()
  }

  async isSubscribed(): Promise<boolean> {
    return purchaseConfig.isSubscribed()
  }

  async setAppUserID(userId: string): Promise<void> {
    return purchaseConfig.setAppUserID(userId)
  }
}

// Direct IAP implementation (placeholder - behind feature flag)
class DirectIAPService implements PurchaseService {
  async initialize(userId?: string): Promise<void> {
    throw new Error('Direct IAP not implemented yet')
  }

  async getOfferings(): Promise<Offerings> {
    throw new Error('Direct IAP not implemented yet')
  }

  async purchasePackage(packageIdentifier: string): Promise<PurchaseResult> {
    throw new Error('Direct IAP not implemented yet')
  }

  async restorePurchases(): Promise<CustomerInfo> {
    throw new Error('Direct IAP not implemented yet')
  }

  async getCustomerInfo(): Promise<CustomerInfo> {
    throw new Error('Direct IAP not implemented yet')
  }

  async isSubscribed(): Promise<boolean> {
    throw new Error('Direct IAP not implemented yet')
  }

  async setAppUserID(userId: string): Promise<void> {
    throw new Error('Direct IAP not implemented yet')
  }
}

// Service factory based on feature flag
function createPurchaseService(): PurchaseService {
  const useDirectIAP = process.env.USE_DIRECT_IAP === 'true'
  
  if (useDirectIAP) {
    return new DirectIAPService()
  } else {
    return new RevenueCatService()
  }
}

export const purchaseService = createPurchaseService()

// Helper function to get token amount from product ID
export function getTokenAmountFromProduct(productId: string): number {
  const tokenMap: { [key: string]: number } = {
    sub_starter_monthly: 120,
    sub_plus_monthly: 300,
    sub_pro_monthly: 600,
    sub_power_monthly: 1000,
    pack_50_tokens: 50,
    pack_150_tokens: 150,
    pack_400_tokens: 400,
  }
  
  return tokenMap[productId] || 0
}

// Helper to check if product is subscription
export function isSubscriptionProduct(productId: string): boolean {
  return productId.startsWith('sub_')
}

// Helper to check if product is consumable pack
export function isConsumableProduct(productId: string): boolean {
  return productId.startsWith('pack_')
}