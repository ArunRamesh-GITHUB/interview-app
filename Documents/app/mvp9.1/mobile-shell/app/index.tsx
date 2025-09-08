import { useEffect } from "react";
import { Platform, PermissionsAndroid } from "react-native";
import { WebView } from "react-native-webview";

// 🔁 Use the SAME URL as above
const WEB_URL = "http://192.168.0.8:5173";

export default function Index() {
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
