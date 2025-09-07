import { useEffect, useState } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import { WebView } from "react-native-webview";
import { initializeAudioPermissions } from "../utils/permissions";

// Use production HTTPS URL - Android requires HTTPS
// Replace with your actual Render URL: https://interview-app-xxxxx.onrender.com
const WEB_URL = __DEV__ 
  ? "https://interview-app-4ouh.onrender.com" // For development, use production URL
  : "https://interview-app-4ouh.onrender.com"; // Production URL

export default function Index() {
  const [permissionsReady, setPermissionsReady] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  useEffect(() => {
    const setupPermissions = async () => {
      try {
        const success = await initializeAudioPermissions();
        if (success) {
          setPermissionsReady(true);
        } else {
          setPermissionError("Microphone permission is required for audio recording");
          Alert.alert(
            "Permission Required",
            "Microphone access is needed for interview recording. Please enable it in your device settings.",
            [
              {
                text: "Retry",
                onPress: () => {
                  setPermissionError(null);
                  setupPermissions();
                },
              },
              {
                text: "Continue Without Audio",
                onPress: () => setPermissionsReady(true),
              },
            ]
          );
        }
      } catch (error) {
        console.error("Failed to setup permissions:", error);
        setPermissionError("Failed to setup audio permissions");
        setPermissionsReady(true); // Continue anyway
      }
    };

    setupPermissions();
  }, []);

  if (!permissionsReady && !permissionError) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Setting up audio permissions...</Text>
      </View>
    );
  }

  return (
    <WebView
      source={{ uri: WEB_URL }}
      javaScriptEnabled
      domStorageEnabled
      allowsInlineMediaPlayback
      mediaPlaybackRequiresUserAction={false}
      onPermissionRequest={(request: any) => {
        // Auto-grant all media permissions (mic, camera)
        if (request.resources && request.resources.length > 0) {
          request.grant(request.resources);
        }
      }}
      onError={(syntheticEvent) => {
        const { nativeEvent } = syntheticEvent;
        console.warn('WebView error: ', nativeEvent);
      }}
      onHttpError={(syntheticEvent) => {
        const { nativeEvent } = syntheticEvent;
        console.warn('WebView HTTP error: ', nativeEvent);
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#16181D',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
  },
});
