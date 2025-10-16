# Native IAP Migration Plan

## Overview
Migrating from RevenueCat to native react-native-iap for direct App Store and Google Play integration.

## Current State Analysis

### Existing Products (RevenueCat)
- **starter_monthly**: 120 tokens - iOS: `tokens.starter`, Android: `starter_monthly`
- **plus_monthly**: 250 tokens - iOS: `tokens.plus`, Android: `plus_monthly`
- **pro_monthly**: 480 tokens - iOS: `tokens.pro`, Android: `pro_monthly`
- **power_monthly**: 1000 tokens - iOS: `tokens.power`, Android: `power_monthly`

### Current Tech Stack
- Mobile: react-native-purchases v9.4.0 (RevenueCat SDK)
- Server: Express.js with RevenueCat webhook handler
- Database: Supabase with `token_ledger` table and `sp_grant_tokens` RPC

### Files to Modify/Replace
- `mobile-shell/src/lib/purchaseService.ts` - Replace RevenueCat service
- `mobile-shell/src/config/purchases.ts` - Replace configuration
- `mobile-shell/app/paywall.tsx` - Update UI (if exists)
- `mobile-shell/app/debug-purchases.tsx` - Update debug screen
- `server/routes/webhooks/revenuecat.js` - Replace with native webhooks
- `config/tokenPacks.js` - Update product IDs

## Migration Checklist

### 1. Mobile Dependencies & Configuration
- [x] Create feature branch `feat/iap-native`
- [ ] Remove `react-native-purchases` dependency
- [ ] Add `react-native-iap@latest` dependency
- [ ] Update Expo app.json with billing permissions
- [ ] Run prebuild for iOS and Android

### 2. Product IDs & Mapping
- [ ] Create shared `config/iapProducts.ts` with platform-specific IDs
- [ ] Map existing product IDs to new native format
- [ ] Update token amounts mapping

### 3. Client Implementation
- [ ] Create `mobile-shell/src/hooks/useIAP.ts` hook
- [ ] Implement purchase flow with proper finishTransaction logic
- [ ] Add restore purchases functionality
- [ ] Handle subscription vs consumable products

### 4. UI Updates
- [ ] Update paywall screen to use new IAP hook
- [ ] Update debug-purchases screen for native IAP
- [ ] Add error handling and loading states
- [ ] Test purchase flow UI

### 5. Server Implementation
- [ ] Install `googleapis@latest` for Google Play verification
- [ ] Install `node-fetch@^3` for Apple verification
- [ ] Create `/api/iap/verify-purchase` endpoint
- [ ] Implement idempotency checks (transaction_id)
- [ ] Update token granting logic

### 6. Google Play Verification
- [ ] Create `server/services/googleVerify.ts`
- [ ] Implement product (consumable) verification
- [ ] Implement subscription verification
- [ ] Add service account authentication

### 7. Apple App Store Verification
- [ ] Create `server/services/appleVerifyLegacy.ts`
- [ ] Implement receipt verification (production + sandbox)
- [ ] Handle status codes (21007 for sandbox)
- [ ] Parse receipt data

### 8. Database Schema Updates
- [ ] Review existing `token_ledger` table structure
- [ ] Add `subscriptions` table for subscription tracking
- [ ] Update `profiles` table with plan fields
- [ ] Create `increment_tokens` RPC if not exists
- [ ] Test with sample data

### 9. Webhook Implementation
- [ ] Create `server/routes/webhooks/google-rtdn.ts` (Google Real-time Developer Notifications)
- [ ] Create `server/routes/webhooks/apple-asn.ts` (Apple App Store Server Notifications V2)
- [ ] Update subscription status on renewal/cancellation
- [ ] Add webhook signature verification

### 10. Testing & QA
- [ ] Document test accounts setup (iOS Sandbox, Android License Testers)
- [ ] Test consumable purchase flow (tokens)
- [ ] Test subscription purchase flow
- [ ] Test restore purchases
- [ ] Test server verification success/failure paths
- [ ] Test finishTransaction logic
- [ ] Test idempotency (retry scenarios)

## New Product Architecture

### Recommended Product Structure
We should keep your existing subscription model but clarify the structure:

**Option A: Keep Monthly Subscriptions (Current)**
- All products are auto-renewing monthly subscriptions
- Users get tokens monthly as long as they're subscribed
- Tokens granted via webhook on INITIAL_PURCHASE and RENEWAL events

**Option B: Add One-Time Token Packs (New)**
- Add consumable products for one-time token purchases
- Example: `nailit.tokens.pack.1k`, `nailit.tokens.pack.5k`
- Keep subscriptions separate with monthly recurring tokens

**Recommendation**: Start with Option A (keep current model) to minimize changes, then add Option B later if needed.

### Product ID Naming Convention
```javascript
// iOS App Store
'nailit.starter.monthly'    // 120 tokens/month
'nailit.plus.monthly'       // 250 tokens/month
'nailit.pro.monthly'        // 480 tokens/month
'nailit.power.monthly'      // 1000 tokens/month

// Google Play Store
'nailit_starter_monthly'    // 120 tokens/month
'nailit_plus_monthly'       // 250 tokens/month
'nailit_pro_monthly'        // 480 tokens/month
'nailit_power_monthly'      // 1000 tokens/month

// Optional: One-time packs (if adding consumables)
'nailit.tokens.1k'          // iOS
'nailit_tokens_1k'          // Android
```

## Environment Variables Required

### Server (.env)
```bash
# Existing
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...

# New - Google Play
GOOGLE_PACKAGE_NAME=com.yourcompany.nailit
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}

# New - Apple App Store
APPLE_SHARED_SECRET=...  # For subscription verification
# Optional: App Store Server API credentials (for future migration from legacy endpoint)
```

### Mobile (.env)
```bash
EXPO_PUBLIC_API_URL=https://your-api.example.com
```

## Technical Implementation Details

### Purchase Flow (Client)
1. User taps "Buy Subscription" button
2. `useIAP` hook calls `requestSubscription()` with product SKU
3. OS shows native purchase dialog
4. Purchase completes → `purchaseUpdatedListener` fires
5. Client sends purchase data to `/api/iap/verify-purchase`
6. Server verifies with Apple/Google and returns `{ ok: true, isConsumable: false }`
7. Client calls `finishTransaction()` to acknowledge purchase
8. Tokens are granted on server side

### Server Verification Flow
1. Receive purchase data from client
2. Verify with Google Play / Apple App Store API
3. Check idempotency (transaction_id in token_ledger)
4. Grant tokens via `sp_grant_tokens` RPC
5. Update subscription status in database
6. Return success/failure to client

### Idempotency Strategy
- Use `transaction_id` (iOS) or `orderId` (Android) as unique key
- Store in `token_ledger.transaction_id` field
- Check before granting tokens to prevent double-grants
- Essential for retry scenarios and webhook processing

## Non-Code Tasks (Manual Setup Required)

### 1. Create Products in App Stores
**iOS (App Store Connect)**
- Navigate to: App Store Connect → Your App → In-App Purchases
- Create 4 auto-renewable subscriptions:
  - `nailit.starter.monthly` ($X.XX/month)
  - `nailit.plus.monthly` ($X.XX/month)
  - `nailit.pro.monthly` ($X.XX/month)
  - `nailit.power.monthly` ($X.XX/month)
- Set subscription group, pricing, descriptions, screenshots
- Submit for review

**Android (Play Console)**
- Navigate to: Play Console → Your App → Monetize → Subscriptions
- Create 4 subscriptions with base plans:
  - `nailit_starter_monthly`
  - `nailit_plus_monthly`
  - `nailit_pro_monthly`
  - `nailit_power_monthly`
- Set pricing, billing period (monthly), descriptions
- Activate products

### 2. Test Users Setup
**iOS Sandbox Testers**
- App Store Connect → Users and Access → Sandbox Testers
- Create test Apple IDs for different countries/regions
- Sign in to Settings → App Store → Sandbox Account on test device

**Android License Testers**
- Play Console → Settings → Developer account → License testing
- Add tester Gmail addresses
- Test users can make purchases without being charged

### 3. Google Cloud Service Account
**Create Service Account**
- Go to Google Cloud Console
- Create new service account or use existing
- Grant role: "Android Publisher" (or "Service Account User")
- Create and download JSON key

**Link to Play Console**
- Play Console → API access
- Link your Google Cloud project
- Grant access to your service account
- Required permissions: "View financial data" and "Manage orders"

**Add to Environment**
- Copy entire JSON content
- Set as `GOOGLE_SERVICE_ACCOUNT_JSON` environment variable (as string)

### 4. Apple Shared Secret
**For Legacy Receipt Verification**
- App Store Connect → Your App → In-App Purchases → App-Specific Shared Secret
- Generate shared secret
- Set as `APPLE_SHARED_SECRET` environment variable

**Future: App Store Server API (Recommended)**
- More secure than legacy receipt validation
- Requires generating API keys in App Store Connect
- Migration guide: https://developer.apple.com/documentation/appstoreserverapi

### 5. Expo Prebuild (If Using Expo Managed Workflow)
```bash
cd mobile-shell
npx expo prebuild --clean
```
This generates native `/ios` and `/android` folders with proper billing permissions.

### 6. Configure Webhooks (For Automated Renewal/Cancellation)
**Google Real-time Developer Notifications (RTDN)**
- Play Console → Monetize → Real-time developer notifications
- Set up Google Cloud Pub/Sub topic
- Configure push endpoint: `https://your-api.com/webhooks/google-rtdn`

**Apple App Store Server Notifications V2**
- App Store Connect → Your App → App Information → App Store Server Notifications
- Set URL: `https://your-api.com/webhooks/apple-asn`
- Configure for production and sandbox environments

## Testing Matrix

### iOS Sandbox Testing
| Scenario | Expected Result |
|----------|----------------|
| First-time subscription purchase | Purchase succeeds, tokens granted, finishTransaction called |
| Subscription already purchased | Shows "You're already subscribed" |
| Purchase cancelled by user | purchaseErrorListener fires, no tokens granted |
| Server verification fails | finishTransaction NOT called, purchase retries on next app start |
| Restore purchases | Returns active subscriptions |

### Android Testing
| Scenario | Expected Result |
|----------|----------------|
| First-time subscription purchase | Purchase succeeds, tokens granted, finishTransaction called |
| Purchase pending (card auth) | Purchase not finalized, retried later |
| Server verification fails | finishTransaction NOT called, purchase retries |
| Restore purchases | Returns active subscriptions |

### Edge Cases to Test
- [ ] Network error during verification
- [ ] Server returns 500 error
- [ ] Duplicate transaction_id (idempotency)
- [ ] App killed during purchase flow
- [ ] Subscription expires and renews
- [ ] User cancels subscription
- [ ] Restore on new device

## Rollback Plan

If native IAP doesn't work:
1. Revert to `main` branch
2. RevenueCat is still configured and working
3. No data loss (Supabase schema is backwards compatible)

## Migration Timeline Estimate

| Phase | Time Estimate |
|-------|--------------|
| Mobile app implementation | 2-3 hours |
| Server implementation | 2-3 hours |
| Product setup in stores | 1-2 hours |
| Service account & credentials | 1 hour |
| Testing (iOS + Android) | 3-4 hours |
| Webhook implementation | 2-3 hours |
| **Total** | **11-16 hours** |

## Success Criteria

- [ ] User can purchase subscription on iOS test device
- [ ] User can purchase subscription on Android test device
- [ ] Tokens are correctly granted after purchase
- [ ] Server verification prevents fraudulent purchases
- [ ] finishTransaction is called only after successful verification
- [ ] Restore purchases works on both platforms
- [ ] Idempotency prevents double-token grants
- [ ] Debug screen shows correct purchase state

## Post-Migration Tasks

- [ ] Monitor error logs for first 48 hours
- [ ] Set up Sentry/logging for IAP errors
- [ ] Configure webhooks for production
- [ ] Update RevenueCat dashboard to "paused" (don't delete)
- [ ] Document new IAP flow for team
- [ ] Create runbook for IAP troubleshooting
- [ ] Plan migration to App Store Server API (from legacy receipt validation)

## References

- [react-native-iap Documentation](https://github.com/dooboolab-community/react-native-iap)
- [Google Play Billing API](https://developer.android.com/google/play/billing)
- [Apple StoreKit](https://developer.apple.com/documentation/storekit)
- [App Store Server API](https://developer.apple.com/documentation/appstoreserverapi)
- [Google Play Developer API - Node.js](https://developers.google.com/android-publisher/api-ref/rest)
