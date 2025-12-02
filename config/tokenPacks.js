// Shared token pack configuration for RevenueCat integration
// Used by server webhook, web frontend, and mobile app

export const TOKEN_PACKS = {
  starter: { 
    productIdIOS: 'com.nailit.pack.starter', 
    productIdAndroid: 'pack_starter_120', 
    productIdWeb: 'tokens_starter_web',
    tokens: 120 
  },
  plus: { 
    productIdIOS: 'com.nailit.pack.plus', 
    productIdAndroid: 'pack_plus_250', 
    productIdWeb: 'tokens_plus_web', 
    tokens: 250 
  },
  pro: { 
    productIdIOS: 'com.nailit.pack.pro', 
    productIdAndroid: 'pack_pro_480', 
    productIdWeb: 'tokens_pro_web', 
    tokens: 480 
  },
  power: { 
    productIdIOS: 'com.nailit.pack.power', 
    productIdAndroid: 'pack_power_1000', 
    productIdWeb: 'tokens_power_web', 
    tokens: 1000 
  },
}

// NOTE: Configure these product IDs in your RevenueCat dashboard 
// and create a "current" offering with all 4 products

