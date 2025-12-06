# TestFlight IAP Not Working - Debug Guide

## Products Status
✅ All products are "Ready to Submit" in App Store Connect
- `com.nailit.pack.starter`
- `com.nailit.pack.plus`
- `com.nailit.pack.pro`
- `com.nailit.pack.power`

## Common Issues & Solutions

### 1. Products Need to be "Approved" for TestFlight

**"Ready to Submit" might not be enough for TestFlight Sandbox**

**Check:**
- Go to App Store Connect → Your App → TestFlight
- Check if products appear in the build's In-App Purchases section
- Products might need to be "Approved" (not just "Ready to Submit")

**Solution:**
- Submit the app for review (even if just for TestFlight)
- Or wait for products to sync to TestFlight (can take time)

### 2. Products Not Loading from App Store

**Check device/Xcode console logs for:**
```
🔍 Requesting products with IDs: [com.nailit.pack.starter, ...]
📦 Loaded products: 4
```

**If `Loaded products: 0`:**
- Products aren't loading from App Store
- Could be sync delay (wait 10-30 minutes)
- Could be products not approved for Sandbox

**Solution:**
- Wait 10-30 minutes after creating/approving products
- Check product status in App Store Connect
- Rebuild app after product changes

### 3. User Not Logged In

**Production IAP requires userId:**
- Test products worked without login
- Production IAP needs authenticated user

**Check:**
- Is user logged in when tapping "Buy"?
- Check logs for: `🔑 Granting tokens with userId:`

**Solution:**
- Make sure user is logged in before purchasing
- Check authentication flow

### 4. Server Not Responding

**Check Render logs when tapping "Buy":**
- Should see: `/api/iap/verify` request
- Should see: `💰 Granting X tokens to user Y`

**If no server request:**
- Server might not be deployed
- Network issue
- API URL not configured

**Solution:**
- Check Render deployment status
- Verify server is accessible
- Check `EXPO_PUBLIC_API_URL` in app

### 5. Purchase Flow Error

**Check device/Xcode console for errors:**
```
🛒 Initiating purchase for: com.nailit.pack.plus
❌ Purchase error: [error message]
```

**Common errors:**
- `E_USER_CANCELLED` - User cancelled (not a bug)
- `E_ITEM_UNAVAILABLE` - Product not available
- `E_NETWORK_ERROR` - Network issue
- `E_SERVICE_ERROR` - App Store service error

**Solution:**
- Check error code and message
- Try again after a few minutes
- Check App Store status

### 6. TestFlight Sandbox Account

**TestFlight uses Sandbox environment:**
- Need to use Sandbox test account
- Can't use regular Apple ID for purchases

**Solution:**
- Create Sandbox test account in App Store Connect
- Sign out of regular Apple ID in Settings → App Store
- Use Sandbox account when prompted

## Debugging Steps

### Step 1: Check Product Loading

1. **Open app in TestFlight**
2. **Go to buy tokens screen**
3. **Check Xcode/device console for:**
   ```
   🔍 Requesting products with IDs: [...]
   📦 Loaded products: X
   ```

**If products = 0:**
- Products not loading from App Store
- Wait 10-30 minutes
- Check product status

### Step 2: Check Purchase Flow

1. **Tap "Buy" button**
2. **Check console for:**
   ```
   🛒 Initiating purchase for: com.nailit.pack.plus
   ✅ Purchase successful: ...
   ```

**If error appears:**
- Note the error code and message
- Check solutions above

### Step 3: Check Server Response

1. **Check Render logs**
2. **Look for:**
   ```
   POST /api/iap/verify
   💰 Granting X tokens to user Y
   ```

**If no request:**
- Server not being called
- Check network/API URL

### Step 4: Check User Authentication

1. **Make sure user is logged in**
2. **Check console for:**
   ```
   🔑 Granting tokens with userId: [user-id]
   ```

**If userId is null:**
- User not logged in
- Need to log in first

## Quick Fixes to Try

### 1. Wait and Retry
- Products can take 10-30 minutes to sync
- Wait and try again

### 2. Rebuild App
```bash
npm run build:ios -- --non-interactive
```
- Sometimes need fresh build after product changes

### 3. Check Product Status
- Make sure products are "Approved" (not just "Ready to Submit")
- Check if they appear in TestFlight build

### 4. Use Sandbox Account
- Sign out of regular Apple ID
- Use Sandbox test account when purchasing

### 5. Check Server Deployment
- Make sure latest code is deployed to Render
- Check server logs for errors

## Most Likely Issues

1. **Products need to be "Approved"** (not just "Ready to Submit")
2. **Products haven't synced to TestFlight yet** (wait 10-30 min)
3. **User not logged in** (production IAP requires userId)
4. **Need Sandbox test account** (TestFlight uses Sandbox)

## Next Steps

1. **Check Xcode/device console** when tapping "Buy"
2. **Note any error messages**
3. **Check Render server logs**
4. **Try with Sandbox test account**
5. **Wait 10-30 minutes and retry** (for product sync)

---

**Most common fix:** Products need to be "Approved" and synced to TestFlight. This can take time after creating them.

