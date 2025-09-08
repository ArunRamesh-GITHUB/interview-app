import { useEffect } from "react";
import { Platform, PermissionsAndroid } from "react-native";
import { WebView } from "react-native-webview";

// 🔁 Set this ONCE to your public HTTPS URL (Cloudflare Tunnel or Vercel/Netlify)
const WEB_URL = "https://YOUR_PUBLIC_HTTPS_URL_HERE";

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
        // Auto-grant mic/cam inside WebView (Android)
        e.grant?.();
      }}
    />
  );
}
