import { useEffect } from "react";
import { Platform, PermissionsAndroid } from "react-native";
import { WebView } from "react-native-webview";

// ✅ Your tunnel URL
const WEB_URL = "https://silk-notebooks-moisture-roman.trycloudflare.com";

export default function Index() {
  console.log("Loaded WebView root ->", WEB_URL);

  // Ask Android for mic permission once
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
        e.grant?.(); // auto-grant mic/cam inside WebView (Android)
      }}
    />
  );
}
