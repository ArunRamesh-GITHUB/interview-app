# Android Build & Credentials Setup

## What You Need for Android

### 1. **Android Keystore** (For Signing)
- EAS can generate this automatically
- Or use existing one if already created
- Used to sign the APK/AAB file

### 2. **Google Play Console Access** (You Have This ✅)
- You already have invitation/access
- Needed to submit builds

### 3. **Google Play Service Account** (Optional - For Auto Submit)
- Only needed if you want automatic submission
- Can skip and upload manually instead

---

## Step 1: Check Android Credentials

```bash
cd mobile-shell
eas credentials -p android
```

This will show:
- **Keystore** - Signing key for the app
- **Google Service Account** - For auto-submission (optional)

---

## Step 2: Build Android App

### Option A: With Non-Interactive (Recommended - Uses Existing Credentials)

```bash
npm run build:android -- --non-interactive
```

This will:
- Use existing credentials if available
- Build AAB (Android App Bundle) for Google Play
- Take 10-20 minutes

### Option B: Interactive Build

```bash
npm run build:android
```

If credentials don't exist, it will prompt you to create them.

---

## Step 3: Check What Credentials Exist

```bash
# View Android credentials
eas credentials -p android
```

You'll see:
- **Keystore** status
- **Google Service Account** status (if configured)

---

## Step 4: Submit to Google Play

### Option A: Automatic Submission (If Service Account Configured)

```bash
npm run submit:android -- --non-interactive
```

Or:
```bash
eas submit -p android --latest --non-interactive
```

### Option B: Manual Upload

1. **Download AAB from EAS:**
   ```bash
   eas build:download --platform android --latest
   ```

2. **Upload to Google Play Console:**
   - Go to https://play.google.com/console
   - Navigate to your app → **Release** → **Internal testing**
   - Click **Create new release**
   - Upload the `.aab` file
   - Submit

---

## Android Credentials Explained

### Keystore (Required)
- **What it is:** Signing key for your app
- **Who creates it:** EAS (automatic) or you (manual)
- **Where stored:** EAS servers (secure)
- **When needed:** Every build

### Google Service Account (Optional)
- **What it is:** Allows EAS to submit builds automatically
- **Who creates it:** You in Google Play Console
- **When needed:** Only for automatic submission
- **Can skip:** Yes, upload manually instead

---

## Quick Commands

```bash
# Check credentials
eas credentials -p android

# Build (non-interactive - uses existing)
npm run build:android -- --non-interactive

# Build (interactive - will prompt if needed)
npm run build:android

# Check build status
eas build:list

# Download AAB
eas build:download --platform android --latest

# Submit (if service account configured)
npm run submit:android -- --non-interactive
```

---

## What to Expect

### If Credentials Don't Exist:
- EAS will prompt you to create keystore
- It will generate one automatically
- Store it securely on EAS servers

### If Credentials Already Exist:
- `--non-interactive` will use them automatically
- No prompts needed
- Build will start immediately

---

## Troubleshooting

### "No keystore found"
- Run: `eas credentials -p android`
- Select: "Build credentials (Android Keystore)"
- Choose: "Generate new credentials"

### "Package name not found in Google Play"
- Ask client if app exists in Google Play Console
- Or create it: Google Play Console → Create app

### Build fails
- Check: `eas build:list` for error details
- Try interactive build: `npm run build:android` (without --non-interactive)

---

**TL;DR:** 
1. Check: `eas credentials -p android`
2. Build: `npm run build:android -- --non-interactive`
3. Submit: `npm run submit:android -- --non-interactive` (or upload manually)

