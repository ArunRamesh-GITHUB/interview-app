/**
 * Native IAP Product Configuration - CONSUMABLES ONLY
 * Shared between mobile app and server
 *
 * Pricing:
 * - Starter: FREE (20 tokens auto-granted on signup)
 * - Plus: £4.99 → 500 tokens
 * - Pro: £9.99 → 1200 tokens
 * - Power: £19.99 → 3000 tokens
 */

export const IAP = {
  ios: {
    PLUS: 'nailit.tokens.plus',   // £4.99  => 500 tokens
    PRO: 'nailit.tokens.pro',      // £9.99  => 1200 tokens
    POWER: 'nailit.tokens.power',  // £19.99 => 3000 tokens
  },
  android: {
    PLUS: 'nailit_tokens_plus',    // £4.99  => 500 tokens
    PRO: 'nailit_tokens_pro',      // £9.99  => 1200 tokens
    POWER: 'nailit_tokens_power',  // £19.99 => 3000 tokens
  },
} as const

/**
 * Get token amount for a product ID
 */
export function tokensFor(productId: string): number {
  // iOS
  if (productId === IAP.ios.PLUS) return 500
  if (productId === IAP.ios.PRO) return 1200
  if (productId === IAP.ios.POWER) return 3000

  // Android
  if (productId === IAP.android.PLUS) return 500
  if (productId === IAP.android.PRO) return 1200
  if (productId === IAP.android.POWER) return 3000

  return 0
}

/**
 * Allowlist of valid product IDs
 */
export const ALLOWLIST = new Set<string>([
  IAP.ios.PLUS,
  IAP.ios.PRO,
  IAP.ios.POWER,
  IAP.android.PLUS,
  IAP.android.PRO,
  IAP.android.POWER,
])

/**
 * All product IDs (for fetching from stores)
 */
export const ALL_PRODUCT_IDS = [
  IAP.ios.PLUS,
  IAP.ios.PRO,
  IAP.ios.POWER,
  IAP.android.PLUS,
  IAP.android.PRO,
  IAP.android.POWER,
]

/**
 * Get all product IDs for a specific platform
 */
export function getProductIds(platform: 'ios' | 'android'): string[] {
  return platform === 'ios'
    ? [IAP.ios.PLUS, IAP.ios.PRO, IAP.ios.POWER]
    : [IAP.android.PLUS, IAP.android.PRO, IAP.android.POWER]
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
  if (productId.includes('plus')) return 'Plus'
  if (productId.includes('pro')) return 'Pro'
  if (productId.includes('power')) return 'Power'
  return 'Unknown'
}
