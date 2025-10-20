// Minimal IAP hook - initializes connection to link Play Billing Library
import { useEffect, useState, useCallback } from 'react'
import { Alert, Platform } from 'react-native'
import * as RNIap from 'react-native-iap'
import { getProductIds } from '../config/iapProducts'

interface User {
  id: string
  email?: string
}

export function useIAP(user?: User) {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Initialize IAP connection to ensure Play Billing Library is linked
  useEffect(() => {
    let mounted = true

    async function initIAP() {
      try {
        console.log('[IAP] Initializing connection...')
        await RNIap.initConnection()
        console.log('[IAP] Connection established')

        if (!mounted) return

        // Fetch products
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
      RNIap.endConnection()
    }
  }, [])

  const buy = useCallback(
    async (sku: string) => {
      Alert.alert('Coming Soon', 'In-app purchases will be enabled once products are created in Play Console.')
      console.log('[IAP] Purchase requested:', sku)
    },
    [user?.id]
  )

  return {
    products,
    loading,
    buy,
  }
}
