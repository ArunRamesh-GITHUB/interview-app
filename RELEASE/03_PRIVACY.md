# Privacy Settings & Compliance

## iOS Privacy Configuration

### Info.plist Usage Descriptions (✅ Configured)
The following usage descriptions are already configured in `mobile-shell/app.json`:

```json
"infoPlist": {
  "NSMicrophoneUsageDescription": "This app uses the microphone to record audio for interview practice sessions."
}
```

### Additional Privacy Descriptions (Add if needed)
If your app uses additional features, add these to the `infoPlist` section:

```json
"infoPlist": {
  "NSMicrophoneUsageDescription": "This app uses the microphone to record audio for interview practice sessions.",
  "NSCameraUsageDescription": "This app uses the camera to record video for interview practice sessions.",
  "NSPhotoLibraryUsageDescription": "This app accesses your photo library to allow you to select images for your profile.",
  "NSContactsUsageDescription": "This app accesses your contacts to help you connect with interviewers.",
  "NSLocationWhenInUseUsageDescription": "This app uses your location to find nearby interview opportunities.",
  "NSCalendarsUsageDescription": "This app accesses your calendar to schedule interview sessions.",
  "NSUserTrackingUsageDescription": "This app uses tracking to provide personalized ads and improve your experience."
}
```

**Current Status**: Only microphone permission is configured since app.json declares `RECORD_AUDIO` permission.

### iOS Privacy Manifest (iOS 17+ / Xcode 15+)
**Status**: ⚠️ Not yet created

Create `mobile-shell/ios/PrivacyInfo.xcprivacy` if your app:
- Collects data used for tracking
- Links data to user identity  
- Uses specific API categories that require disclosure

**Template Privacy Manifest**:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>NSPrivacyCollectedDataTypes</key>
    <array>
        <!-- Add data collection types here -->
    </array>
    <key>NSPrivacyTrackingDomains</key>
    <array>
        <!-- Add tracking domains here -->
    </array>
    <key>NSPrivacyAccessedAPITypes</key>
    <array>
        <!-- Add accessed API types here -->
    </array>
</dict>
</plist>
```

## Android Privacy Configuration  

### Permissions (✅ Configured)
Current permissions in `mobile-shell/app.json`:
```json
"android": {
  "permissions": [
    "INTERNET",      // ✅ Safe - required for web connectivity
    "RECORD_AUDIO"   // ⚠️  Sensitive - requires justification
  ]
}
```

### Permission Optimization
Consider removing unused permissions:
- If app doesn't actually record audio, remove `RECORD_AUDIO`
- Keep `INTERNET` as it's required for web functionality

### Android Data Safety (Google Play)
**Status**: ⚠️ Requires manual completion in Play Console

Required disclosures based on detected features:
- **Data Collection**: Does your app collect user data?
- **Data Sharing**: Do you share data with third parties?
- **Data Security**: How is data encrypted and protected?

## App Tracking Transparency (iOS)

### Current Status: ✅ Not Required
- No advertising SDKs detected (AdMob, Facebook, etc.)
- No tracking SDKs detected
- No `NSUserTrackingUsageDescription` needed currently

### If Adding Ads/Tracking Later:
1. Add App Tracking Transparency framework
2. Request tracking permission before data collection
3. Add `NSUserTrackingUsageDescription` to Info.plist
4. Update privacy manifest with tracking domains

## SDK Privacy Analysis

### Current SDKs:
- **React Native WebView**: 
  - Data Access: Web content, cookies
  - Privacy Impact: Medium (web data)
  - Disclosure: Required if tracking web behavior

- **Expo Core**:
  - Data Access: Device info, crash logs
  - Privacy Impact: Low
  - Disclosure: Usually covered by standard privacy policy

### No High-Risk SDKs Detected:
- ✅ No AdMob (advertising tracking)
- ✅ No Firebase Analytics (user behavior tracking)
- ✅ No social media SDKs (data sharing)
- ✅ No payment processing (financial data)

## Privacy Policy Requirements

### Required Information:
1. **Data Collection**: What data you collect
2. **Data Usage**: How you use collected data  
3. **Data Sharing**: Who you share data with
4. **Data Storage**: How long you store data
5. **User Rights**: How users can access/delete data
6. **Contact Information**: How users can contact you

### Template Sections:
```
1. Information We Collect
   - Account information (email, name)
   - Usage data (app interactions)
   - Device information (iOS/Android version)
   - Audio recordings (for interview practice)

2. How We Use Information
   - Provide app functionality
   - Improve user experience
   - Customer support

3. Information Sharing
   - We do not sell or share personal data
   - Service providers (hosting, analytics)
   - Legal requirements

4. Data Security
   - Industry standard encryption
   - Secure data transmission
   - Regular security audits

5. Your Rights
   - Access your data
   - Delete your data  
   - Opt-out of communications

6. Contact Us
   - Email: privacy@yourapp.com
   - Website: yourapp.com/privacy
```

## Compliance Checklist

### iOS App Store Review
- [x] Required usage descriptions added
- [ ] Privacy manifest created (if needed)
- [ ] Privacy policy URL ready
- [ ] No tracking without ATT prompt
- [ ] Sensitive permissions justified

### Google Play Store Review  
- [x] Minimal permissions requested
- [ ] Data safety form completed
- [ ] Privacy policy URL provided
- [ ] Target API level compliance
- [ ] No unauthorized data collection

### GDPR Compliance (EU Users)
- [ ] Lawful basis for data processing
- [ ] User consent mechanisms
- [ ] Data portability features
- [ ] Right to deletion (right to be forgotten)
- [ ] Privacy policy in local languages

### COPPA Compliance (If targeting children)
- [ ] Parental consent mechanisms
- [ ] No behavioral advertising to children
- [ ] Limited data collection
- [ ] Third-party service compliance

## Action Items

### Immediate (Before Store Submission):
1. **Review microphone usage** - Verify app actually needs `RECORD_AUDIO`
2. **Create privacy policy** - Host on website with HTTPS
3. **Complete Data Safety form** - Google Play Console
4. **Test permission prompts** - Ensure proper messaging

### If Adding Features:
1. **Camera access** - Add NSCameraUsageDescription
2. **Photo library** - Add NSPhotoLibraryUsageDescription  
3. **Location services** - Add location usage descriptions
4. **Analytics/Ads** - Create privacy manifest, add ATT

### Before Public Release:
1. **Legal review** - Have lawyer review privacy policy
2. **Compliance audit** - Verify all disclosures are accurate
3. **User testing** - Test permission flows on real devices
4. **Documentation** - Keep records of privacy decisions

---
*Privacy compliance is ongoing - review when adding new features or SDKs*