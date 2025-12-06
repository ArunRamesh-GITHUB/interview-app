# Ready to Build - Quick Start Guide

## ✅ What's Already Done

- [x] Production IAP product IDs configured (`USE_TEST_IAP = false`)
- [x] iOS bundle identifier: `com.nailit.interview`
- [x] Android package name: `com.nailit.interview`
- [x] App connects to production server automatically

## ⏳ Waiting For

- [ ] Client to upgrade your Apple Developer role from "App Manager" to "Developer" or "Admin"

## 🚀 Once Role is Upgraded - Quick Commands

### 1. Install EAS CLI (if not already)
```bash
npm install -g eas-cli
```

### 2. Login to Expo
```bash
eas login
# Create account at https://expo.dev if needed
```

### 3. Set Up iOS Credentials
```bash
cd mobile-shell
eas credentials -p ios
# Select: "Build credentials (iOS Distribution Certificate, Provisioning Profile)"
# Choose: "Generate new credentials"
# Sign in with your Apple ID (the one with upgraded role)
```

### 4. Set Up Android Credentials
```bash
eas credentials -p android
# Select: "Build credentials (Android Keystore)"
# Choose: "Generate new credentials"
```

### 5. Build iOS for TestFlight
```bash
npm run build:ios
# Or: eas build -p ios --profile production
# Takes 10-20 minutes
```

### 6. Build Android for Google Play
```bash
npm run build:android
# Or: eas build -p android --profile production
# Takes 10-20 minutes
```

### 7. Submit to TestFlight
```bash
npm run submit:ios
# Or: eas submit -p ios --latest
```

### 8. Submit to Google Play
```bash
npm run submit:android
# Or: eas submit -p android --latest
```

## 📋 Check Build Status

```bash
# List all builds
eas build:list

# View specific build
eas build:view [BUILD_ID]
```

## 🔗 After Submission

### TestFlight Link
1. Go to App Store Connect → TestFlight
2. Wait for processing (10-30 min)
3. Copy external tester link: `https://testflight.apple.com/join/[CODE]`

### Google Play Link
1. Go to Google Play Console → Internal testing
2. Copy testing link: `https://play.google.com/apps/internaltest/[ID]`

## ⚠️ If You Get Errors

### "Access denied" or "No team found"
- Make sure you accepted the Apple Developer invitation
- Verify role is "Developer" or "Admin" (not "App Manager")
- Try: `eas credentials -p ios` again

### "Bundle ID not found"
- Ask client if app exists in App Store Connect
- Or create it: App Store Connect → My Apps → + New App

### "Package name not found"
- Ask client if app exists in Google Play Console
- Or create it: Google Play Console → Create app

## 📝 What to Send Client After Builds

> Hi [Client],
> 
> Builds are ready! Here are the testing links:
> 
> **TestFlight:** https://testflight.apple.com/join/[CODE]
> **Google Play:** https://play.google.com/apps/internaltest/[ID]
> 
> You can share these links with testers.

---

**Everything is ready! Just waiting for role upgrade, then we can build! 🎉**

