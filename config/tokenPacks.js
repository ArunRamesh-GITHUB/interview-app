// Shared token pack configuration for RevenueCat integration
// Used by server webhook, web frontend, and mobile app

export const TOKEN_PACKS = {
  starter: {
    productIdIOS: 'tokens.starter',
    productIdAndroid: 'starter_monthly',  // Updated to match Google Play Console
    productIdWeb: 'tokens_starter_web',
    tokens: 120
  },
  plus: {
    productIdIOS: 'tokens.plus',
    productIdAndroid: 'plus_monthly',  // Updated to match Google Play Console
    productIdWeb: 'tokens_plus_web',
    tokens: 250
  },
  pro: {
    productIdIOS: 'tokens.pro',
    productIdAndroid: 'pro_monthly',  // Updated to match Google Play Console
    productIdWeb: 'tokens_pro_web',
    tokens: 480
  },
  power: {
    productIdIOS: 'tokens.power',
    productIdAndroid: 'power_monthly',  // Updated to match Google Play Console
    productIdWeb: 'tokens_power_web',
    tokens: 1000
  },
}

// NOTE: Configure these product IDs in your RevenueCat dashboard
// and create a "current" offering with all 4 products
