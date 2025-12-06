# How to Download IPA from EAS

## Method 1: Download from EAS Dashboard (Easiest)

1. **Go to the build URL:**
   ```
   https://expo.dev/accounts/arunramesh123/projects/mobile-shell/builds/5ae38773-e111-4df6-876b-921e2b7dd18b
   ```

2. **Wait for build to complete** (status will show "Finished")

3. **Click "Download" button** on the build page
   - It will download the `.ipa` file

## Method 2: Download via EAS CLI

```bash
# List your builds to get the build ID
eas build:list

# Download specific build
eas build:download [BUILD_ID]

# Or download the latest iOS build
eas build:download --platform ios --latest
```

## Method 3: Download from Build URL Directly

Once build is complete, the build page will have a direct download link.

## Using Transporter to Upload

1. **Download Transporter** (if you don't have it):
   - Mac App Store: Search "Transporter"
   - Or download from: https://apps.apple.com/app/transporter/id1450874784

2. **Open Transporter**

3. **Drag and drop the .ipa file** into Transporter

4. **Sign in** with the Apple ID that has access to "Arun Ramesh (Individual)" team

5. **Click "Deliver"** - it will upload to App Store Connect

## Using EAS Submit (Alternative)

Instead of manual upload, you can also use:

```bash
npm run submit:ios
```

Or:
```bash
eas submit -p ios --latest
```

This will automatically submit the latest build to App Store Connect.

---

**Quick Commands:**

```bash
# Check build status
eas build:list

# Download latest iOS build
eas build:download --platform ios --latest

# Submit to App Store Connect
eas submit -p ios --latest
```

