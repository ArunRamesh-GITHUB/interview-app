/**
 * Native IAP Product Configuration - CONSUMABLES ONLY
 * Shared between mobile app and server
 *
 * Pricing:
 * - Starter: $9.99 → 120 tokens
 * - Plus: $19.99 → 250 tokens
 * - Pro: $39.99 → 480 tokens
 * - Power: $79.99 → 1000 tokens
 */

export const IAP = {
  ios: {
    STARTER: 'com.nailit.pack.starter',  // $9.99  => 120 tokens
    PLUS: 'com.nailit.pack.plus',        // $19.99 => 250 tokens
    PRO: 'com.nailit.pack.pro',          // $39.99 => 480 tokens
    POWER: 'com.nailit.pack.power',      // $79.99 => 1000 tokens
  },
  android: {
    STARTER: 'pack_starter_120',  // $9.99  => 120 tokens
    PLUS: 'pack_plus_250',        // $19.99 => 250 tokens
    PRO: 'pack_pro_480',          // $39.99 => 480 tokens
    POWER: 'pack_power_1000',     // $79.99 => 1000 tokens
  },
} as const

/**
 * Get token amount for a product ID
 */
export function tokensFor(productId: string): number {
  // iOS
  if (productId === IAP.ios.STARTER) return 120
  if (productId === IAP.ios.PLUS) return 250
  if (productId === IAP.ios.PRO) return 480
  if (productId === IAP.ios.POWER) return 1000

  // Android
  if (productId === IAP.android.STARTER) return 120
  if (productId === IAP.android.PLUS) return 250
  if (productId === IAP.android.PRO) return 480
  if (productId === IAP.android.POWER) return 1000

  // Legacy/fallback
  if (productId.includes('120')) return 120
  if (productId.includes('250')) return 250
  if (productId.includes('480')) return 480
  if (productId.includes('1000')) return 1000

  return 0
}

/**
 * Allowlist of valid product IDs
 */
export const ALLOWLIST = new Set<string>([
  IAP.ios.STARTER,
  IAP.ios.PLUS,
  IAP.ios.PRO,
  IAP.ios.POWER,
  IAP.android.STARTER,
  IAP.android.PLUS,
  IAP.android.PRO,
  IAP.android.POWER,
])

/**
 * All product IDs (for fetching from stores)
 */
export const ALL_PRODUCT_IDS = [
  IAP.ios.STARTER,
  IAP.ios.PLUS,
  IAP.ios.PRO,
  IAP.ios.POWER,
  IAP.android.STARTER,
  IAP.android.PLUS,
  IAP.android.PRO,
  IAP.android.POWER,
]

/**
 * Get all product IDs for a specific platform
 */
export function getProductIds(platform: 'ios' | 'android'): string[] {
  return platform === 'ios'
    ? [IAP.ios.STARTER, IAP.ios.PLUS, IAP.ios.PRO, IAP.ios.POWER]
    : [IAP.android.STARTER, IAP.android.PLUS, IAP.android.PRO, IAP.android.POWER]
}

/**
 * Starter pack configuration (free, auto-granted)
 */
export const STARTER_PACK = {
  productId: 'starter_free_20',
  tokens: 20,
  price: 'FREE',
  label: 'Starter',
} as const

/**
 * Get friendly label for product ID
 */
export function getProductLabel(productId: string): string {
  if (productId.includes('starter')) return 'Starter'
  if (productId.includes('plus')) return 'Plus'
  if (productId.includes('pro')) return 'Pro'
  if (productId.includes('power')) return 'Power'
  return 'Unknown'
}
