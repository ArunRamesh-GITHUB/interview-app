# Milestone 4: EAS Builds + TestFlight & Google Play Setup

## ✅ Good News: EAS Handles Provisioning Automatically!

You **don't need to manually set up provisioning profiles or certificates**. EAS will automatically:
- Generate iOS distribution certificates
- Create provisioning profiles
- Handle code signing
- Manage Android signing keys

You just need:
1. ✅ Access to Apple Developer account (you have invitation)
2. ✅ Access to Google Play Console (you have invitation)
3. ✅ EAS CLI installed and logged in
4. ✅ Correct bundle IDs configured

---

## Step 1: Update Code to Production Settings

### 1.1 Switch to Production IAP Product IDs

**File:** `mobile-shell/src/config/purchases.ts`

Change line 8:
```typescript
const USE_TEST_IAP = false // Changed from true
```

This will use the production product IDs:
- `com.nailit.pack.starter`
- `com.nailit.pack.plus`
- `com.nailit.pack.pro`
- `com.nailit.pack.power`

### 1.2 Update iOS Bundle Identifier

**File:** `mobile-shell/app.json`

**IMPORTANT:** You need to confirm the production bundle ID with your client. Based on Android package name, it's likely:
- `com.nailit.interview` (matches Android)

But **verify with client first** - it must match what's configured in App Store Connect.

Update line 15:
```json
"bundleIdentifier": "com.nailit.interview",  // Replace com.yourname.test.interview
```

### 1.3 Verify Android Package Name

**File:** `mobile-shell/app.json`

Already correct: `com.nailit.interview` ✅

---

## Step 2: Install & Login to EAS CLI

```bash
# Install EAS CLI globally
npm install -g eas-cli

# Login to your Expo account
eas login

# If you don't have an Expo account, create one at https://expo.dev
```

---

## Step 3: Set Up iOS Credentials (EAS Auto-Managed)

EAS will automatically create certificates and provisioning profiles for you!

```bash
cd mobile-shell

# Configure iOS credentials (EAS will guide you)
eas credentials -p ios

# When prompted:
# 1. Select "Build credentials (iOS Distribution Certificate, Provisioning Profile)"
# 2. Choose "Generate new credentials" (EAS will create everything)
# 3. You'll need to authenticate with Apple Developer account
```

**What EAS needs:**
- Access to your Apple Developer account (you have invitation)
- EAS will use your Apple ID to create certificates automatically

**Note:** If you get an error about team access, you may need to:
1. Accept the Apple Developer invitation in your email
2. Ensure you have "Developer" or "Admin" role in the team

---

## Step 4: Set Up Android Credentials (EAS Auto-Managed)

```bash
# Configure Android credentials
eas credentials -p android

# When prompted:
# 1. Select "Build credentials (Android Keystore)"
# 2. Choose "Generate new credentials" (EAS will create keystore)
```

**What EAS needs:**
- Access to Google Play Console (you have invitation)
- EAS will generate and manage the signing key automatically

---

## Step 5: Build iOS App for TestFlight

```bash
cd mobile-shell

# Build iOS app (this will take 10-20 minutes)
npm run build:ios

# Or explicitly:
eas build -p ios --profile production
```

**What happens:**
- EAS builds your app in the cloud
- Creates an IPA file
- Signs it with the auto-generated certificate
- You'll get a download link when done

**Monitor build:**
```bash
# Check build status
eas build:list

# View specific build details
eas build:view [BUILD_ID]
```

---

## Step 6: Submit iOS to TestFlight

### Option A: Automatic Submission (Recommended)

```bash
# Submit latest build to TestFlight automatically
npm run submit:ios

# Or explicitly:
eas submit -p ios --latest
```

**What you need:**
- App Store Connect API key (optional but recommended for automation)
- Or you can upload manually via App Store Connect website

### Option B: Manual Upload

1. Download the IPA from EAS build page
2. Go to [App Store Connect](https://appstoreconnect.apple.com)
3. Navigate to your app → TestFlight
4. Upload the IPA manually

### Set Up App Store Connect API Key (Optional but Recommended)

For automated submissions:

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Navigate to **Users and Access** → **Integrations** → **App Store Connect API**
3. Click **Generate API Key**
4. Download the `.p8` file
5. Note the **Key ID** and **Issuer ID**

Then set environment variables:
```bash
export ASC_KEY_ID="YOUR_KEY_ID"
export ASC_ISSUER_ID="YOUR_ISSUER_ID"
export ASC_KEY_PATH="/path/to/AuthKey_XXXXXXXXXX.p8"
```

Or pass directly:
```bash
eas submit -p ios --latest \
  --asc-api-key-path="/path/to/AuthKey_XXXXXXXXXX.p8" \
  --asc-api-key-id="YOUR_KEY_ID" \
  --asc-api-issuer-id="YOUR_ISSUER_ID"
```

---

## Step 7: Build Android App for Google Play

```bash
cd mobile-shell

# Build Android app (this will take 10-20 minutes)
npm run build:android

# Or explicitly:
eas build -p android --profile production
```

**What happens:**
- EAS builds your app in the cloud
- Creates an AAB (Android App Bundle) file
- Signs it with the auto-generated keystore
- You'll get a download link when done

---

## Step 8: Submit Android to Google Play Internal Testing

### Option A: Automatic Submission (Recommended)

```bash
# Submit latest build to Google Play automatically
npm run submit:android

# Or explicitly:
eas submit -p android --latest
```

**What you need:**
- Google Play Service Account JSON file

### Set Up Google Play Service Account

1. Go to [Google Play Console](https://play.google.com/console)
2. Navigate to **Setup** → **API access**
3. Click **Create new service account** (or use existing)
4. Download the service account JSON file
5. Grant the service account access to your app

Then set environment variable:
```bash
export GOOGLE_SERVICE_ACCOUNT_KEY="/path/to/service-account.json"
```

Or pass directly:
```bash
eas submit -p android --latest \
  --service-account-key-path="/path/to/service-account.json"
```

### Option B: Manual Upload

1. Download the AAB from EAS build page
2. Go to [Google Play Console](https://play.google.com/console)
3. Navigate to your app → **Release** → **Internal testing**
4. Upload the AAB manually

---

## Step 9: Configure TestFlight

After submission:

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Navigate to your app → **TestFlight**
3. Wait for processing (usually 10-30 minutes)
4. Once processed:
   - Add **Internal Testers** (up to 100 people in your team)
   - Add **External Testers** (up to 10,000, requires Beta App Review)
5. Get the TestFlight link:
   - **Internal Testers**: They'll see it in TestFlight app automatically
   - **External Testers**: You'll get a public link to share

**TestFlight Invite Link Format:**
```
https://testflight.apple.com/join/[INVITE_CODE]
```

---

## Step 10: Configure Google Play Internal Testing

After submission:

1. Go to [Google Play Console](https://play.google.com/console)
2. Navigate to your app → **Release** → **Internal testing**
3. Create a new release (if not auto-created)
4. Add the uploaded AAB to the release
5. Add testers:
   - Go to **Testers** tab
   - Add email addresses or create a Google Group
6. Get the testing link:
   - Click **Copy link** in the Internal testing section
   - Share this link with testers

**Google Play Testing Link Format:**
```
https://play.google.com/apps/internaltest/[TEST_ID]
```

---

## Checklist Before Building

- [ ] `USE_TEST_IAP = false` in `purchases.ts`
- [ ] iOS bundle identifier updated to production value (confirm with client)
- [ ] Android package name verified (`com.nailit.interview`)
- [ ] EAS CLI installed and logged in
- [ ] Apple Developer account access confirmed
- [ ] Google Play Console access confirmed
- [ ] All changes committed and pushed to GitHub

---

## Common Issues & Solutions

### iOS: "No team found" or "Access denied"
- **Solution**: Accept the Apple Developer invitation email
- Ensure you have Developer/Admin role in the team
- Try: `eas credentials -p ios` again after accepting invitation

### iOS: "Bundle ID not found in App Store Connect"
- **Solution**: Create the app in App Store Connect first with the bundle ID
- Or ask client to create it and grant you access

### Android: "Package name not found"
- **Solution**: Create the app in Google Play Console first
- Or ask client to create it and grant you access

### Build fails: "Missing dependencies"
- **Solution**: 
  ```bash
  cd mobile-shell
  npm install
  ```

### Build takes too long
- **Solution**: This is normal! EAS builds take 10-20 minutes
- Check status: `eas build:list`

---

## What to Send to Client

After builds are ready:

1. **TestFlight Link:**
   - Go to App Store Connect → TestFlight
   - Copy the external tester link (or internal if they're in your team)
   - Format: `https://testflight.apple.com/join/[CODE]`

2. **Google Play Testing Link:**
   - Go to Google Play Console → Internal testing
   - Copy the testing link
   - Format: `https://play.google.com/apps/internaltest/[ID]`

---

## Next Steps After Milestone 4

1. Client tests via TestFlight and Google Play
2. Gather feedback
3. Fix any issues
4. Submit for App Store review (iOS)
5. Submit for production release (Android)

---

## Quick Reference Commands

```bash
# Build
cd mobile-shell
npm run build:ios          # iOS build
npm run build:android      # Android build

# Submit
npm run submit:ios         # Submit to TestFlight
npm run submit:android     # Submit to Google Play

# Check status
eas build:list             # List all builds
eas build:view [ID]        # View specific build

# Credentials
eas credentials -p ios     # iOS credentials
eas credentials -p android # Android credentials
```

---

**Remember:** EAS handles all the complex provisioning automatically. You just need access to the developer accounts and the correct bundle IDs! 🚀

