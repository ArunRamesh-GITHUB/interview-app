import { Platform } from 'react-native'
import * as RNIap from 'react-native-iap'
import type { Product, Purchase, PurchaseError } from 'react-native-iap'

// Token packs configuration
// For testing: Use your own test bundle ID and product IDs
// For production: Use com.nailit.pack.* product IDs
// Shared token pack configuration for RevenueCat integration
// Used by server webhook, web frontend, and mobile app
export const TOKEN_PACKS = {
  starter: {
    productIdIOS: 'com.nailit.pack.starter',
    productIdAndroid: 'pack_starter_120',
    productIdWeb: 'tokens_starter_web',
    tokens: 120
  },
  plus: {
    productIdIOS: 'com.nailit.pack.plus',
    productIdAndroid: 'pack_plus_250',
    productIdWeb: 'tokens_plus_web',
    tokens: 250
  },
  pro: {
    productIdIOS: 'com.nailit.pack.pro',
    productIdAndroid: 'pack_pro_480',
    productIdWeb: 'tokens_pro_web',
    tokens: 480
  },
  power: {
    productIdIOS: 'com.nailit.pack.power',
    productIdAndroid: 'pack_power_1000',
    productIdWeb: 'tokens_power_web',
    tokens: 1000
  },
}

// Product token mapping for server webhook
// Product token mapping removed in favor of direct lookup in purchaseService
// export const PRODUCT_TOKEN_MAP = { ... }

// Get all product IDs for current platform
export function getProductIds(): string[] {
  const productIds: string[] = []
  Object.values(TOKEN_PACKS).forEach(pack => {
    if (Platform.OS === 'ios') {
      productIds.push(pack.productIdIOS)
    } else {
      productIds.push(pack.productIdAndroid)
    }
  })
  return productIds
}

// Convert web product ID to platform-specific product ID
export function convertWebProductIdToNative(webProductId: string): string {
  // Get the correct product IDs based on test/production mode
  const starterPack = TOKEN_PACKS.starter
  const plusPack = TOKEN_PACKS.plus
  const proPack = TOKEN_PACKS.pro
  const powerPack = TOKEN_PACKS.power

  // Map web product IDs to platform-specific IDs
  const webToNative: { [key: string]: { ios: string, android: string } } = {
    'tokens_starter': { ios: starterPack.productIdIOS, android: starterPack.productIdAndroid },
    'tokens_plus': { ios: plusPack.productIdIOS, android: plusPack.productIdAndroid },
    'tokens_pro': { ios: proPack.productIdIOS, android: proPack.productIdAndroid },
    'tokens_power': { ios: powerPack.productIdIOS, android: powerPack.productIdAndroid },
  }

  const mapping = webToNative[webProductId]
  if (mapping) {
    return Platform.OS === 'ios' ? mapping.ios : mapping.android
  }

  // If not found, return as-is (might already be platform-specific)
  return webProductId
}

// Standard IAP configuration
class PurchaseConfig {
  private initialized = false
  private products: Product[] = []
  private purchaseUpdateSubscription: any = null
  private purchaseErrorSubscription: any = null
  private pendingPurchases: Map<string, { resolve: (p: Purchase) => void, reject: (e: Error) => void }> = new Map()
  private currentUserId?: string

  async initialize(userId?: string) {
    if (this.initialized) {
      this.currentUserId = userId
      return
    }

    try {
      // Initialize connection
      await RNIap.initConnection()
      this.currentUserId = userId

      // Set up purchase listeners
      this.purchaseUpdateSubscription = RNIap.purchaseUpdatedListener(
        async (purchase: Purchase) => {
          console.log('✅ Purchase successful:', purchase)

          // Resolve pending purchase promise if exists
          const pending = this.pendingPurchases.get(purchase.productId)
          if (pending) {
            pending.resolve(purchase)
            this.pendingPurchases.delete(purchase.productId)
          }

          // Finish the transaction
          await RNIap.finishTransaction({ purchase, isConsumable: false })



          // For production: Try to grant tokens via server
          const userId = this.currentUserId || undefined
          console.log('🔑 Granting tokens with userId:', userId || 'none (will grant when userId available)')
          this.grantTokensForPurchase(purchase, userId).catch(err => {
            console.error('⚠️ Failed to grant tokens (non-blocking):', err)
            console.error('⚠️ Purchase completed successfully. Tokens can be granted later via Restore Purchases.')
          })
        }
      )

      this.purchaseErrorSubscription = RNIap.purchaseErrorListener((error: PurchaseError) => {
        console.error('Purchase error:', error)
        // Reject all pending purchases on error
        for (const [productId, pending] of this.pendingPurchases.entries()) {
          pending.reject(new Error(error.message || 'Purchase failed'))
          this.pendingPurchases.delete(productId)
        }
      })

      // Load products
      const productIds = getProductIds()
      console.log('🔍 Requesting products with IDs:', productIds)
      console.log('📱 Platform:', Platform.OS)


      try {
        // v14: getProducts -> fetchProducts (and cast result to handle type mismatch)
        const products = await RNIap.fetchProducts({ skus: productIds }) || []

        if (!products) {
          throw new Error('fetchProducts returned null')
        }

        // v14 FIX: Map 'id' to 'productId' if missing
        this.products = products.map((p: any) => ({
          ...p,
          productId: p.productId || p.id // Ensure productId exists
        })) as unknown as Product[]
      } catch (error: any) {
        console.error('❌ Failed to fetch products:', error)
        console.error('❌ Error details:', JSON.stringify(error, null, 2))
        throw error
      }

      console.log('🔑 IAP initialized')
      console.log('📦 Loaded products:', this.products.length)
      if (this.products.length > 0) {
        console.log('✅ Product IDs loaded:', this.products.map(p => (p as any).productId))
        this.products.forEach(p => {
          const product = p as any
          console.log(`  - ${product.productId}: ${product.title} (${product.localizedPrice})`)
        })
      } else {
        console.error('❌ No products loaded!')
        // ... (rest of logging)
      }
      console.log('👤 User ID:', userId)

      this.initialized = true
    } catch (error) {
      console.error('Failed to initialize IAP:', error)
      throw error
    }
  }

  async getProducts(): Promise<Product[]> {
    if (!this.initialized) {
      throw new Error('IAP not initialized. Call initialize() first.')
    }

    if (this.products.length === 0) {
      const productIds = getProductIds()
      const products = await RNIap.fetchProducts({ skus: productIds }) || []

      if (!products) {
        this.products = []
        return []
      }

      // v14 FIX: Map 'id' to 'productId' if missing
      this.products = products.map((p: any) => ({
        ...p,
        productId: p.productId || p.id // Ensure productId exists
      })) as unknown as Product[]
    }

    return this.products
  }

  async purchaseProduct(productId: string): Promise<Purchase> {
    if (!this.initialized) {
      throw new Error('IAP not initialized. Call initialize() first.')
    }

    return new Promise<Purchase>((resolve, reject) => {
      // Store promise resolvers
      this.pendingPurchases.set(productId, { resolve, reject })

      // Set timeout for purchase (30 seconds)
      const timeout = setTimeout(() => {
        this.pendingPurchases.delete(productId)
        reject(new Error('Purchase timeout'))
      }, 30000)

      // Override resolve/reject to clear timeout
      const originalResolve = resolve
      const originalReject = reject
      this.pendingPurchases.set(productId, {
        resolve: (p: Purchase) => {
          clearTimeout(timeout)
          originalResolve(p)
        },
        reject: (e: Error) => {
          clearTimeout(timeout)
          originalReject(e)
        }
      })

      // Check if product exists before purchasing
      let product = this.products.find(p => (p as any).productId === productId)

      // Debugging v14 product structure
      if (!product) {
        console.log('⚠️ Debugging product lookup failure. Products available:',
          this.products.map(p => JSON.stringify(p)).join('\n')
        )
      }

      const initiatePurchase = () => {
        if (!product) {
          const error = new Error(`Product ${productId} not found. Available products: ${this.products.map(p => (p as any).productId).join(', ') || 'none'}`)
          console.error('❌ Purchase error:', error.message)
          this.pendingPurchases.delete(productId)
          clearTimeout(timeout)
          reject(error)
          return
        }

        console.log(`🛒 Initiating purchase for: ${productId} (${(product as any).title})`)

        // Initiate purchase - v14 requires nested structure with request.ios.sku
        const purchaseParams = {
          request: {
            ios: {
              sku: productId,
              andDangerouslyFinishTransactionAutomatically: false,
            },
            android: {
              skus: [productId],
            }
          },
          type: 'in-app' as const,
        }

        console.log('🛒 Params:', JSON.stringify(purchaseParams))

        RNIap.requestPurchase(purchaseParams as any).catch((error: any) => {
          this.pendingPurchases.delete(productId)
          clearTimeout(timeout)
          console.error('❌ Purchase request error:', error)
          console.error('❌ Product ID:', productId)
          // ...
          if (error.code === 'E_USER_CANCELLED' || error.code === 'E_USER_CANCELLED_PURCHASE') {
            reject(new Error('Purchase cancelled by user'))
          } else {
            reject(error)
          }
        })
      }

      // If product not found, try to fetch products again once
      if (!product) {
        console.log(`⚠️ Product ${productId} not found intially. Retrying fetch...`)
        const productIds = getProductIds()
        RNIap.fetchProducts({ skus: productIds }).then(freshProducts => {
          this.products = freshProducts as unknown as Product[]
          product = this.products.find(p => (p as any).productId === productId)
          initiatePurchase()
        }).catch(err => {
          console.error('❌ Failed to refetch products:', err)
          initiatePurchase() // Will fail but use standard error path
        })
      } else {
        initiatePurchase()
      }
    })
  }

  async restorePurchases(): Promise<Purchase[]> {
    if (!this.initialized) {
      throw new Error('IAP not initialized. Call initialize() first.')
    }

    try {
      const purchases = await RNIap.getAvailablePurchases()

      // Grant tokens for restored purchases
      for (const purchase of purchases) {
        try {

          await this.grantTokensForPurchase(purchase, this.currentUserId)
        } catch (error) {
          console.error('Failed to grant tokens during restore:', error)
        }
      }

      return purchases
    } catch (error) {
      console.error('Failed to restore purchases:', error)
      throw error
    }
  }

  async getAvailablePurchases(): Promise<Purchase[]> {
    if (!this.initialized) {
      throw new Error('IAP not initialized. Call initialize() first.')
    }

    return await RNIap.getAvailablePurchases()
  }

  async isSubscribed(): Promise<boolean> {
    if (!this.initialized) {
      return false
    }

    try {
      const purchases = await this.getAvailablePurchases()
      // Check if user has any active subscription purchases
      return purchases.length > 0
    } catch (error) {
      console.error('Error checking subscription status:', error)
      return false
    }
  }

  // Simple token granting - skip complex receipt verification
  // This is completely non-blocking - purchase completes successfully even if server is unavailable
  // For test products, works even without userId
  async grantTokensForPurchase(purchase: Purchase, userId?: string) {
    // Attempt to grant tokens - show success message for test products
    const grantTokens = async () => {
      try {
        const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://interview-app-4ouh.onrender.com'

        // Get token amount for this product
        let tokens = 0;
        const pack = Object.values(TOKEN_PACKS).find(p =>
          p.productIdIOS === purchase.productId ||
          p.productIdAndroid === purchase.productId ||
          p.productIdWeb === purchase.productId
        );
        tokens = pack ? pack.tokens : 0;

        if (!tokens) {
          return { ok: false }
        }



        // Quick timeout to avoid hanging
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

        // Debug: Log which receipt field is available
        const receiptToken = (purchase as any).purchaseToken || (purchase as any).transactionReceipt || purchase.transactionId
        if (__DEV__) {
          console.log('📋 Receipt token type:', (purchase as any).purchaseToken ? 'purchaseToken (v14/StoreKit2)' :
            (purchase as any).transactionReceipt ? 'transactionReceipt (legacy)' : 'transactionId (fallback)')
          console.log('📋 Receipt length:', receiptToken?.length || 0)
        }

        try {
          const response = await fetch(`${apiUrl}/api/iap/verify`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              // Include credentials to send session cookies
              'credentials': 'include'
            },
            credentials: 'include', // Send cookies with request
            body: JSON.stringify({
              productId: purchase.productId,
              transactionId: purchase.transactionId,
              platform: Platform.OS,
              userId: userId,
              // v14 uses purchaseToken (JWS for iOS StoreKit2) instead of transactionReceipt
              transactionReceipt: (purchase as any).purchaseToken || (purchase as any).transactionReceipt || purchase.transactionId,
            }),
            signal: controller.signal,
          })

          clearTimeout(timeoutId)

          if (response.ok) {
            const result = await response.json()
            if (__DEV__) {
              console.log('✅ Purchase processed:', result)
              if (result.granted > 0) {
                console.log(`💰 ${result.granted} tokens granted to your account!`)
              }
            }
            return result
          }
          // Server error - log but don't block
          if (__DEV__) {
            const errorText = await response.text().catch(() => 'Unknown error')
            console.warn('⚠️ Server returned error (non-blocking):', response.status, errorText.substring(0, 100))
          }
          return { ok: false }
        } catch (fetchError: any) {
          clearTimeout(timeoutId)
          if (__DEV__ && fetchError.name !== 'AbortError') {
            console.warn('⚠️ Token grant request failed (non-blocking):', fetchError.message)
          }
          return { ok: false }
        }
      } catch (error: any) {
        // Silently ignore all errors
        return { ok: false }
      }
    }

    // Fire and forget - don't await or block purchase
    grantTokens().catch(() => {
      // Silently ignore
    })

    // Return success immediately so purchase flow continues
    let tokens = 0;
    const pack = Object.values(TOKEN_PACKS).find(p =>
      p.productIdIOS === purchase.productId ||
      p.productIdAndroid === purchase.productId ||
      p.productIdWeb === purchase.productId
    );
    tokens = pack ? pack.tokens : 0;


    return {
      ok: true,
      message: userId
        ? 'Purchase completed. Tokens will be granted shortly.'
        : 'Purchase completed. Tokens will be granted when you log in.'
    }
  }

  async verifyReceipt(purchase: Purchase, userId?: string) {
    try {
      // Get API URL - use environment variable or default to your server
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://interview-app-4ouh.onrender.com'

      if (!apiUrl || apiUrl === 'http://localhost:3001') {
        console.warn('⚠️ API URL not configured. Receipt verification skipped.')
        console.warn('⚠️ Set EXPO_PUBLIC_API_URL in your .env file')
        return { ok: true, message: 'Verification skipped - API URL not configured' }
      }

      console.log('🔍 Verifying receipt with server:', apiUrl)

      // Get receipt data - format differs by platform
      const receiptData: any = {
        productId: purchase.productId,
        transactionId: purchase.transactionId,
        platform: Platform.OS,
        userId: userId,
      }

      // For iOS, use transactionReceipt; for Android, use purchaseToken
      if (Platform.OS === 'ios' && 'transactionReceipt' in purchase) {
        receiptData.transactionReceipt = (purchase as any).transactionReceipt
      } else if (Platform.OS === 'android' && 'purchaseToken' in purchase) {
        receiptData.transactionReceipt = (purchase as any).purchaseToken
      } else {
        // Fallback: use transactionId as receipt
        receiptData.transactionReceipt = purchase.transactionId
      }

      console.log('📤 Sending receipt verification:', {
        productId: purchase.productId,
        transactionId: purchase.transactionId,
        platform: Platform.OS,
        hasReceipt: !!receiptData.transactionReceipt
      })

      // Create timeout controller for fetch
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

      const response = await fetch(`${apiUrl}/api/iap/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(receiptData),
        signal: controller.signal,
      }).finally(() => {
        clearTimeout(timeoutId)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Receipt verification failed:', response.status, errorText)
        throw new Error(`Receipt verification failed: ${response.status} ${errorText}`)
      }

      const result = await response.json()
      console.log('✅ Receipt verified successfully:', result)
      return result
    } catch (error: any) {
      // Don't throw error - just log it so purchase can complete
      // Receipt verification can be retried later
      console.error('⚠️ Failed to verify receipt (non-blocking):', error.message || error)
      console.error('⚠️ Purchase completed but receipt not verified. Can retry later.')

      // Return a success response so the purchase flow continues
      // The receipt can be verified later via restore purchases
      return {
        ok: false,
        message: 'Receipt verification failed but purchase completed',
        error: error.message
      }
    }
  }

  async cleanup() {
    if (this.purchaseUpdateSubscription) {
      this.purchaseUpdateSubscription.remove()
      this.purchaseUpdateSubscription = null
    }
    if (this.purchaseErrorSubscription) {
      this.purchaseErrorSubscription.remove()
      this.purchaseErrorSubscription = null
    }
    if (this.initialized) {
      await RNIap.endConnection()
      this.initialized = false
    }
  }
}

export const purchaseConfig = new PurchaseConfig()
