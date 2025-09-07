import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, Alert, Platform } from "react-native";
import { WebView } from "react-native-webview";
import { Audio } from "expo-av";

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
      try {
        const ok = await ensureMicPermission();
        if (!ok) {
          setDenied(true);
        }
      } finally {
        setReady(true);
      }
    })();
  }, []);

  if (!ready) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Preparing audio permissions…</Text>
      </View>
    );
  }

  if (denied) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Microphone permission is required.</Text>
        <Text style={styles.sub}>Enable it in Settings → Apps → Mobile Shell → Permissions.</Text>
      </View>
    );
  }

  return (
    <WebView
      ref={webRef}
      source={{ uri: WEB_URL }}
      javaScriptEnabled
      domStorageEnabled
      allowsInlineMediaPlayback
      mediaPlaybackRequiresUserAction={false}
      // ✅ Critical for Android WebView getUserMedia
      onPermissionRequest={(event: any) => {
        try {
          // Grant mic/camera requests from the page
          if (event?.resources?.length) event.grant(event.resources);
          else event.grant?.(); // older RNW versions
        } catch (e) {
          console.warn("onPermissionRequest error:", e);
        }
      }}
      onHttpError={(e) => console.warn("WebView HTTP error:", e.nativeEvent.statusCode, e.nativeEvent.description)}
      onError={(e) => console.warn("WebView error:", e.nativeEvent)}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#16181D", alignItems: "center", justifyContent: "center" },
  text: { color: "white", fontSize: 16, marginBottom: 6 },
  sub: { color: "#bfbfbf", fontSize: 12, textAlign: "center", paddingHorizontal: 16 },
});