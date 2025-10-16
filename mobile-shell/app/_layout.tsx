import { useEffect } from 'react';
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';

function useRevenueCatInit() {
  useEffect(() => {
    const apiKey =
      Platform.OS === 'android'
        ? process.env.EXPO_PUBLIC_RC_ANDROID_SDK_KEY
        : process.env.EXPO_PUBLIC_RC_IOS_SDK_KEY;

    if (!apiKey) {
      console.error('❌ RevenueCat API key not found for platform:', Platform.OS);
      return;
    }

    if (__DEV__) {
      Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
    }

    Purchases.configure({
      apiKey: apiKey,
      entitlementVerificationMode:
        Purchases.ENTITLEMENT_VERIFICATION_MODE.INFORMATIONAL,
    });

    console.log('✅ RevenueCat initialized with key:', apiKey.substring(0, 8) + '...');
  }, []);
}

export default function RootLayout() {
  useRevenueCatInit();

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
        <Stack.Screen name="debug-purchases" options={{ presentation: 'modal' }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}