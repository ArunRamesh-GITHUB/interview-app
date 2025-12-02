import { useEffect, useRef, useState } from "react";
import { Audio } from "expo-av";
import { Platform, AppState, AppStateStatus } from "react-native";

interface AudioPermissionsHook {
  granted: boolean | null;
  loading: boolean;
  error: string | null;
  requestPermission: () => Promise<boolean>;
  resetAudioSession: () => Promise<void>;
}

export function useAudioPermissions(): AudioPermissionsHook {
  const [granted, setGranted] = useState<boolean | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const isConfigured = useRef<boolean>(false);

  const configureAudioMode = async (): Promise<void> => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        // interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX, // Commented out - invalid value in this expo-av version
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
      });
      isConfigured.current = true;
      console.log("✅ Audio mode configured for recording");
    } catch (error) {
      console.error("❌ Error configuring audio mode:", error);
      setError(`Failed to configure audio: ${error}`);
    }
  };

  const resetAudioMode = async (): Promise<void> => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        // interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DUCK_OTHERS, // Commented out - invalid value in this expo-av version
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
      });
      isConfigured.current = false;
      console.log("✅ Audio mode reset");
    } catch (error) {
      console.error("❌ Error resetting audio mode:", error);
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      // Check current permission status
      const { status: existing } = await Audio.getPermissionsAsync();
      console.log("Current audio permission status:", existing);
      
      if (existing === "granted") {
        await configureAudioMode();
        setGranted(true);
        return true;
      }

      // Request permission
      console.log("Requesting audio permission...");
      const { status } = await Audio.requestPermissionsAsync();
      console.log("Permission request result:", status);

      if (status === "granted") {
        await configureAudioMode();
        setGranted(true);
        return true;
      } else {
        setGranted(false);
        setError("Microphone permission was denied");
        return false;
      }
    } catch (error) {
      console.error("❌ Error requesting microphone permission:", error);
      setGranted(false);
      setError(`Permission error: ${error}`);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const resetAudioSession = async (): Promise<void> => {
    console.log("🔄 Resetting audio session...");
    await resetAudioMode();
    // Wait a bit before reconfiguring
    await new Promise(resolve => setTimeout(resolve, 300));
    if (granted) {
      await configureAudioMode();
    }
  };

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      console.log("App state changed to:", nextAppState);
      
      if (nextAppState === 'active' && granted && !isConfigured.current) {
        console.log("🔄 Reconfiguring audio on app resume");
        await configureAudioMode();
      } else if (nextAppState === 'background' || nextAppState === 'inactive') {
        console.log("🔄 Resetting audio on app background");
        await resetAudioMode();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [granted]);

  // Initial permission check
  useEffect(() => {
    requestPermission();
    
    // Cleanup on unmount
    return () => {
      resetAudioMode();
    };
  }, []);

  return {
    granted,
    loading,
    error,
    requestPermission,
    resetAudioSession,
  };
}