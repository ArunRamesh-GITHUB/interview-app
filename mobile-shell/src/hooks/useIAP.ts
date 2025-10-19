// Temporary stub - react-native-iap removed until build issues resolved
import { useState, useCallback } from 'react'
import { Alert } from 'react-native'

interface User {
  id: string
  email?: string
}

interface Product {
  productId: string
  title: string
  description: string
  price: string
}

export function useIAP(user?: User) {
  const [products] = useState<Product[]>([])
  const [loading] = useState(false)

  const buy = useCallback(
    async (sku: string) => {
      Alert.alert('Not Available', 'In-app purchases are temporarily disabled.')
      console.log('[IAP STUB] Purchase requested:', sku)
    },
    [user?.id]
  )

  return {
    products,
    loading,
    buy,
  }
}
