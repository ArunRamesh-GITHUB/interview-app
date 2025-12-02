// Mobile bridge utilities for WebView communication

// Check if we're running in a mobile WebView
export function isMobileApp() {
  return /NailIT/i.test(navigator.userAgent) || window.ReactNativeWebView;
}

// Send message to React Native WebView
export function sendToMobile(message) {
  if (window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(JSON.stringify(message));
    return true;
  }
  return false;
}

// Request native purchase flow
export function requestNativePurchase(productId, userId = null) {
  if (isMobileApp()) {
    const message = {
      type: 'REQUEST_PURCHASE',
      productId: productId,
      userId: userId, // Include user ID so tokens can be granted
      timestamp: Date.now()
    };
    console.log('📱 Sending purchase request to mobile:', JSON.stringify(message, null, 2));
    if (!userId) {
      console.warn('⚠️ WARNING: No userId in purchase request! User might not be logged in.');
    }
    return sendToMobile(message);
  }
  return false;
}

// Notify mobile app of successful purchase
export function notifyPurchaseSuccess(productId, tokens) {
  if (isMobileApp()) {
    return sendToMobile({
      type: 'PURCHASE_SUCCESS',
      productId: productId,
      tokens: tokens,
      timestamp: Date.now()
    });
  }
  return false;
}

// Request mic permissions from native
export function requestMicPermission() {
  if (isMobileApp()) {
    return sendToMobile({
      type: 'REQUEST_MIC_PERMISSION',
      timestamp: Date.now()
    });
  }
  return false;
}