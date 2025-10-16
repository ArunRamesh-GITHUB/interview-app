import { useEffect, useRef, useState, useCallback } from 'react'
import { Platform, Alert } from 'react-native'
import * as RNIap from 'react-native-iap'
import {
  IAP_PRODUCTS,
  isSubscription,
  getSubscriptionProducts,
  getConsumableProducts,
} from '../../../config/iapProducts'
import type {
  Product,
  Subscription,
  Purchase,
  PurchaseError,
} from 'react-native-iap'

interface User {
  id: string
  email?: string
}

interface IAPState {
  products: Product[]
  subscriptions: Subscription[]
  loading: boolean
  connected: boolean
}

export function useIAP(user?: User) {
  const [state, setState] = useState<IAPState>({
    products: [],
    subscriptions: [],
    loading: true,
    connected: false,
  })

  const purchaseUpdateSub = useRef<any>(null)
  const purchaseErrorSub = useRef<any>(null)
  const isInitialized = useRef(false)

  // Initialize IAP connection and fetch products
  useEffect(() => {
    let mounted = true

    async function initIAP() {
      try {
        console.log('[IAP] Initializing connection...')
        await RNIap.initConnection()
        console.log('[IAP] Connection established')

        if (!mounted) return

        // Flush failed purchases on Android
        if (Platform.OS === 'android') {
          try {
            await RNIap.flushFailedPurchasesCachedAsPendingAndroid()
            console.log('[IAP] Flushed failed purchases')
          } catch (error) {
            console.warn('[IAP] Failed to flush purchases:', error)
          }
        }

        // Fetch available products
        const platform = Platform.OS === 'ios' ? 'ios' : 'android'
        const subscriptionSkus = getSubscriptionProducts(platform)
        const consumableSkus = getConsumableProducts(platform)

        console.log('[IAP] Fetching subscriptions:', subscriptionSkus)
        console.log('[IAP] Fetching consumables:', consumableSkus)

        const [subs, products] = await Promise.all([
          RNIap.getSubscriptions({ skus: subscriptionSkus }),
          RNIap.getProducts({ skus: consumableSkus }),
        ])

        console.log('[IAP] Loaded subscriptions:', subs.length)
        console.log('[IAP] Loaded products:', products.length)

        if (mounted) {
          setState({
            subscriptions: subs,
            products,
            loading: false,
            connected: true,
          })
          isInitialized.current = true
        }
      } catch (error) {
        console.error('[IAP] Initialization error:', error)
        if (mounted) {
          setState((prev) => ({ ...prev, loading: false, connected: false }))
        }
      }
    }

    initIAP()

    return () => {
      mounted = false
    }
  }, [])

  // Set up purchase listeners
  useEffect(() => {
    if (!user?.id) {
      console.log('[IAP] No user ID, skipping purchase listeners')
      return
    }

    purchaseUpdateSub.current = RNIap.purchaseUpdatedListener(
      async (purchase: Purchase) => {
        console.log('[IAP] Purchase updated:', {
          productId: purchase.productId,
          transactionId: purchase.transactionId,
        })

        try {
          // Prepare verification request
          const verificationData: any = {
            userId: user.id,
            productId: purchase.productId,
            platform: Platform.OS,
            orderId: purchase.transactionId,
          }

          // Add platform-specific purchase data
          if (Platform.OS === 'ios') {
            verificationData.transactionReceipt = purchase.transactionReceipt
          } else if (Platform.OS === 'android') {
            verificationData.purchaseToken = (purchase as any).purchaseToken
            verificationData.packageName = (purchase as any).packageNameAndroid
          }

          console.log('[IAP] Verifying purchase with server...')

          // Verify with server
          const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://interview-app-4ouh.onrender.com'
          const response = await fetch(`${apiUrl}/api/iap/verify-purchase`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(verificationData),
          })

          const result = await response.json()
          console.log('[IAP] Server verification result:', result)

          if (result?.ok) {
            // Server verified successfully, finish the transaction
            console.log('[IAP] Purchase verified, finishing transaction...')
            await RNIap.finishTransaction({
              purchase,
              isConsumable: result.isConsumable ?? !isSubscription(purchase.productId),
            })
            console.log('[IAP] Transaction finished successfully')

            // Show success message
            Alert.alert(
              'Purchase Successful',
              result.message || 'Your purchase has been completed!',
              [{ text: 'OK' }]
            )
          } else {
            // Server verification failed
            console.error('[IAP] Server verification failed:', result.error)
            Alert.alert(
              'Purchase Failed',
              result.error || 'Unable to verify your purchase. Please try again.',
              [{ text: 'OK' }]
            )
            // Do NOT finish transaction - it will be retried later
          }
        } catch (error: any) {
          console.error('[IAP] Purchase verification error:', error)
          Alert.alert(
            'Purchase Error',
            'Unable to complete your purchase. Please try again.',
            [{ text: 'OK' }]
          )
          // Do NOT finish transaction on error - it will be retried later
        }
      }
    )

    purchaseErrorSub.current = RNIap.purchaseErrorListener(
      (error: PurchaseError) => {
        console.warn('[IAP] Purchase error:', {
          code: error.code,
          message: error.message,
        })

        // Don't show alert for user cancellations
        if (error.code === 'E_USER_CANCELLED') {
          console.log('[IAP] User cancelled purchase')
          return
        }

        Alert.alert('Purchase Error', error.message || 'Unable to complete purchase')
      }
    )

    return () => {
      if (purchaseUpdateSub.current) {
        purchaseUpdateSub.current.remove()
        purchaseUpdateSub.current = null
      }
      if (purchaseErrorSub.current) {
        purchaseErrorSub.current.remove()
        purchaseErrorSub.current = null
      }
    }
  }, [user?.id])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isInitialized.current) {
        console.log('[IAP] Ending connection...')
        RNIap.endConnection()
        isInitialized.current = false
      }
    }
  }, [])

  /**
   * Purchase a subscription
   */
  const purchaseSubscription = useCallback(
    async (productId: string) => {
      if (!state.connected) {
        Alert.alert('Error', 'Store is not connected. Please try again.')
        return
      }

      if (!user?.id) {
        Alert.alert('Error', 'You must be logged in to make a purchase.')
        return
      }

      try {
        console.log('[IAP] Requesting subscription:', productId)
        await RNIap.requestSubscription({
          sku: productId,
          andDangerouslyFinishTransactionAutomatically: false,
        })
      } catch (error: any) {
        console.error('[IAP] Subscription request error:', error)
        if (error.code !== 'E_USER_CANCELLED') {
          Alert.alert('Purchase Failed', error.message || 'Unable to start purchase')
        }
      }
    },
    [state.connected, user?.id]
  )

  /**
   * Purchase a consumable product
   */
  const purchaseProduct = useCallback(
    async (productId: string) => {
      if (!state.connected) {
        Alert.alert('Error', 'Store is not connected. Please try again.')
        return
      }

      if (!user?.id) {
        Alert.alert('Error', 'You must be logged in to make a purchase.')
        return
      }

      try {
        console.log('[IAP] Requesting product:', productId)
        await RNIap.requestPurchase({
          sku: productId,
          andDangerouslyFinishTransactionAutomatically: false,
        })
      } catch (error: any) {
        console.error('[IAP] Product purchase error:', error)
        if (error.code !== 'E_USER_CANCELLED') {
          Alert.alert('Purchase Failed', error.message || 'Unable to start purchase')
        }
      }
    },
    [state.connected, user?.id]
  )

  /**
   * Restore previous purchases
   */
  const restorePurchases = useCallback(async () => {
    if (!state.connected) {
      Alert.alert('Error', 'Store is not connected. Please try again.')
      return []
    }

    try {
      console.log('[IAP] Restoring purchases...')
      const purchases = await RNIap.getAvailablePurchases()
      console.log('[IAP] Found purchases:', purchases.length)

      if (purchases.length === 0) {
        Alert.alert('No Purchases Found', 'No previous purchases were found to restore.')
        return []
      }

      // Optionally, send to server to reconcile
      if (user?.id) {
        try {
          const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://interview-app-4ouh.onrender.com'
          await fetch(`${apiUrl}/api/iap/restore-purchases`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.id,
              platform: Platform.OS,
              purchases: purchases.map((p) => ({
                productId: p.productId,
                transactionId: p.transactionId,
                transactionReceipt: p.transactionReceipt,
                purchaseToken: (p as any).purchaseToken,
              })),
            }),
          })
        } catch (error) {
          console.warn('[IAP] Failed to sync restored purchases with server:', error)
        }
      }

      Alert.alert(
        'Purchases Restored',
        `Successfully restored ${purchases.length} purchase(s).`
      )
      return purchases
    } catch (error: any) {
      console.error('[IAP] Restore purchases error:', error)
      Alert.alert('Restore Failed', error.message || 'Unable to restore purchases')
      return []
    }
  }, [state.connected, user?.id])

  return {
    // State
    products: state.products,
    subscriptions: state.subscriptions,
    loading: state.loading,
    connected: state.connected,

    // Actions
    purchaseSubscription,
    purchaseProduct,
    restorePurchases,
  }
}
