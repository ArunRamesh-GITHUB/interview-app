import { Platform } from 'react-native'
import Purchases, { 
  CustomerInfo, 
  Offerings, 
  PurchasesOffering, 
  PurchasesPackage,
  LOG_LEVEL 
} from 'react-native-purchases'

// Product token mapping for server webhook (matching tokenPacks.js)
export const PRODUCT_TOKEN_MAP = {
  // Google Play Console product IDs (current)
  'starter_monthly': 120,
  'plus_monthly': 250,
  'pro_monthly': 480,
  'power_monthly': 1000,
  // iOS subscription products
  'tokens.starter': 120,
  'tokens.plus': 250,
  'tokens.pro': 480,
  'tokens.power': 1000,
  // Android subscription products (alternative format)
  'tokens_starter': 120,
  'tokens_plus': 250,
  'tokens_pro': 480,
  'tokens_power': 1000,
  // Legacy format for compatibility
  sub_starter_monthly: 120,
  sub_plus_monthly: 250,
  sub_pro_monthly: 480,
  sub_power_monthly: 1000,
}

// RevenueCat configuration
class PurchaseConfig {
  private initialized = false

  async initialize(userId?: string) {
    if (this.initialized) return

    const apiKey = Platform.OS === 'android'
      ? process.env.EXPO_PUBLIC_RC_ANDROID_SDK_KEY || process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY
      : process.env.EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY

    if (!apiKey) {
      throw new Error(`RevenueCat API key not found for ${Platform.OS}`)
    }

    // Configure RevenueCat with debug mode for development
    Purchases.setLogLevel(LOG_LEVEL.DEBUG)
    await Purchases.configure({
      apiKey,
      appUserID: userId || undefined, // Supabase user.id
      usesStoreKit2IfAvailable: false, // Use StoreKit 1 for better compatibility
    })

    console.log('🔑 RevenueCat configured with API key:', apiKey.substring(0, 6) + '...')
    console.log('👤 User ID:', userId)
    console.log('📱 Platform:', Platform.OS)

    this.initialized = true
  }

  async getOfferings(): Promise<Offerings> {
    if (!this.initialized) {
      throw new Error('RevenueCat not initialized. Call initialize() first.')
    }

    const offerings = await Purchases.getOfferings()
    console.log('📦 Offerings current offering:', offerings.current?.identifier || 'NONE')
    console.log('📦 Available packages count:', offerings.current?.availablePackages?.length || 0)

    if (offerings.current?.availablePackages) {
      offerings.current.availablePackages.forEach((pkg, index) => {
        console.log(`📦 Package ${index + 1}:`, {
          identifier: pkg.identifier,
          productId: pkg.product.identifier,
          priceString: pkg.product.priceString
        })
      })
    }

    return offerings
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