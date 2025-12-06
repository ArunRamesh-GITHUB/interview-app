# IAP Troubleshooting - TestFlight

## Changes Made

✅ **Removed test product IDs from PRODUCT_TOKEN_MAP**
- Removed: `com.yourname.test.pack.*` entries
- Kept: Production product IDs only

✅ **Fixed bundle ID log message**
- Removed hardcoded test bundle ID from logs

✅ **USE_TEST_IAP = false** (already set)

## Current Configuration

**Production Product IDs (iOS):**
- `com.nailit.pack.starter` → 120 tokens
- `com.nailit.pack.plus` → 250 tokens
- `com.nailit.pack.pro` → 480 tokens
- `com.nailit.pack.power` → 1000 tokens

**App Store Connect Status:**
- ✅ Products exist and are Consumable type
- ✅ Product IDs match code

## Why Buy Buttons Might Not Work

### 1. Products Not Approved/Ready
**Check in App Store Connect:**
- Go to: Features → In-App Purchases
- Each product should show status: **"Ready to Submit"** or **"Approved"**
- If status is "Waiting for Review" or "Rejected", they won't work

### 2. Products Not Available in TestFlight
**TestFlight uses Sandbox:**
- Products must be approved for Sandbox testing
- Check: App Store Connect → TestFlight → Your Build → In-App Purchases
- Make sure products are listed there

### 3. App Store Connect Sync Delay
**Sometimes takes time:**
- After creating/approving products, wait 10-30 minutes
- App Store Connect needs to sync to TestFlight

### 4. Server Not Responding
**Check Render logs:**
- When you tap "Buy", check server logs
- Look for errors in `/api/iap/verify` endpoint
- Make sure server is deployed with latest code

### 5. User Not Logged In
**Check in app:**
- User must be logged in for production IAP
- Test products worked without login, but production requires userId

## How to Debug

### 1. Check Product Loading
Look for these logs in Xcode/device console:
```
🔍 Requesting products with IDs: [com.nailit.pack.starter, ...]
📦 Loaded products: 4
```

If `Loaded products: 0`, products aren't loading from App Store.

### 2. Check Purchase Flow
When tapping "Buy", look for:
```
🛒 Initiating purchase for: com.nailit.pack.plus
✅ Purchase successful: ...
```

If you see errors, check the error code and message.

### 3. Check Server Logs
In Render dashboard, check logs when purchase happens:
- Should see: `💰 Granting X tokens to user Y`
- If errors, check receipt verification

## Quick Fixes

### If Products Not Loading:
1. **Wait 10-30 minutes** after creating products in App Store Connect
2. **Check product status** - must be "Ready to Submit" or "Approved"
3. **Rebuild app** - sometimes need fresh build after product changes

### If Purchase Fails:
1. **Check user is logged in** - production IAP requires userId
2. **Check server logs** - see if receipt verification is failing
3. **Try Restore Purchases** - if purchase completed but tokens not granted

### If Server Not Responding:
1. **Check Render deployment** - make sure latest code is deployed
2. **Check server endpoint** - `/api/iap/verify` should be accessible
3. **Check environment variables** - make sure all required vars are set

## Next Steps

1. **Push changes to GitHub:**
   ```bash
   git push origin main
   ```

2. **Redeploy on Render** (or wait for auto-deploy)

3. **Rebuild app for TestFlight:**
   ```bash
   npm run build:ios -- --non-interactive
   ```

4. **Test again** - wait a few minutes after rebuild

## Common Issues

### "Product not found"
- Products not approved in App Store Connect
- Products not synced to TestFlight yet
- Wait 10-30 minutes and try again

### "Purchase failed"
- Check server logs for receipt verification errors
- Make sure user is logged in
- Check network connection

### "Products array empty"
- Products not loading from App Store
- Check product status in App Store Connect
- Rebuild app

---

**Most likely issue:** Products need to be approved and synced to TestFlight. This can take 10-30 minutes after creating them in App Store Connect.

