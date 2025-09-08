import { useEffect } from "react";
import { Platform, PermissionsAndroid } from "react-native";
import { WebView } from "react-native-webview";

const WEB_URL = "https://spicy-jokes-know.loca.lt"; // ⬅️ paste your HTTPS URL

export default function RootLayout() {
  useEffect(() => {
    const ask = async () => {
      if (Platform.OS === "android") {
        try {
          await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
          );
        } catch {}
      }
    };
    ask();
  }, []);

  return (
    <WebView
      source={{ uri: WEB_URL }}
      javaScriptEnabled
      domStorageEnabled
      allowsInlineMediaPlayback
      mediaPlaybackRequiresUserAction={false}
      onPermissionRequest={(e: any) => {
        e.grant?.();
      }}
    />
  );
}
