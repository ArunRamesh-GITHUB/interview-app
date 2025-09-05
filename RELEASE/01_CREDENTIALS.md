# App Signing & Credentials Setup

## Overview
This document outlines the credential setup required for app store submissions. **DO NOT commit any secrets to the repository.**

## Android - Google Play Store

### 1. Play Console Service Account
Required for automated Android app submissions via `eas submit`.

**Steps:**
1. Go to [Google Play Console](https://play.google.com/console)
2. Navigate to Setup → API access
3. Create a new service account or use existing one
4. Download the service account JSON file
5. Store the JSON file securely (DO NOT commit to repo)

**Environment Variables:**
```bash
# Set this to the path of your service account JSON file
export GOOGLE_SERVICE_ACCOUNT_KEY="/path/to/service-account.json"
```

**EAS Submit Command:**
```bash
# Using service account file
eas submit -p android --latest --service-account-key-path="/path/to/service-account.json"

# Or using environment variable
eas submit -p android --latest
```

### 2. App Signing Key
EAS handles app signing automatically. Your first upload will generate the signing key.

**Note:** Google Play App Signing is recommended and will be enabled automatically.

## iOS - App Store Connect

### 1. App Store Connect API Key
Required for automated iOS app submissions via `eas submit`.

**Steps:**
1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Navigate to Users and Access → Integrations → App Store Connect API
3. Create a new API key with "Developer" role or higher
4. Download the .p8 file
5. Note the Key ID and Issuer ID

**Environment Variables:**
```bash
# App Store Connect API credentials
export ASC_KEY_ID="YOUR_KEY_ID"
export ASC_ISSUER_ID="YOUR_ISSUER_ID" 
export ASC_KEY_PATH="/path/to/AuthKey_XXXXXXXXXX.p8"
```

**EAS Submit Command:**
```bash
# Using API key
eas submit -p ios --latest --asc-api-key-path="/path/to/AuthKey_XXXXXXXXXX.p8" --asc-api-key-id="YOUR_KEY_ID" --asc-api-issuer-id="YOUR_ISSUER_ID"

# Or using environment variables
eas submit -p ios --latest
```

### 2. Distribution Certificate & Provisioning Profile
EAS handles iOS code signing automatically via managed credentials.

**First-time setup:**
```bash
# Configure iOS credentials
eas credentials -p ios

# Select "Build credentials (iOS Distribution Certificate, Provisioning Profile)"
# Choose "Generate new credentials" for first setup
```

## EAS Credentials Management

### View Current Credentials
```bash
# List all credentials
eas credentials

# Platform-specific
eas credentials -p android
eas credentials -p ios
```

### Environment Setup
Create a `.env.local` file (DO NOT commit) with:
```bash
# Android
GOOGLE_SERVICE_ACCOUNT_KEY="/path/to/service-account.json"

# iOS  
ASC_KEY_ID="YOUR_KEY_ID"
ASC_ISSUER_ID="YOUR_ISSUER_ID"
ASC_KEY_PATH="/path/to/AuthKey_XXXXXXXXXX.p8"

# Expo
EXPO_TOKEN="YOUR_EXPO_ACCESS_TOKEN"
```

## Security Checklist
- [ ] Service account JSON stored securely outside repository
- [ ] .p8 file stored securely outside repository  
- [ ] Environment variables configured locally
- [ ] `.env.local` added to `.gitignore`
- [ ] Team members have separate credential access
- [ ] API keys have minimal required permissions

## Troubleshooting

### Android Issues
- **Authentication failed**: Verify service account JSON path and permissions
- **App not found**: Ensure app exists in Play Console with matching package name
- **Version conflict**: Check existing APK versions in Play Console

### iOS Issues  
- **Invalid API key**: Verify Key ID, Issuer ID, and .p8 file path
- **Bundle ID mismatch**: Ensure bundle identifier matches App Store Connect
- **Certificate expired**: Run `eas credentials -p ios` to refresh

## Next Steps
1. Set up Google Play Console service account
2. Create App Store Connect API key  
3. Configure local environment variables
4. Test credentials with dry-run submissions
5. Document team access and rotation procedures

---
*Never commit secrets. Always use environment variables or secure file paths.*