# Native IAP Testing Guide

This guide covers testing the native in-app purchase (IAP) implementation using react-native-iap on both iOS and Android platforms.

## Product Configuration

### iOS Products (App Store Connect)
All products are **Consumables** (one-time, repeatable purchases):

- `com.nailit.pack.starter` - 120 tokens - $9.99
- `com.nailit.pack.plus` - 250 tokens - $19.99
- `com.nailit.pack.pro` - 480 tokens - $39.99
- `com.nailit.pack.power` - 1000 tokens - $79.99

### Android Products (Google Play Console)
All products are **Managed Products** (consumables):

- `pack_starter_120` - 120 tokens - $9.99
- `pack_plus_250` - 250 tokens - $19.99
- `pack_pro_480` - 480 tokens - $39.99
- `pack_power_1000` - 1000 tokens - $79.99

## How Consumables Work in This App

**Purchase Flow:**
1. User taps "Buy" button in PaywallScreen
2. App requests purchase via `react-native-iap` (does NOT auto-finish)
3. Store shows native payment UI
4. Upon successful payment, purchase listener fires
5. App sends purchase data to server for verification
6. Server verifies with Apple/Google store
7. Server checks idempotency (prevents double-granting via `transaction_key`)
8. Server records purchase in database and grants tokens
9. App calls `finishTransaction({ purchase, isConsumable: true })`
   - **iOS**: Calls `finishTransaction` to mark purchase complete
   - **Android**: Calls `acknowledgePurchase` + `consumePurchase` to allow repurchase
10. User sees success alert and can buy again immediately

**Idempotency Protection:**
- Each purchase has a unique `transaction_key` (e.g., `ios_<orderId>` or `android_<orderId>`)
- Server checks if transaction already processed before granting tokens
- Prevents double-granting if purchase listener fires multiple times
- Safe to retry failed verifications

## Building for Testing

### Prerequisites
1. Install EAS CLI: `npm install -g eas-cli`
2. Login to EAS: `eas login`
3. Ensure environment variables are set in local `.env` (not committed):
   - `APPLE_SHARED_SECRET` - from App Store Connect
   - `GOOGLE_SERVICE_ACCOUNT_JSON` - from Google Cloud Console

### Build Commands

**Android (AAB for Play Console Internal Testing):**
```bash
cd mobile-shell
npm run build:android
```

This creates an Android App Bundle (AAB) suitable for upload to Play Console Internal Testing track.

**iOS (IPA for TestFlight):**
```bash
cd mobile-shell
npm run build:ios
npm run submit:ios
```

This builds an IPA and automatically submits it to App Store Connect for TestFlight distribution.

## Android Testing Setup

### 1. Upload Build to Play Console
1. Download the AAB from EAS build page
2. Go to Play Console → Your App → Testing → Internal testing
3. Create a new release
4. Upload the AAB file
5. Complete the release notes and save

### 2. Configure Products (One-time Setup)
1. Go to Play Console → Monetize → Products → In-app products
2. Ensure all 4 products are created and **Active**:
   - `pack_starter_120`
   - `pack_plus_250`
   - `pack_pro_480`
   - `pack_power_1000`
3. Set prices to match ($9.99, $19.99, $39.99, $79.99)
4. Ensure product type is "Consumable" (or use default)

### 3. Add License Testers
1. Go to Play Console → Setup → License testing
2. Add test Gmail accounts (e.g., your personal Gmail)
3. Set response to "RESPOND_NORMALLY"

### 4. Add Internal Testers
1. Go to Play Console → Testing → Internal testing → Testers tab
2. Create email list or add individual testers
3. Copy the opt-in URL

### 5. Install & Test
1. Share opt-in URL with testers (or use yourself)
2. Opt-in via the URL
3. Install app from Play Store (will show as "Internal testing" version)
4. **Important**: Must install from Play Store, NOT via adb/APK
5. Open app → Payment Plans → Select a pack → Complete purchase
6. Check that tokens increment after purchase
7. Try purchasing the same pack again to verify consumable behavior

### Android Troubleshooting
- **"Product not found"**: Products must be Active in Play Console
- **"Item already owned"**: Clear Play Store cache, or product wasn't consumed properly
- **Can't test**: Must use opt-in link, must install from Play Store
- **Wrong product IDs**: Verify code matches Play Console exactly
- **Billing unavailable**: License testers must use Gmail accounts

## iOS Testing Setup

### 1. Submit Build to TestFlight
Build and submit are handled by the commands above. Wait 5-10 minutes for processing.

### 2. Configure Products (One-time Setup)
1. Go to App Store Connect → My Apps → [Your App] → In-App Purchases
2. Ensure all 4 products are created with status **Ready to Submit**:
   - `com.nailit.pack.starter`
   - `com.nailit.pack.plus`
   - `com.nailit.pack.pro`
   - `com.nailit.pack.power`
3. Set prices to match ($9.99, $19.99, $39.99, $79.99)
4. Ensure product type is "Consumable"

### 3. Add Products to App Version
1. Go to App Store Connect → TestFlight → Your Build
2. Scroll to "In-App Purchases and Subscriptions"
3. Add all 4 consumable products to this version
4. Products can be "Ready to Submit" - they don't need to be reviewed for testing

### 4. Create Sandbox Test Accounts
1. Go to App Store Connect → Users and Access → Sandbox → Testers
2. Click + to add tester accounts
3. Use fake emails (e.g., `test1@example.com`, `test2@example.com`)
4. Note the passwords (auto-generated or set your own)
5. **Do NOT verify email** - sandbox accounts don't need verification

### 5. Install & Test
1. Install app via TestFlight on a **real iOS device** (Simulator doesn't support IAP)
2. **Sign out of real Apple ID**: Settings → App Store → Sign Out
3. **Do NOT sign into sandbox account yet** - you'll be prompted during purchase
4. Open app → Payment Plans → Select a pack → Tap Buy
5. When prompted to sign in, use sandbox tester email/password
6. Complete purchase (no real money charged)
7. Check that tokens increment after purchase
8. Try purchasing again to verify consumable behavior (can repurchase immediately)

### iOS Troubleshooting
- **"Cannot connect to iTunes Store"**: Must use real device, not Simulator
- **"This In-App Purchase has already been bought"**: Product wasn't finished properly, or not marked consumable
- **Products not loading**: IAPs must be added to the app version in App Store Connect
- **Wrong prices**: Clear cache by reinstalling app
- **Sign-in issues**: Make sure signed out of real Apple ID first, use sandbox account only when prompted
- **bundleIdentifier mismatch**: Verify app.json matches App Store Connect

## In-App Test Flow

**Expected User Journey:**
1. User opens app and navigates to Payment Plans (or Paywall screen)
2. Sees 4 token packs with store prices loaded
3. Taps "Buy" on any pack
4. Native payment UI appears (Touch ID / Face ID / Play Store payment)
5. User completes payment
6. Brief loading state while server verifies
7. Success alert: "120 tokens added to your account!" (or appropriate amount)
8. Token counter in UI updates immediately
9. User can buy the same pack again (consumable behavior)

**What to verify:**
- [ ] All 4 products load with correct prices
- [ ] Purchase flow completes without errors
- [ ] Tokens increment by correct amount after purchase
- [ ] Success alert shows correct token amount
- [ ] Can immediately repurchase same product (consumable)
- [ ] Purchase survives app restart (tokens persist)
- [ ] No duplicate token grants on network retry
- [ ] Failed purchases don't grant tokens

## Common Issues & Fixes

### Products Not Loading
- **iOS**: Ensure products added to app version in App Store Connect
- **Android**: Ensure products are Active in Play Console
- **Both**: Check network logs, verify product IDs match exactly

### Purchase Verification Fails
- Check server logs for verification errors
- Verify `APPLE_SHARED_SECRET` is correct
- Verify `GOOGLE_SERVICE_ACCOUNT_JSON` has proper permissions
- Ensure service account has "Android Publisher" role (Android only)

### Tokens Not Granted
- Check server logs for `increment_tokens` RPC call
- Verify Supabase migration ran successfully
- Check `purchases` table for duplicate `transaction_key`
- Ensure user is logged in with correct `userId`

### Cannot Repurchase (iOS)
- Transaction wasn't finished properly
- Check that `isConsumable: true` is set in `finishTransaction`
- Try another sandbox account to test fresh

### Cannot Repurchase (Android)
- Product wasn't consumed after acknowledgment
- Check that `isConsumable: true` is set (library handles consume automatically)
- Clear Play Store cache and reinstall from store

### Server Verification Times Out
- Check backend logs for errors
- Verify network connectivity from mobile device to server
- Ensure `EXPO_PUBLIC_API_URL` points to correct backend
- Check rate limiting on backend

## Server Verification Details

The server verifies purchases before granting tokens:

**iOS (Apple Receipt Verification):**
- Uses `/verifyReceipt` endpoint (legacy but still supported)
- Tries production URL first, falls back to sandbox if 21007 error
- Validates receipt status === 0 (valid)

**Android (Google Play API):**
- Uses Google Play Developer API v3
- Requires service account with "Android Publisher" role
- Checks `purchaseState === 0` (purchased)
- Validates purchase token and product ID

**Idempotency:**
- Server stores unique `transaction_key` in `purchases` table
- Format: `ios_<transactionId>` or `android_<orderId>`
- Prevents duplicate token grants if webhook/listener fires multiple times

## Environment Variables Reference

**Backend `.env` (DO NOT COMMIT):**
```bash
# Apple IAP Verification
APPLE_SHARED_SECRET=your_app_specific_shared_secret_from_app_store_connect

# Google IAP Verification (entire JSON object as one line)
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"...","private_key":"..."}

# Supabase (already configured)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

**Mobile `.env` (or EAS Secrets):**
```bash
# Backend API URL
EXPO_PUBLIC_API_URL=https://your-backend.onrender.com
```

## Deployment Checklist

### Before Building
- [ ] Supabase migration applied (`2025-10-16-consumable-iap.sql`)
- [ ] Backend environment variables set (Apple + Google credentials)
- [ ] Backend deployed and running
- [ ] Product IDs in code match store products exactly

### Android Deployment
- [ ] Products created in Play Console (Active status)
- [ ] Build uploaded to Internal Testing track
- [ ] License testers added
- [ ] Internal testers added and invited
- [ ] Test installation via opt-in link
- [ ] Verify purchase flow works

### iOS Deployment
- [ ] Products created in App Store Connect (Ready to Submit)
- [ ] Products added to app version
- [ ] Build submitted to TestFlight
- [ ] Sandbox testers created
- [ ] Test installation via TestFlight
- [ ] Verify purchase flow works on real device

### Production Launch
- [ ] All sandbox tests passing
- [ ] No duplicate token grants observed
- [ ] Consumable repurchase works correctly
- [ ] Server verification logs clean
- [ ] Ready to promote to production release
