# Fix: Products Not Loading from App Store

## The Problem

**Error:** `Product com.nailit.pack.starter not found. Available products: none`

This means:
- ✅ App is trying to purchase (code is working)
- ❌ Products aren't loading from App Store Connect
- ❌ `RNIap.getProducts()` is returning empty array

## Why Products Aren't Loading

### 1. Products Not Approved for TestFlight

**"Ready to Submit" is NOT enough for TestFlight Sandbox**

Products need to be:
- **"Approved"** status (not just "Ready to Submit")
- Or submitted with the app for review

**Check:**
- App Store Connect → Your App → Features → In-App Purchases
- Each product should show **"Approved"** status
- If "Ready to Submit", they won't work in TestFlight

### 2. Products Not Associated with Bundle ID

**Products must be linked to your bundle ID:**
- Bundle ID: `com.nailit.interview`
- Products must be associated with this bundle ID

**Check:**
- App Store Connect → Your App
- Features → In-App Purchases
- Make sure products show under your app

### 3. Products Not Synced to TestFlight

**After creating/approving products:**
- Can take 10-30 minutes to sync
- Need to wait for App Store to sync

**Solution:**
- Wait 10-30 minutes
- Rebuild app
- Try again

### 4. TestFlight Uses Sandbox

**TestFlight always uses Sandbox environment:**
- Products must be available in Sandbox
- Need Sandbox test account
- Products must be approved for Sandbox testing

## Solutions

### Solution 1: Approve Products (Recommended)

1. **Go to App Store Connect**
2. **Your App → Features → In-App Purchases**
3. **For each product:**
   - Click on the product
   - Make sure it's **"Approved"** (not "Ready to Submit")
   - If "Ready to Submit", submit app for review

### Solution 2: Submit App for Review

**Even for TestFlight, products need to be submitted:**

1. **App Store Connect → Your App**
2. **Submit for review** (even if just for TestFlight)
3. **Include In-App Purchases** in submission
4. **Wait for approval** (or at least processing)

### Solution 3: Wait for Sync

**After approving products:**
- Wait 10-30 minutes
- Rebuild app: `npm run build:ios -- --non-interactive`
- Test again

### Solution 4: Check Product Association

**Make sure products are linked to your app:**

1. **App Store Connect → Your App**
2. **Features → In-App Purchases**
3. **Verify products appear** under your app
4. **Check bundle ID** matches: `com.nailit.interview`

## Quick Checklist

- [ ] Products are **"Approved"** (not "Ready to Submit")
- [ ] Products are associated with bundle ID `com.nailit.interview`
- [ ] Products appear in your app's In-App Purchases section
- [ ] Waited 10-30 minutes after approval
- [ ] Rebuilt app after product changes
- [ ] Using Sandbox test account in TestFlight

## Most Likely Fix

**Products need to be "Approved" status, not "Ready to Submit"**

1. Go to App Store Connect
2. Submit your app for review (even for TestFlight)
3. Include In-App Purchases in submission
4. Wait for processing/approval
5. Rebuild app
6. Test again

---

**The code is working correctly - the issue is that App Store Connect isn't providing the products to the app because they're not approved/synced yet.**

