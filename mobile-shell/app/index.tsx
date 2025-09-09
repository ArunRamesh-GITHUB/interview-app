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

  return (
    <View style={styles.container}>
      {/* Demo Navigation Bar */}
      <View style={styles.demoNav}>
        <TouchableOpacity
          style={styles.demoNavButton}
          onPress={() => router.push('/live-interview')}
        >
          <Text style={styles.demoNavButtonText}>Demo</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.demoNavButton}
          onPress={() => router.push('/paywall')}
        >
          <Text style={styles.demoNavButtonText}>Paywall</Text>
        </TouchableOpacity>
      </View>

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