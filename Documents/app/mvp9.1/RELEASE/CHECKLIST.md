# 📋 Release Checklist

## Pre-Build Validation

### App Configuration
- [ ] Bundle IDs set consistently:
  - [ ] Android: `com.arun.mobileshell` ✅ Configured
  - [ ] iOS: `com.arun.mobileshell` ✅ Configured
- [ ] Version numbers updated:
  - [ ] App version: `1.0.0` ✅ Set
  - [ ] Android versionCode: `1` ✅ Set
  - [ ] iOS buildNumber: `1` ✅ Set
- [ ] App name verified: "Mobile Shell" ✅ Set

### Assets & Branding
- [ ] App icons verified:
  - [ ] Main icon (1024×1024): ⚠️ Placeholder - needs replacement
  - [ ] Adaptive icon (Android): ⚠️ Placeholder - needs replacement
- [ ] Splash screen configured: ⚠️ Placeholder - needs replacement
- [ ] Store screenshots captured: ❌ Not created
- [ ] Feature graphic created (Android): ❌ Not created

### Permissions & Privacy
- [ ] Permission usage justified:
  - [ ] INTERNET: ✅ Required for web functionality
  - [ ] RECORD_AUDIO: ⚠️ Verify actual usage needed
- [ ] iOS usage descriptions present:
  - [ ] NSMicrophoneUsageDescription: ✅ Configured
- [ ] Privacy policy prepared: ❌ Needs creation
- [ ] Data safety forms ready: ❌ Needs completion

### Development Environment
- [ ] Dependencies up to date: ✅ Compatible versions
- [ ] EAS CLI installed: `npm install -g @expo/eas-cli`
- [ ] Expo account logged in: `eas login`
- [ ] Build scripts tested: ✅ Added to package.json

## Credentials & Signing

### Android (Google Play)
- [ ] Google Play Console account created
- [ ] Service account JSON generated
- [ ] Service account permissions configured
- [ ] Test with preview build first

### iOS (App Store)
- [ ] App Store Connect account access
- [ ] API key generated (.p8 file)
- [ ] Key ID and Issuer ID noted
- [ ] App created in App Store Connect

### EAS Credentials
- [ ] Android signing key generated: `eas credentials -p android`
- [ ] iOS distribution certificate created: `eas credentials -p ios`
- [ ] Provisioning profiles configured
- [ ] Credentials tested with development build

## Testing & Quality Assurance

### Functional Testing
- [ ] Core app functionality tested
- [ ] Navigation flows verified
- [ ] Audio recording works (if used)
- [ ] WebView functionality tested
- [ ] Offline behavior verified

### Device Testing
- [ ] Android physical device testing
- [ ] iOS physical device testing
- [ ] Multiple screen sizes tested
- [ ] Different OS versions tested
- [ ] Performance on older devices verified

### Build Testing
- [ ] Development build works: `eas build -p all --profile development`
- [ ] Preview build works: `eas build -p all --profile preview`
- [ ] Production build works: `eas build -p all --profile production`

## Store Preparation

### Google Play Console
- [ ] App listing created
- [ ] Store listing information completed:
  - [ ] App title and description
  - [ ] Screenshots uploaded
  - [ ] Feature graphic uploaded
  - [ ] App category selected
  - [ ] Content rating completed
- [ ] Data safety form completed
- [ ] Pricing and distribution set
- [ ] Internal testing track set up

### Apple App Store Connect
- [ ] App created with correct Bundle ID
- [ ] App information completed:
  - [ ] Name, subtitle, description
  - [ ] Keywords optimized
  - [ ] Screenshots for all device sizes
  - [ ] App category selected
  - [ ] Age rating selected
- [ ] Privacy policy URL added
- [ ] App review information completed
- [ ] Pricing tier selected

### Marketing Assets
- [ ] App description optimized for discoverability
- [ ] Keywords researched and implemented
- [ ] Screenshots showcase key features
- [ ] App preview videos created (optional)

## Build & Submit

### Pre-Submission
- [ ] Run project validation: `node tools/pack_release.js`
- [ ] Run expo doctor: `npm run doctor`
- [ ] All linting passes: `npm run lint`
- [ ] TypeScript checks pass: `npm run typecheck`

### Android Submission
- [ ] Build production APK: `npm run build:android`
- [ ] Submit to internal testing: `npm run submit:android`
- [ ] Verify upload in Play Console
- [ ] Add internal testers
- [ ] Test internal testing build
- [ ] Promote to production when ready

### iOS Submission
- [ ] Build production IPA: `npm run build:ios`
- [ ] Submit to App Store Connect: `npm run submit:ios`
- [ ] Verify upload in TestFlight
- [ ] Add internal testers
- [ ] Test TestFlight build
- [ ] Submit for App Store review when ready

## Post-Submission

### Monitoring
- [ ] Monitor build status in EAS dashboard
- [ ] Check store review status regularly
- [ ] Respond to reviewer feedback promptly
- [ ] Test final approved builds

### Launch Preparation
- [ ] Marketing materials ready
- [ ] Support documentation prepared
- [ ] Analytics tracking configured
- [ ] Crash reporting enabled
- [ ] Update rollout plan prepared

### Go-Live Checklist
- [ ] App approved on both stores
- [ ] Release notes finalized
- [ ] Support team briefed
- [ ] Marketing campaign ready
- [ ] Social media posts scheduled
- [ ] Press kit prepared (if applicable)

## Rollback Plan

### If Issues Discovered
- [ ] Stop rollout immediately
- [ ] Document the issue
- [ ] Prepare hotfix release
- [ ] Test fix thoroughly
- [ ] Communicate with users

### Emergency Contacts
- [ ] Development team contacts ready
- [ ] Store support contacts noted
- [ ] User support process prepared

## Success Metrics

### Key Performance Indicators
- [ ] Download/install tracking set up
- [ ] User engagement metrics defined
- [ ] Crash rate monitoring enabled
- [ ] Performance metrics baseline established
- [ ] User feedback collection system ready

## Version 1.1 Planning

### Post-Launch Tasks
- [ ] Collect user feedback
- [ ] Monitor crash reports
- [ ] Identify improvement opportunities
- [ ] Plan next feature release
- [ ] Update development roadmap

---

## ⚠️ Critical Blockers (Fix Before Proceeding)

1. **Replace placeholder assets** - App icons and splash screen need branding
2. **Verify RECORD_AUDIO usage** - Remove permission if not needed
3. **Create privacy policy** - Required for both stores
4. **Complete store data forms** - Data Safety (Google) and Privacy Labels (Apple)
5. **Test on physical devices** - Ensure app works as expected

## ✅ Ready to Proceed When:
- All blockers resolved
- All pre-build validation items checked
- Credentials properly configured
- Store listings prepared
- Testing completed successfully

---
*Use this checklist systematically - don't skip steps!*