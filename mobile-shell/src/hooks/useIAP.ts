// IAP hook with full Google Play Billing integration
import { useEffect, useState, useCallback, useRef } from 'react'
import { Alert, Platform } from 'react-native'
import * as RNIap from 'react-native-iap'
import { getProductIds, tokensFor } from '../config/iapProducts'

interface User {
  id: string
  email?: string
}

export function useIAP(user?: User) {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(false)
  const purchaseUpdateSub = useRef<RNIap.PurchaseUpdatedListener | null>(null)
  const purchaseErrorSub = useRef<RNIap.PurchaseErrorListener | null>(null)

  // Initialize IAP connection and set up purchase listeners
  useEffect(() => {
    let mounted = true

    async function initIAP() {
      try {
        console.log('[IAP] Initializing connection...')
        await RNIap.initConnection()
        console.log('[IAP] Connection established')

        // Clear any pending purchases on Android
        if (Platform.OS === 'android') {
          await RNIap.flushFailedPurchasesCachedAsPendingAndroid()
        }

        if (!mounted) return

        // Fetch products
        const skus = getProductIds(Platform.OS as 'ios' | 'android')
        console.log('[IAP] Fetching products:', skus)

        const productList = await RNIap.getProducts({ skus })
        console.log('[IAP] Loaded products:', productList.length, productList)

        if (mounted) {
          setProducts(productList)
          setLoading(false)
        }
      } catch (error) {
        console.error('[IAP] Initialization error:', error)
        if (mounted) {
          setLoading(false)
        }
      }
    }

    // Set up purchase listeners
    purchaseUpdateSub.current = RNIap.purchaseUpdatedListener(async (purchase) => {
      try {
        console.log('[IAP] Purchase received:', purchase)

        const sku = purchase.productId
        const tokens = tokensFor(sku)

        console.log(`[IAP] Granting ${tokens} tokens for ${sku}`)

        // TODO: Verify purchase on server and grant tokens
        // For now, just consume the purchase

        // Consume the purchase (for consumables on Android)
        if (Platform.OS === 'android' && purchase.purchaseToken) {
          await RNIap.consumePurchaseAndroid(purchase.purchaseToken)
          console.log('[IAP] Purchase consumed successfully')
        } else if (Platform.OS === 'ios') {
          await RNIap.finishTransaction({ purchase, isConsumable: true })
          console.log('[IAP] Transaction finished successfully')
        }

        Alert.alert('Purchase Successful', `You received ${tokens} tokens!`)
        setPurchasing(false)
      } catch (err) {
        console.error('[IAP] Purchase handler error:', err)
        setPurchasing(false)
        Alert.alert('Error', 'Failed to process purchase. Please contact support.')
      }
    })

    purchaseErrorSub.current = RNIap.purchaseErrorListener((err) => {
      console.warn('[IAP] Purchase error:', err)
      setPurchasing(false)

      // Don't show alert for user cancellation
      if (err.code !== 'E_USER_CANCELLED') {
        Alert.alert('Purchase Failed', err.message || 'An error occurred')
      }
    })

    initIAP()

    return () => {
      mounted = false
      purchaseUpdateSub.current?.remove()
      purchaseErrorSub.current?.remove()
      RNIap.endConnection()
    }
  }, [])

  const buy = useCallback(
    async (sku: string) => {
      if (!user?.id) {
        Alert.alert('Error', 'You must be logged in to make a purchase')
        return
      }

      if (purchasing) {
        console.log('[IAP] Purchase already in progress')
        return
      }

      try {
        console.log('[IAP] Requesting purchase:', sku)
        setPurchasing(true)

        await RNIap.requestPurchase({
          sku,
          andDangerouslyFinishTransactionAutomatically: false
        })
      } catch (err: any) {
        console.error('[IAP] Purchase request failed:', err)
        setPurchasing(false)

        // Don't show alert for user cancellation
        if (err.code !== 'E_USER_CANCELLED') {
          Alert.alert('Purchase Failed', err.message || 'Failed to initiate purchase')
        }
      }
    },
    [user?.id, purchasing]
  )

  return {
    products,
    loading,
    purchasing,
    buy,
  }
}
