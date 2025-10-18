import { useEffect, useRef, useState, useCallback } from 'react'
import { Platform, Alert } from 'react-native'
import * as RNIap from 'react-native-iap'
import { IAP, getProductIds } from '../config/iapProducts'
import type { Product, Purchase, PurchaseError } from 'react-native-iap'

interface User {
  id: string
  email?: string
}

export function useIAP(user?: User) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const purchaseUpdateSub = useRef<any>(null)
  const purchaseErrorSub = useRef<any>(null)

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

        // Fetch consumable products
        const skus = getProductIds(Platform.OS as 'ios' | 'android')
        console.log('[IAP] Fetching products:', skus)

        const productList = await RNIap.getProducts({ skus })
        console.log('[IAP] Loaded products:', productList.length)

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
          }

          console.log('[IAP] Verifying purchase with server...')

          // Verify with server
          const apiUrl =
            process.env.EXPO_PUBLIC_API_URL || 'https://interview-app-4ouh.onrender.com'
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
            // Server verified successfully, finish the transaction as consumable
            console.log('[IAP] Purchase verified, finishing transaction as consumable...')
            await RNIap.finishTransaction({
              purchase,
              isConsumable: true, // All our products are consumables
            })
            console.log('[IAP] Transaction finished successfully')

            // Show success message with token amount
            Alert.alert(
              'Purchase Successful',
              result.message || `${result.tokensGranted || 0} tokens added to your account!`,
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

    purchaseErrorSub.current = RNIap.purchaseErrorListener((error: PurchaseError) => {
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
    })

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
      console.log('[IAP] Ending connection...')
      RNIap.endConnection()
    }
  }, [])

  /**
   * Buy a consumable product
   */
  const buy = useCallback(
    async (sku: string) => {
      if (!user?.id) {
        Alert.alert('Error', 'You must be logged in to make a purchase.')
        return
      }

      try {
        console.log('[IAP] Requesting purchase:', sku)
        await RNIap.requestPurchase({
          sku,
          andDangerouslyFinishTransactionAutomatically: false,
        })
      } catch (error: any) {
        console.error('[IAP] Purchase request error:', error)
        if (error.code !== 'E_USER_CANCELLED') {
          Alert.alert('Purchase Failed', error.message || 'Unable to start purchase')
        }
      }
    },
    [user?.id]
  )

  return {
    products,
    loading,
    buy,
  }
}
