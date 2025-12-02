import React, { useRef } from "react";
import { View, Text, StyleSheet, Alert, Platform, TouchableOpacity, Linking } from "react-native";
import { WebView } from "react-native-webview";
import { router } from "expo-router";
import { useAudioPermissions } from "../hooks/useAudioPermissions";

const WEB_URL = "https://interview-app-4ouh.onrender.com"; // your Render URL (HTTPS)

function openAppSettings(): void {
  if (Platform.OS === "android") {
    Linking.openSettings();
  } else {
    Linking.openURL("app-settings:");
  }
}

export default function Index() {
  const webRef = useRef<WebView>(null);
  const { granted, loading, error, requestPermission, resetAudioSession } = useAudioPermissions();
  const pendingTokenUpdate = useRef<{ tokens: number; attempts: number } | null>(null);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Setting up audio permissions...</Text>
      </View>
    );
  }

  if (granted === false) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          Microphone permission is required for interviews.
        </Text>
        <Text style={styles.errorSubtext}>
          Please enable microphone access in Settings and restart the app.
        </Text>
        {error && (
          <Text style={[styles.errorSubtext, { color: '#ff6b6b', marginTop: 10 }]}>
            {error}
          </Text>
        )}
        
        <TouchableOpacity
          style={[styles.demoButton, { marginTop: 20 }]}
          onPress={openAppSettings}
        >
          <Text style={styles.demoButtonText}>Open Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.demoButton, { backgroundColor: '#28a745' }]}
          onPress={requestPermission}
        >
          <Text style={styles.demoButtonText}>Try Again</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.demoButton, { backgroundColor: '#ff6b35' }]}
          onPress={resetAudioSession}
        >
          <Text style={styles.demoButtonText}>Reset Audio</Text>
        </TouchableOpacity>
        
        {/* Demo Navigation Buttons */}
        <View style={{ marginTop: 30 }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10, textAlign: 'center', color: '#fff' }}>
            Demo Screens (No Audio):
          </Text>
          <TouchableOpacity
            style={styles.demoButton}
            onPress={() => router.push('/live-interview')}
          >
            <Text style={styles.demoButtonText}>Live Interview Demo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.demoButton}
            onPress={() => router.push('/paywall')}
          >
            <Text style={styles.demoButtonText}>Paywall Demo</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Helper function to inject token update script
  const injectTokenUpdate = (tokenAmount: number) => {
    if (!webRef.current) return;
    
    console.log(`💰💰💰 Injecting token update script: +${tokenAmount} tokens`);
    webRef.current.injectJavaScript(`
      (function() {
        try {
          // Send confirmation message back to React Native
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'TOKEN_UPDATE_SCRIPT_EXECUTED',
              tokens: ${tokenAmount},
              timestamp: Date.now()
            }));
          }
          
          console.log('💰💰💰 WEBVIEW: Token update script executing!');
          console.log('💰💰💰 WEBVIEW: Adding ${tokenAmount} tokens');
          
          let updateSuccess = false;
          
          // Method 1: Try both update functions (TokenProvider and useTokenBalance)
          let functionFound = false;
          
          if (typeof window.__TOKEN_PROVIDER_UPDATE__ === 'function') {
            console.log('✅✅✅ WEBVIEW: Calling __TOKEN_PROVIDER_UPDATE__(${tokenAmount})');
            try {
              window.__TOKEN_PROVIDER_UPDATE__(${tokenAmount});
              updateSuccess = true;
              functionFound = true;
            } catch(e) {
              console.error('❌ WEBVIEW: Error calling __TOKEN_PROVIDER_UPDATE__:', e);
            }
          }
          
          if (typeof window.__TOKEN_BALANCE_UPDATE__ === 'function') {
            console.log('✅✅✅ WEBVIEW: Calling __TOKEN_BALANCE_UPDATE__(${tokenAmount})');
            try {
              window.__TOKEN_BALANCE_UPDATE__(${tokenAmount});
              updateSuccess = true;
              functionFound = true;
            } catch(e) {
              console.error('❌ WEBVIEW: Error calling __TOKEN_BALANCE_UPDATE__:', e);
            }
          }
          
          if (updateSuccess && window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'TOKEN_UPDATE_SUCCESS',
              tokens: ${tokenAmount},
              method: 'direct_function_call'
            }));
          }
          
          if (!functionFound) {
            console.warn('⚠️⚠️⚠️ WEBVIEW: Neither __TOKEN_PROVIDER_UPDATE__ nor __TOKEN_BALANCE_UPDATE__ found!');
            // Aggressive retry - functions might not be ready yet
            let retryCount = 0;
            const maxRetries = 10;
            const retryInterval = setInterval(() => {
              retryCount++;
              let found = false;
              
              if (typeof window.__TOKEN_PROVIDER_UPDATE__ === 'function') {
                console.log('✅✅✅ WEBVIEW: Retry ' + retryCount + ' - calling __TOKEN_PROVIDER_UPDATE__(${tokenAmount})');
                try {
                  window.__TOKEN_PROVIDER_UPDATE__(${tokenAmount});
                  updateSuccess = true;
                  found = true;
                } catch(e) {
                  console.error('❌ WEBVIEW: Error in retry:', e);
                }
              }
              
              if (typeof window.__TOKEN_BALANCE_UPDATE__ === 'function') {
                console.log('✅✅✅ WEBVIEW: Retry ' + retryCount + ' - calling __TOKEN_BALANCE_UPDATE__(${tokenAmount})');
                try {
                  window.__TOKEN_BALANCE_UPDATE__(${tokenAmount});
                  updateSuccess = true;
                  found = true;
                } catch(e) {
                  console.error('❌ WEBVIEW: Error in retry:', e);
                }
              }
              
              if (found && window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'TOKEN_UPDATE_SUCCESS',
                  tokens: ${tokenAmount},
                  method: 'retry_' + retryCount
                }));
                clearInterval(retryInterval);
              } else if (retryCount >= maxRetries) {
                console.warn('⚠️ WEBVIEW: Max retries reached, functions still not available');
                clearInterval(retryInterval);
              }
            }, 200); // Retry every 200ms
          }
          
          // Method 2: Dispatch custom event (ALWAYS DO THIS)
          try {
            const event = new CustomEvent('purchaseCompleted', { 
              detail: { tokens: ${tokenAmount}, isTestProduct: true }
            });
            window.dispatchEvent(event);
            console.log('✅ WEBVIEW: Dispatched purchaseCompleted event');
          } catch(e) {
            console.error('❌ WEBVIEW: Error dispatching event:', e);
          }
          
          // Method 3: Trigger localStorage update (ALWAYS DO THIS - polling will catch it)
          try {
            const purchaseData = { tokens: ${tokenAmount}, timestamp: Date.now() };
            localStorage.setItem('purchase_tokens', JSON.stringify(purchaseData));
            console.log('✅ WEBVIEW: Set localStorage purchase_tokens');
            
            // Manually trigger storage event
            window.dispatchEvent(new StorageEvent('storage', { 
              key: 'purchase_tokens', 
              newValue: JSON.stringify(purchaseData),
              oldValue: null
            }));
            console.log('✅ WEBVIEW: Dispatched storage event');
          } catch(e) {
            console.error('❌ WEBVIEW: Error with localStorage:', e);
          }
          
          // Method 4: Force refresh token balance by calling refresh function if available
          if (window.__REFRESH_TOKENS__) {
            console.log('✅ WEBVIEW: Calling __REFRESH_TOKENS__');
            try {
              window.__REFRESH_TOKENS__();
            } catch(e) {
              console.error('❌ WEBVIEW: Error calling refresh:', e);
            }
          }
          
          console.log('✅✅✅ WEBVIEW: Token update script completed! Success:', updateSuccess);
        } catch(e) {
          console.error('❌❌❌ WEBVIEW: Error in token update script:', e);
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'TOKEN_UPDATE_ERROR',
              error: e.message || String(e)
            }));
          }
        }
      })();
      true;
    `);
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webRef}
        source={{ uri: WEB_URL }}
        style={{ flex: 1 }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowsFullscreenVideo={false}
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback={true}
        onPermissionRequest={(request) => {
          console.log("WebView permission request:", request);
          if (Platform.OS === "android") {
            // Grant all permissions - we've already handled mic permissions at the native level
            if (request.origin === WEB_URL || request.origin.includes('onrender.com')) {
              request.grant();
            } else {
              request.deny();
            }
          }
        }}
        onLoadStart={() => {
          console.log("WebView load start");
          // Reset audio session when loading starts
          resetAudioSession();
        }}
        onLoadEnd={() => {
          console.log("WebView load end");
          // Inject JavaScript to help with audio debugging
          webRef.current?.postMessage(JSON.stringify({
            type: 'NATIVE_AUDIO_READY',
            permissions: 'granted'
          }));
          
          // If there's a pending token update, inject it now that WebView is ready
          if (pendingTokenUpdate.current && webRef.current) {
            const { tokens, attempts } = pendingTokenUpdate.current;
            if (attempts < 5) { // Retry up to 5 times
              console.log(`💰💰💰 WebView loaded - injecting token update (attempt ${attempts + 1}): +${tokens} tokens`);
              injectTokenUpdate(tokens);
              pendingTokenUpdate.current.attempts += 1;
            } else {
              console.warn('⚠️ Max attempts reached for token update');
              pendingTokenUpdate.current = null;
            }
          }
        }}
        onNavigationStateChange={(navState) => {
          // Check if we're returning from paywall
          if (navState.url === WEB_URL && webRef.current) {
            // Send refresh message to web app
            webRef.current.postMessage(JSON.stringify({
              type: 'PURCHASE_COMPLETED',
              timestamp: Date.now()
            }));
          }
        }}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error("WebView error:", nativeEvent);
          Alert.alert("Error", "Failed to load the interview app. Please check your internet connection.");
        }}
        onMessage={(event) => {
          try {
            const message = JSON.parse(event.nativeEvent.data);
            console.log("Message from WebView:", message);

            // Handle purchase messages from web app
            if (message.type === 'REQUEST_PURCHASE') {
              console.log("Web app requesting purchase:", message.productId);
              
              // Import purchase service and product ID converter
              Promise.all([
                import('../src/lib/purchaseService'),
                import('../src/config/purchases')
              ]).then(([{ purchaseService }, { convertWebProductIdToNative }]) => {
                // Convert web product ID to platform-specific product ID
                const nativeProductId = convertWebProductIdToNative(message.productId);
                console.log(`🔄 Converting ${message.productId} → ${nativeProductId} for ${Platform.OS}`);
                
                // Try to get userId from WebView message
                let userId = message.userId || undefined;
                
                // Log the full message to debug
                console.log('📨 Full purchase message:', JSON.stringify(message));
                console.log('👤 Extracted userId from message:', userId || 'none');
                
                // For test products, userId is optional - server will use first available account
                // Initialize and directly trigger native purchase sheet
                purchaseService.initialize(userId).then(() => {
                  console.log('✅ IAP initialized, triggering purchase for:', nativeProductId);
                  if (userId) {
                    console.log('👤 User ID:', userId);
                  } else {
                    console.log('ℹ️ No userId - server will use test account for test products');
                  }
                  // This will show the native Apple/Android purchase sheet
                  return purchaseService.purchasePackage(nativeProductId);
                }).then(async (result) => {
                  console.log('✅ Purchase successful:', result);
                  
                  // Get token amount for this product
                  const { getTokenAmountFromProduct } = await import('../src/lib/purchaseService');
                  const tokenAmount = getTokenAmountFromProduct(result.productIdentifier);
                  const isTestProduct = result.productIdentifier.startsWith('com.yourname.test.');
                  
                  // Notify web view of success with token amount
                  const purchaseMessage = {
                    type: 'PURCHASE_COMPLETED',
                    productId: message.productId,
                    transactionId: result.transactionId,
                    success: true,
                    tokens: tokenAmount,
                    isTestProduct: isTestProduct
                  };
                  
                  // Send via postMessage
                  webRef.current?.postMessage(JSON.stringify(purchaseMessage));
                  
                  // Also inject JavaScript to directly update token balance (for test products)
                  if (isTestProduct) {
                    // Store pending update - will be injected when WebView finishes loading
                    pendingTokenUpdate.current = { tokens: tokenAmount, attempts: 0 };
                    console.log(`💰💰💰 Stored pending token update: +${tokenAmount} tokens`);
                    
                    // Try immediate injection (in case WebView is already loaded)
                    setTimeout(() => {
                      if (webRef.current) {
                        injectTokenUpdate(tokenAmount);
                      }
                    }, 1000); // Wait 1 second for purchase sheet to close
                  }
                  
                  console.log(`💰 Purchase complete: ${tokenAmount} tokens (test: ${isTestProduct})`);
                }).catch((error) => {
                  console.error('❌ Purchase failed:', error);
                  // Only notify if not user cancellation
                  if (error.message !== 'Purchase cancelled by user') {
                    webRef.current?.postMessage(JSON.stringify({
                      type: 'PURCHASE_FAILED',
                  productId: message.productId,
                      error: error.message
                    }));
                }
                });
              }).catch((importError) => {
                console.error('Failed to import purchase modules:', importError);
              });
              return;
            }

            // Handle token update confirmation messages from WebView
            if (message.type === 'TOKEN_UPDATE_SCRIPT_EXECUTED') {
              console.log(`✅✅✅ WebView confirmed: Token update script executed! +${message.tokens} tokens`);
            } else if (message.type === 'TOKEN_UPDATE_SUCCESS') {
              console.log(`🎉🎉🎉 TOKEN UPDATE SUCCESS via ${message.method}! +${message.tokens} tokens`);
              // Clear pending update on success
              if (pendingTokenUpdate.current) {
                pendingTokenUpdate.current = null;
              }
            } else if (message.type === 'TOKEN_UPDATE_ERROR') {
              console.error(`❌❌❌ Token update error from WebView:`, message.error);
            }
            
            // Handle audio-related messages from the web app
            if (message.type === 'AUDIO_ERROR') {
              console.error("Audio error from web:", message.error);
              // Reset audio session
              resetAudioSession();
            } else if (message.type === 'REQUEST_MIC_PERMISSION') {
              console.log("Web app requesting mic permission");
              requestPermission();
            }
          } catch (error) {
            console.log("Non-JSON message from WebView:", event.nativeEvent.data);
          }
        }}
        userAgent="Mozilla/5.0 (Mobile; React Native WebView) NailIT/1.0.0"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#16181D",
  },
  demoNav: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingTop: Platform.OS === 'ios' ? 44 : 8,
  },
  demoNavButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 8,
  },
  demoNavButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#16181D",
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 18,
    color: "#fff",
    textAlign: "center",
    marginBottom: 10,
  },
  errorSubtext: {
    fontSize: 14,
    color: "#aaa",
    textAlign: "center",
  },
  demoButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 10,
    minWidth: 200,
    alignItems: 'center',
  },
  demoButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#16181D",
  },
  loadingText: {
    fontSize: 18,
    color: "#fff",
  },
});