# App Store Submission Guide

## Prerequisites Checklist

Before running submission commands:
- [ ] EAS CLI installed globally: `npm install -g @expo/eas-cli`
- [ ] Logged into Expo account: `eas login`
- [ ] App store credentials configured (see `01_CREDENTIALS.md`)
- [ ] Build profiles tested and validated
- [ ] Privacy policies and store listings prepared

## Android Submission (Google Play Store)

### Step 1: Build for Production
```bash
cd mobile-shell

# Build production APK/AAB
npm run build:android

# Or with explicit profile
eas build -p android --profile production
```

### Step 2: Internal Testing (Recommended First)
```bash
# Submit to Google Play Console
npm run submit:android

# Or with explicit credentials
eas submit -p android --latest --service-account-key-path="/path/to/service-account.json"
```

### Step 3: Google Play Console Configuration
1. **Go to Google Play Console**: https://play.google.com/console
2. **Select your app** (or create new app listing)
3. **Configure App Information**:
   - App name: "Mobile Shell" 
   - Short description: 50 characters max
   - Full description: 4000 characters max
   - App category: Choose appropriate category
   - Content rating: Complete questionnaire

4. **Upload Store Assets** (see `02_ASSETS_README.md`):
   - Feature graphic: 1024×500 pixels
   - Screenshots: Various device sizes
   - App icon: Auto-generated from APK

5. **Configure Release**:
   - **Internal Testing**: Add test user email addresses
   - **Release Track**: Start with "Internal testing"
   - **Countries**: Select target countries
   - **Review Settings**: Complete all required fields

### Step 4: Gradual Rollout
1. **Internal Testing** → Test with small group
2. **Closed Testing** → Expand to more testers  
3. **Open Testing** → Public beta (optional)
4. **Production** → Full public release

## iOS Submission (App Store)

### Step 1: Build for Production
```bash
cd mobile-shell

# Build production IPA
npm run build:ios

# Or with explicit profile
eas build -p ios --profile production
```

### Step 2: TestFlight Distribution (Recommended First)
```bash
# Submit to App Store Connect
npm run submit:ios

# Or with explicit credentials
eas submit -p ios --latest --asc-api-key-path="/path/to/AuthKey_XXXXXXXXXX.p8" --asc-api-key-id="YOUR_KEY_ID" --asc-api-issuer-id="YOUR_ISSUER_ID"
```

### Step 3: App Store Connect Configuration
1. **Go to App Store Connect**: https://appstoreconnect.apple.com
2. **Create App** (if not exists):
   - Bundle ID: `com.arun.mobileshell`
   - App name: "Mobile Shell"
   - Primary language: English
   - SKU: Unique identifier

3. **Configure App Information**:
   - **App Information**: Name, subtitle, category
   - **Pricing**: Free or paid tier
   - **Privacy Policy**: Required URL
   - **App Review Information**: Contact info, demo account

4. **Upload Metadata**:
   - **App Store Screenshots**: All required device sizes
   - **App Description**: Compelling marketing copy
   - **Keywords**: Relevant search terms
   - **Support URL**: Website with support info
   - **Marketing URL**: App website (optional)

5. **Configure Version Information**:
   - **Version Number**: 1.0.0
   - **Build**: Auto-populated from submission
   - **What's New**: Version release notes
   - **App Review Notes**: Special instructions for reviewers

### Step 4: TestFlight & Release
1. **TestFlight Testing**: 
   - Add internal testers (App Store Connect users)
   - Add external testers (up to 10,000)
   - Collect feedback and fix issues

2. **App Store Release**:
   - Submit for review when ready
   - Review typically takes 24-48 hours
   - Choose manual or automatic release

## Build Optimization Commands

### Preview Builds (Internal Testing)
```bash
# Android preview build
npm run build:android:preview
eas submit -p android --latest

# iOS preview build  
npm run build:ios:preview
eas submit -p ios --latest
```

### Local Development Builds
```bash
# Development build with dev client
eas build -p android --profile development --local
eas build -p ios --profile development
```

## Submission Environment Variables

### Create `.env.submission` (DO NOT commit)
```bash
# Android
GOOGLE_SERVICE_ACCOUNT_KEY="/path/to/play-console-service-account.json"

# iOS
ASC_KEY_ID="YOUR_APP_STORE_CONNECT_KEY_ID"
ASC_ISSUER_ID="YOUR_ISSUER_ID"
ASC_KEY_PATH="/path/to/AuthKey_XXXXXXXXXX.p8"

# Expo
EXPO_TOKEN="YOUR_EXPO_ACCESS_TOKEN"
```

## Store Listing Requirements

### Required Metadata (Both Stores)
- **App Name**: Mobile Shell
- **Short Description**: One-line app summary
- **Long Description**: Detailed feature list
- **Privacy Policy URL**: Required for both stores
- **Support Email**: Customer support contact
- **App Category**: Productivity, Business, Education, etc.

### Google Play Specific
- **Feature Graphic**: 1024×500 banner image
- **Data Safety Form**: Complete in Play Console
- **Content Rating**: Age-appropriate classification
- **Target Audience**: Age range selection

### Apple App Store Specific
- **App Subtitle**: Brief tagline (30 characters)
- **Promotional Text**: Marketing hook (170 characters)
- **Keywords**: Comma-separated search terms (100 characters)
- **App Preview Video**: Optional demo video

## Common Build Issues & Solutions

### Android Issues
```bash
# Gradle build fails
cd mobile-shell/android && ./gradlew clean

# Duplicate resources
# Check for conflicting dependencies

# Signing issues  
eas credentials -p android
```

### iOS Issues
```bash
# Provisioning profile issues
eas credentials -p ios

# Pod install failures
cd mobile-shell/ios && pod install --clean-install

# Archive upload fails
# Check bundle identifier matches App Store Connect
```

### General Issues
```bash
# Clear EAS cache
eas build --clear-cache

# Check project configuration
npm run doctor

# Validate before build
node tools/pack_release.js
```

## Submission Status Monitoring

### Check Build Status
```bash
# List recent builds
eas build:list

# Check specific build
eas build:view [BUILD_ID]
```

### Check Submission Status
- **Google Play**: Check Play Console for review status
- **Apple**: Check App Store Connect for review progress

## Post-Submission Checklist

### After Successful Submission:
- [ ] Monitor store review process
- [ ] Respond to reviewer feedback promptly
- [ ] Test final builds on physical devices
- [ ] Prepare marketing materials for launch
- [ ] Set up analytics and crash reporting monitoring
- [ ] Plan update release cycle

### If Rejected:
- [ ] Carefully read rejection reasons
- [ ] Address all mentioned issues
- [ ] Test fixes thoroughly
- [ ] Resubmit with detailed response to reviewers

## Emergency Commands

### Cancel Build
```bash
eas build:cancel [BUILD_ID]
```

### Resign Build (iOS)
```bash
eas build:resign
```

### Update Credentials
```bash
# Reset Android credentials
eas credentials -p android --clear

# Reset iOS credentials  
eas credentials -p ios --clear
```

---
**⚠️ Important**: Always test builds thoroughly before submitting to production stores. Start with internal testing tracks.