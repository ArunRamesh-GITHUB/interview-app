# Native IAP QA Testing Checklist

## Pre-Testing Setup

### Environment Configuration

- [ ] Set `EXPO_PUBLIC_API_URL` in mobile app `.env`
- [ ] Set `GOOGLE_PACKAGE_NAME` in server `.env`
- [ ] Set `GOOGLE_SERVICE_ACCOUNT_JSON` in server `.env` (full JSON string)
- [ ] Set `APPLE_SHARED_SECRET` in server `.env`

### Store Configuration

#### iOS (App Store Connect)
- [ ] Products created with correct IDs (nailit.starter.monthly, etc.)
- [ ] Products submitted for review
- [ ] Sandbox tester Apple ID created
- [ ] Sandbox tester signed in on test device (Settings → App Store)

#### Android (Play Console)
- [ ] Subscription products created (nailit_starter_monthly, etc.)
- [ ] Products activated
- [ ] License tester Gmail added (Settings → License testing)
- [ ] Google service account created and linked
- [ ] Service account has Android Publisher role

### Database Setup
- [ ] Run `supabase/migrations/2025-10-16-native-iap.sql` in Supabase SQL Editor
- [ ] Verify `profiles` table has `plan`, `plan_active`, `plan_store`, `plan_product_id`, `plan_renews_at` columns
- [ ] Verify `subscriptions` table exists
- [ ] Verify `increment_tokens` function exists

### Build Setup
- [ ] Run `cd mobile-shell && npx expo prebuild` (if using Expo Managed)
- [ ] Verify native folders generated: `/ios` and `/android`
- [ ] Build app for testing (TestFlight for iOS, Internal Testing for Android)

## iOS Testing

### Sandbox Environment Setup
- [ ] Device signed into Sandbox account (Settings → App Store)
- [ ] App installed from TestFlight or local development build
- [ ] User logged into app with test account

### Purchase Flow Tests

#### Test 1: First-Time Subscription Purchase (Starter)
1. [ ] Launch app, navigate to paywall
2. [ ] Tap "Buy Starter Monthly" button
3. [ ] Native purchase dialog appears
4. [ ] Complete purchase with Sandbox account
5. [ ] **Expected**: Purchase completes, success message shown
6. [ ] Check server logs for `/api/iap/verify-purchase` call
7. [ ] Check Supabase `profiles` table:
   - [ ] `plan = 'starter'`
   - [ ] `plan_active = true`
   - [ ] `plan_store = 'ios'`
   - [ ] `plan_product_id = 'nailit.starter.monthly'`
8. [ ] Check Supabase `token_ledger` table for token grant (if using sp_grant_tokens)

#### Test 2: Already Purchased Subscription
1. [ ] Try to purchase same subscription again
2. [ ] **Expected**: iOS shows "You're already subscribed" message
3. [ ] No duplicate charges in server logs

#### Test 3: User Cancels Purchase
1. [ ] Start purchase flow
2. [ ] Tap "Cancel" in iOS purchase dialog
3. [ ] **Expected**: No error alert shown, user returns to paywall
4. [ ] No charges or database updates

#### Test 4: Server Verification Fails (Simulated)
1. [ ] Temporarily disable `APPLE_SHARED_SECRET` in server `.env`
2. [ ] Attempt purchase
3. [ ] **Expected**: Purchase completes on device but server returns `ok: false`
4. [ ] **Expected**: `finishTransaction` NOT called
5. [ ] **Expected**: Purchase retries on next app start
6. [ ] Re-enable `APPLE_SHARED_SECRET` and restart app
7. [ ] **Expected**: Pending purchase processes automatically and tokens granted

#### Test 5: Restore Purchases
1. [ ] Uninstall app
2. [ ] Reinstall app
3. [ ] Log in with same account
4. [ ] Tap "Restore Purchases" button
5. [ ] **Expected**: Previous subscription restored
6. [ ] **Expected**: `profiles` table updated with subscription status

### Network Edge Cases

#### Test 6: Network Error During Verification
1. [ ] Enable airplane mode after purchase dialog
2. [ ] Complete purchase
3. [ ] **Expected**: Purchase held in queue
4. [ ] Disable airplane mode
5. [ ] Restart app
6. [ ] **Expected**: Purchase auto-processes

#### Test 7: App Killed During Purchase
1. [ ] Start purchase
2. [ ] Force-quit app immediately after purchase completes
3. [ ] Restart app
4. [ ] **Expected**: Purchase processes on next start

## Android Testing

### License Tester Setup
- [ ] Gmail added as license tester in Play Console
- [ ] App installed from Play Store (Internal Testing track)
- [ ] User logged into app with test account

### Purchase Flow Tests

#### Test 8: First-Time Subscription Purchase (Plus)
1. [ ] Launch app, navigate to paywall
2. [ ] Tap "Buy Plus Monthly" button
3. [ ] Google Play purchase dialog appears
4. [ ] Complete purchase with test card
5. [ ] **Expected**: Purchase completes, success message shown
6. [ ] Check server logs for `/api/iap/verify-purchase` call
7. [ ] Check Supabase `profiles` table:
   - [ ] `plan = 'plus'`
   - [ ] `plan_active = true`
   - [ ] `plan_store = 'android'`
   - [ ] `plan_product_id = 'nailit_plus_monthly'`

#### Test 9: Purchase Pending (Card Authorization)
1. [ ] Use test card that requires authorization
2. [ ] Start purchase
3. [ ] **Expected**: Purchase state = pending
4. [ ] **Expected**: Purchase processes after authorization

#### Test 10: Restore Purchases (Android)
1. [ ] Clear app data (Settings → Apps → NailIT → Clear Data)
2. [ ] Launch app and log in
3. [ ] Tap "Restore Purchases"
4. [ ] **Expected**: Active subscriptions restored
5. [ ] **Expected**: Database updated

## Server-Side Testing

### API Endpoint Tests

#### Test 11: Verify Purchase Endpoint (Manual API Call)
```bash
curl -X POST https://your-api.com/api/iap/verify-purchase \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-uuid",
    "platform": "ios",
    "productId": "nailit.starter.monthly",
    "transactionReceipt": "base64-receipt-data"
  }'
```
- [ ] Returns `{ ok: true, isConsumable: false, tokensGranted: 120 }`
- [ ] Database updated correctly

#### Test 12: Idempotency Check
1. [ ] Send same purchase verification twice
2. [ ] **Expected**: Second call returns success but doesn't grant tokens again
3. [ ] Check `token_ledger` for only ONE entry with same `transaction_id`

#### Test 13: Invalid Receipt (iOS)
- [ ] Send invalid base64 receipt to `/api/iap/verify-purchase`
- [ ] **Expected**: Returns `{ ok: false, error: "Verification failed" }`

#### Test 14: Invalid Purchase Token (Android)
- [ ] Send invalid purchase token to `/api/iap/verify-purchase`
- [ ] **Expected**: Returns `{ ok: false, error: "Unable to verify purchase" }`

## Integration Tests

### End-to-End Subscription Flow

#### Test 15: Complete User Journey (iOS)
1. [ ] New user registers
2. [ ] Starts interview (consumes tokens)
3. [ ] Runs out of tokens
4. [ ] Navigates to paywall
5. [ ] Purchases "Pro Monthly" subscription
6. [ ] Tokens granted (480 tokens)
7. [ ] Can continue interviewing
8. [ ] Check all database tables updated correctly

#### Test 16: Complete User Journey (Android)
1. [ ] Same steps as Test 15 but on Android device
2. [ ] Verify all steps complete successfully

## Cross-Platform Tests

#### Test 17: User Switches Devices (iOS → Android)
1. [ ] User subscribes on iOS
2. [ ] Logs in on Android device
3. [ ] **Expected**: Subscription status NOT transferred (subscriptions are platform-specific)
4. [ ] User must restore purchases or subscribe again on Android

#### Test 18: Multiple Products (Different Tiers)
1. [ ] User subscribes to "Starter" on iOS
2. [ ] User then subscribes to "Plus" on iOS
3. [ ] **Expected**: Higher tier (Plus) becomes active
4. [ ] Check `profiles.plan = 'plus'` and `plan_product_id = 'nailit.plus.monthly'`

## Error Handling Tests

#### Test 19: Missing Environment Variables
- [ ] Remove `APPLE_SHARED_SECRET` from server `.env`
- [ ] Attempt iOS purchase
- [ ] **Expected**: Server returns 500 with "Server configuration error"
- [ ] Client shows user-friendly error message

#### Test 20: Supabase RPC Function Missing
- [ ] Rename `sp_grant_tokens` function temporarily
- [ ] Attempt purchase
- [ ] **Expected**: Server returns 500 error
- [ ] Purchase NOT finalized, will retry

#### Test 21: Google Service Account Invalid
- [ ] Set invalid `GOOGLE_SERVICE_ACCOUNT_JSON`
- [ ] Attempt Android purchase
- [ ] **Expected**: Verification fails, purchase NOT finalized

## Performance Tests

#### Test 22: Concurrent Purchases
1. [ ] Two users purchase at same time
2. [ ] **Expected**: Both purchases process correctly
3. [ ] No race conditions or deadlocks
4. [ ] Database records unique for each user

#### Test 23: High-Frequency Retries
1. [ ] Simulate failed verification 10 times
2. [ ] **Expected**: Purchase retries don't cause duplicate grants
3. [ ] Idempotency prevents double-charging

## Cleanup & Validation

#### Test 24: Data Integrity Check
- [ ] Run SQL query to check for orphaned records:
```sql
SELECT * FROM subscriptions WHERE user_id NOT IN (SELECT id FROM profiles);
```
- [ ] Should return 0 rows

#### Test 25: Token Ledger Accuracy
- [ ] Sum all token grants for test user
- [ ] Compare with `profiles.tokens` balance
- [ ] Should match

## Production Readiness

- [ ] All 25 tests pass
- [ ] Error logging configured (Sentry/CloudWatch)
- [ ] RevenueCat integration paused (not deleted yet)
- [ ] Webhook endpoints documented for future implementation
- [ ] Rollback plan documented
- [ ] Team trained on new IAP flow

## Post-Launch Monitoring (First 48 Hours)

- [ ] Monitor `/api/iap/verify-purchase` success rate (should be >95%)
- [ ] Check for `finishTransaction` failures
- [ ] Monitor token grant accuracy
- [ ] Check for duplicate transactions
- [ ] Review user feedback on purchase experience

## Known Limitations

- Subscriptions are platform-specific (iOS ≠ Android)
- Renewals require webhook implementation (placeholder added)
- Legacy receipt verification (not App Store Server API yet)
- No automated subscription status polling (requires webhooks)

## Troubleshooting Guide

### Issue: Purchase completes but tokens not granted
**Check:**
1. Server logs for `/api/iap/verify-purchase` errors
2. `APPLE_SHARED_SECRET` or `GOOGLE_SERVICE_ACCOUNT_JSON` configured
3. `sp_grant_tokens` function exists in Supabase
4. `token_ledger` table has correct schema

### Issue: finishTransaction never called
**Check:**
1. Server returned `{ ok: true }`
2. No network errors during verification
3. `purchaseUpdatedListener` is active

### Issue: Duplicate token grants
**Check:**
1. `transaction_id` stored in `token_ledger`
2. Idempotency check working correctly
3. No race conditions in concurrent requests
