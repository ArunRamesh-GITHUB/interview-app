import { Audio } from "expo-av";
import { Platform, PermissionsAndroid } from "react-native";

export async function ensureMicPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    // Check if permission is already granted
    const hasPermission = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
    );
    
    if (hasPermission) {
      return true;
    }
    
    // Request permission
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      {
        title: "Microphone Permission",
        message: "This app needs access to your microphone to record audio for interview practice sessions.",
        buttonNeutral: "Ask Me Later",
        buttonNegative: "Cancel",
        buttonPositive: "OK",
      }
    );
    
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }
  
  if (Platform.OS === 'ios') {
    // For iOS, use expo-av permissions
    const { status: existing } = await Audio.getPermissionsAsync();
    if (existing === "granted") return true;
    
    const { status } = await Audio.requestPermissionsAsync();
    return status === "granted";
  }
  
  // Web/other platforms - assume granted
  return true;
}

export async function setupAudioMode(): Promise<void> {
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      staysActiveInBackground: false,
      interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
      playsInSilentModeIOS: true,
    });
  } catch (error) {
    console.warn("Failed to setup audio mode:", error);
  }
}

export async function initializeAudioPermissions(): Promise<boolean> {
  try {
    const hasPermission = await ensureMicPermission();
    if (hasPermission) {
      await setupAudioMode();
      return true;
    }
    return false;
  } catch (error) {
    console.error("Failed to initialize audio permissions:", error);
    return false;
  }
}