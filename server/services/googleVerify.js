import { google } from 'googleapis'

/**
 * Verify a Google Play purchase (consumable or subscription)
 * @param {Object} params
 * @param {string} params.packageName - Android package name (e.g., com.yourcompany.nailit)
 * @param {string} params.productId - Product ID from Google Play Console
 * @param {string} params.purchaseToken - Purchase token from the client
 * @returns {Promise<{valid: boolean, expiryTime?: number, autoRenewing?: boolean}>}
 */
export async function verifyGooglePurchase({ packageName, productId, purchaseToken }) {
  try {
    // Check if service account credentials are configured
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
      console.error('[Google Verify] GOOGLE_SERVICE_ACCOUNT_JSON not configured')
      return { valid: false, error: 'Server configuration error' }
    }

    // Parse service account JSON
    let credentials
    try {
      credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON)
    } catch (error) {
      console.error('[Google Verify] Invalid GOOGLE_SERVICE_ACCOUNT_JSON format:', error)
      return { valid: false, error: 'Server configuration error' }
    }

    // Create authenticated client
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/androidpublisher'],
    })

    const androidpublisher = google.androidpublisher({
      version: 'v3',
      auth,
    })

    console.log('[Google Verify] Verifying purchase:', {
      packageName,
      productId,
      tokenPrefix: purchaseToken.substring(0, 20) + '...',
    })

    // Try as consumable/one-time product first
    try {
      const productResponse = await androidpublisher.purchases.products.get({
        packageName,
        productId,
        token: purchaseToken,
      })

      const purchaseState = productResponse.data?.purchaseState
      const consumptionState = productResponse.data?.consumptionState

      console.log('[Google Verify] Product purchase state:', {
        purchaseState,
        consumptionState,
        orderId: productResponse.data?.orderId,
      })

      // purchaseState: 0 = Purchased, 1 = Cancelled, 2 = Pending
      if (purchaseState === 0) {
        return {
          valid: true,
          isConsumable: true,
          orderId: productResponse.data.orderId,
          acknowledgementState: productResponse.data.acknowledgementState,
        }
      } else {
        return {
          valid: false,
          error: `Purchase state: ${purchaseState}`,
        }
      }
    } catch (productError) {
      // If product verification fails, it might be a subscription
      console.log('[Google Verify] Not a product, trying as subscription...')
    }

    // Try as subscription
    try {
      const subscriptionResponse = await androidpublisher.purchases.subscriptions.get({
        packageName,
        subscriptionId: productId,
        token: purchaseToken,
      })

      const expiryTimeMillis = subscriptionResponse.data?.expiryTimeMillis
      const autoRenewing = subscriptionResponse.data?.autoRenewing
      const paymentState = subscriptionResponse.data?.paymentState

      console.log('[Google Verify] Subscription details:', {
        expiryTimeMillis,
        autoRenewing,
        paymentState,
        orderId: subscriptionResponse.data?.orderId,
      })

      // Check if subscription is active
      const now = Date.now()
      const expiryTime = expiryTimeMillis ? parseInt(expiryTimeMillis, 10) : 0

      if (expiryTime > now) {
        return {
          valid: true,
          isConsumable: false,
          expiryTime,
          autoRenewing,
          orderId: subscriptionResponse.data.orderId,
        }
      } else {
        return {
          valid: false,
          error: 'Subscription expired',
        }
      }
    } catch (subscriptionError) {
      console.error('[Google Verify] Subscription verification failed:', subscriptionError.message)
      return {
        valid: false,
        error: 'Unable to verify purchase',
      }
    }
  } catch (error) {
    console.error('[Google Verify] Unexpected error:', error)
    return {
      valid: false,
      error: error.message || 'Verification failed',
    }
  }
}
