# Testing Before Publishing - Quick Guide

## ✅ Bundle IDs Confirmed
- iOS: `com.nailit.interview` ✅
- Android: `com.nailit.interview` ✅

---

## Step 1: Start the Server

### Check if you have a `.env` file

The server needs these environment variables:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SESSION_SECRET`
- `OPENAI_API_KEY`
- `PORT` (optional, defaults to 3001)

### Start the server:

```bash
# From project root
npm install  # If you haven't already
npm start    # Starts server on port 3001 (or PORT from .env)
```

Or:
```bash
npm run dev  # Same thing
```

**Server will run on:** `http://localhost:3001`

---

## Step 2: Test the Mobile App Locally

### Option A: Run on iOS Simulator / Android Emulator

```bash
cd mobile-shell

# Install dependencies if needed
npm install

# Start Expo dev server
npm start

# Then:
# - Press 'i' for iOS simulator
# - Press 'a' for Android emulator
# - Scan QR code with Expo Go app on physical device
```

### Option B: Run Development Build on Physical Device

If you have a development build installed:

```bash
cd mobile-shell
npm start
```

Then open the app on your device - it will connect to the dev server.

---

## Step 3: Test IAP (In-App Purchases)

Since you've switched to production IAP product IDs, you can test:

1. **iOS**: Use Sandbox test account (create in App Store Connect)
2. **Android**: Use test account in Google Play Console

**Note:** IAP testing requires:
- Real device (not simulator)
- Test accounts set up in respective stores
- Products configured in App Store Connect / Google Play Console

---

## Step 4: Test Server Integration

Make sure the mobile app can connect to your local server:

1. **Check server is running**: `http://localhost:3001`
2. **Update mobile app API endpoint** (if needed):
   - For iOS Simulator: `http://localhost:3001` works
   - For Android Emulator: `http://10.0.2.2:3001` (Android emulator localhost)
   - For physical device: Use your computer's IP address (e.g., `http://192.168.1.100:3001`)

---

## Step 5: When Ready to Build for Production

After testing, you can proceed with EAS builds:

```bash
# Make sure all changes are committed
git add .
git commit -m "Switch to production IAP and bundle IDs"
git push

# Then follow MILESTONE_4_SETUP.md
```

---

## Quick Commands Reference

```bash
# Start server
npm start

# Start mobile app dev server
cd mobile-shell && npm start

# Check if server is running
curl http://localhost:3001/api/health  # (if you have health endpoint)

# View server logs
# Server logs will show in terminal where you ran npm start
```

---

## Troubleshooting

### Server won't start
- Check `.env` file exists and has all required variables
- Check port 3001 is not already in use
- Check Node.js version: `node --version` (should be 20.x)

### Mobile app can't connect to server
- **iOS Simulator**: Use `http://localhost:3001`
- **Android Emulator**: Use `http://10.0.2.2:3001`
- **Physical Device**: Use your computer's local IP (find with `ipconfig` on Windows or `ifconfig` on Mac/Linux)

### IAP not working
- Must test on real device (not simulator)
- Need test accounts set up in App Store Connect / Google Play
- Products must be configured in respective stores

---

**Ready to test!** Start with `npm start` in the root directory. 🚀

