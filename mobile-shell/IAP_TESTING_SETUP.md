# IAP Testing Setup Guide

## Quick Setup for Testing IAP Without Client Account

You can create your own test bundle identifier and IAP products for testing.

### Step 1: Create Your Own App Store Connect Account

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Sign in with your Apple Developer account (or create one)
3. Create a new app with a test bundle ID (e.g., `com.yourname.test.interview`)

### Step 2: Update Bundle Identifier

Update `mobile-shell/app.json`:

```json
"ios": {
  "bundleIdentifier": "com.yourname.test.interview",  // Your test bundle ID
  ...
}
```

### Step 3: Create Test IAP Products in App Store Connect

1. In App Store Connect, go to your test app
2. Navigate to **Features** → **In-App Purchases**
3. Click **+** to create new products
4. Create 4 **Consumable** products with these IDs:
   - `com.yourname.test.pack.starter`
   - `com.yourname.test.pack.plus`
   - `com.yourname.test.pack.pro`
   - `com.yourname.test.pack.power`

5. For each product:
   - **Type**: Consumable
   - **Reference Name**: Starter Pack / Plus Pack / Pro Pack / Power Pack
   - **Product ID**: Use the IDs above
   - **Price**: Set any test price (e.g., $0.99, $1.99, $3.99, $7.99)
   - **Status**: Must be "Ready to Submit" or "Approved"

### Step 4: Update Code Configuration

1. Open `mobile-shell/src/config/purchases.ts`
2. Update the test product IDs (replace `yourname` with your identifier):
   ```typescript
   productIdIOS: 'com.yourname.test.pack.starter',
   ```
3. Make sure `USE_TEST_IAP = true`

### Step 5: Update PRODUCT_TOKEN_MAP

In the same file, add your test product IDs to `PRODUCT_TOKEN_MAP`:
```typescript
'com.yourname.test.pack.starter': 120,
'com.yourname.test.pack.plus': 250,
// etc.
```

### Step 6: Build and Test

1. Build the app with your test bundle ID
2. Sign with your development certificate
3. Test on a device (IAP doesn't work in simulator)
4. Use a **Sandbox Test Account** (create in App Store Connect → Users and Access → Sandbox Testers)

### Important Notes

- **IAP only works on real devices**, not simulator
- You must use a **Sandbox Test Account** for testing
- Products must be in "Ready to Submit" status (can take a few minutes to propagate)
- The bundle ID in your app must match the bundle ID in App Store Connect

### Switching to Production

When ready to use client's IAP:
1. Set `USE_TEST_IAP = false` in `purchases.ts`
2. Update bundle ID back to `com.nailit.interview`
3. The code will automatically use production product IDs



