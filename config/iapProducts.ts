/**
 * Native IAP Product Configuration
 * Shared between mobile app and server
 */

export const IAP_PRODUCTS = {
  ios: {
    // Subscriptions (monthly recurring)
    STARTER_MONTHLY: 'nailit.starter.monthly',
    PLUS_MONTHLY: 'nailit.plus.monthly',
    PRO_MONTHLY: 'nailit.pro.monthly',
    POWER_MONTHLY: 'nailit.power.monthly',

    // Optional: One-time token packs (consumables)
    TOKENS_1K: 'nailit.tokens.1k',
    TOKENS_5K: 'nailit.tokens.5k',
  },
  android: {
    // Subscriptions (monthly recurring)
    STARTER_MONTHLY: 'nailit_starter_monthly',
    PLUS_MONTHLY: 'nailit_plus_monthly',
    PRO_MONTHLY: 'nailit_pro_monthly',
    POWER_MONTHLY: 'nailit_power_monthly',

    // Optional: One-time token packs (consumables)
    TOKENS_1K: 'nailit_tokens_1k',
    TOKENS_5K: 'nailit_tokens_5k',
  },
}

/**
 * Check if a product ID is a subscription (vs consumable)
 */
export function isSubscription(productId: string): boolean {
  return /monthly|annual|yearly|subscription/i.test(productId)
}

/**
 * Get token amount for a product ID
 */
export function tokensForProduct(productId: string): number {
  const tokenMap: Record<string, number> = {
    // Monthly subscriptions
    'nailit.starter.monthly': 120,
    'nailit.plus.monthly': 250,
    'nailit.pro.monthly': 480,
    'nailit.power.monthly': 1000,
    'nailit_starter_monthly': 120,
    'nailit_plus_monthly': 250,
    'nailit_pro_monthly': 480,
    'nailit_power_monthly': 1000,

    // One-time packs
    'nailit.tokens.1k': 1000,
    'nailit_tokens_1k': 1000,
    'nailit.tokens.5k': 5000,
    'nailit_tokens_5k': 5000,

    // Legacy product IDs (for backwards compatibility with existing data)
    'tokens.starter': 120,
    'tokens.plus': 250,
    'tokens.pro': 480,
    'tokens.power': 1000,
    'starter_monthly': 120,
    'plus_monthly': 250,
    'pro_monthly': 480,
    'power_monthly': 1000,
  }

  return tokenMap[productId] || 0
}

/**
 * Get plan tier from product ID
 */
export function planTierForProduct(productId: string): string {
  if (/starter/i.test(productId)) return 'starter'
  if (/plus/i.test(productId)) return 'plus'
  if (/pro/i.test(productId)) return 'pro'
  if (/power/i.test(productId)) return 'power'
  return 'free'
}

/**
 * Get all subscription product IDs for a platform
 */
export function getSubscriptionProducts(platform: 'ios' | 'android'): string[] {
  const products = IAP_PRODUCTS[platform]
  return [
    products.STARTER_MONTHLY,
    products.PLUS_MONTHLY,
    products.PRO_MONTHLY,
    products.POWER_MONTHLY,
  ]
}

/**
 * Get all consumable product IDs for a platform
 */
export function getConsumableProducts(platform: 'ios' | 'android'): string[] {
  const products = IAP_PRODUCTS[platform]
  return [
    products.TOKENS_1K,
    products.TOKENS_5K,
  ]
}
