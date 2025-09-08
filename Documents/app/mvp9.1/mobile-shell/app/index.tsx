import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, Alert, Platform, TouchableOpacity } from "react-native";
import { WebView } from "react-native-webview";
import { Audio } from "expo-av";
import { router } from "expo-router";

const WEB_URL = "https://interview-app-4ouh.onrender.com"; // your Render URL (HTTPS)

async function ensureMicPermission(): Promise<boolean> {
  // iOS: expo-av handles the prompt via getPermissionsAsync/requestPermissionsAsync
  // Android: we also rely on RECORD_AUDIO in manifest + WebView onPermissionRequest
  const { status: existing } = await Audio.getPermissionsAsync();
  if (existing === "granted") return true;
  const { status } = await Audio.requestPermissionsAsync();
  return status === "granted";
}

export default function Index() {
  const [ready, setReady] = useState(false);
  const [denied, setDenied] = useState(false);
  const webRef = useRef<WebView>(null);

  useEffect(() => {
    (async () => {
      const granted = await ensureMicPermission();
      if (granted) {
        setReady(true);
      } else {
        setDenied(true);
      }
    })();
  }, []);

  if (denied) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          Microphone permission is required for interviews.
        </Text>
        <Text style={styles.errorSubtext}>
          Please enable microphone access in Settings.
        </Text>
        
        {/* Demo Navigation Buttons */}
        <View style={{ marginTop: 30 }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' }}>
            Demo Screens:
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

  if (!ready) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
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
        onPermissionRequest={(request) => {
          if (Platform.OS === "android") {
            request.grant();
          }
        }}
        onLoadStart={() => console.log("WebView load start")}
        onLoadEnd={() => console.log("WebView load end")}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error("WebView error:", nativeEvent);
          Alert.alert("Error", "Failed to load the interview app");
        }}
        userAgent="Mozilla/5.0 (Mobile; React Native WebView)"
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