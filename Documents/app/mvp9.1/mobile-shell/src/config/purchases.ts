import { Platform } from 'react-native'
import Purchases, { 
  CustomerInfo, 
  Offerings, 
  PurchasesOffering, 
  PurchasesPackage,
  LOG_LEVEL 
} from 'react-native-purchases'

// Product token mapping for server webhook
export const PRODUCT_TOKEN_MAP = {
  sub_starter_monthly: 120,
  sub_plus_monthly: 300,
  sub_pro_monthly: 600,
  sub_power_monthly: 1000,
  pack_50_tokens: 50,
  pack_150_tokens: 150,
  pack_400_tokens: 400,
}

// RevenueCat configuration
class PurchaseConfig {
  private initialized = false

  async initialize(userId?: string) {
    if (this.initialized) return

    const apiKey = Platform.OS === 'android' 
      ? process.env.REVENUECAT_API_KEY_ANDROID || process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY
      : process.env.EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY

    if (!apiKey) {
      throw new Error(`RevenueCat API key not found for ${Platform.OS}`)
    }

    // Configure RevenueCat
    Purchases.setLogLevel(LOG_LEVEL.INFO)
    await Purchases.configure({
      apiKey,
      appUserID: userId || undefined, // Supabase user.id
    })

    this.initialized = true
  }

  async getOfferings(): Promise<Offerings> {
    if (!this.initialized) {
      throw new Error('RevenueCat not initialized. Call initialize() first.')
    }
    return await Purchases.getOfferings()
  }

  async purchasePackage(packageIdentifier: string): Promise<{
    customerInfo: CustomerInfo
    productIdentifier: string
  }> {
    if (!this.initialized) {
      throw new Error('RevenueCat not initialized. Call initialize() first.')
    }

    const offerings = await this.getOfferings()
    const packages = offerings.current?.availablePackages || []
    const targetPackage = packages.find(pkg => pkg.identifier === packageIdentifier)
    
    if (!targetPackage) {
      throw new Error(`Package ${packageIdentifier} not found`)
    }

    const purchaseMade = await Purchases.purchasePackage(targetPackage)
    return {
      customerInfo: purchaseMade.customerInfo,
      productIdentifier: purchaseMade.productIdentifier
    }
  }

  async restorePurchases(): Promise<CustomerInfo> {
    if (!this.initialized) {
      throw new Error('RevenueCat not initialized. Call initialize() first.')
    }
    return await Purchases.restorePurchases()
  }

  async getCustomerInfo(): Promise<CustomerInfo> {
    if (!this.initialized) {
      throw new Error('RevenueCat not initialized. Call initialize() first.')
    }
    return await Purchases.getCustomerInfo()
  }

  async isSubscribed(): Promise<boolean> {
    if (!this.initialized) {
      return false
    }
    
    try {
      const customerInfo = await this.getCustomerInfo()
      return Object.keys(customerInfo.entitlements.active).includes('premium')
    } catch (error) {
      console.error('Error checking subscription status:', error)
      return false
    }
  }

  async setAppUserID(userId: string): Promise<void> {
    if (!this.initialized) {
      throw new Error('RevenueCat not initialized. Call initialize() first.')
    }
    await Purchases.logIn(userId)
  }
}

export const purchaseConfig = new PurchaseConfig()