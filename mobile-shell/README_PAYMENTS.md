# Google Play Billing Integration with RevenueCat

This document provides a complete setup guide for Google Play Billing integration using RevenueCat in your React Native/Expo app.

## 🏗️ Architecture Overview

- **Frontend**: React Native with Expo Router
- **Payments**: RevenueCat SDK (with react-native-iap fallback)
- **Backend**: Node/Express with RevenueCat webhooks
- **Database**: Supabase with token system integration

## 📦 Product Configuration

### Subscription Products (Auto-renewing)
- `sub_starter_monthly` → 120 tokens/month
- `sub_plus_monthly` → 300 tokens/month  
- `sub_pro_monthly` → 600 tokens/month
- `sub_power_monthly` → 1000 tokens/month

### Consumable Products (One-time)
- `pack_50_tokens` → 50 tokens
- `pack_150_tokens` → 150 tokens
- `pack_400_tokens` → 400 tokens

## 🔧 Setup Instructions

### 1. Environment Variables

#### Server (.env)
```bash
# RevenueCat Webhook Authentication
REVENUECAT_WEBHOOK_SECRET=Bearer your-webhook-secret-here
```

#### Mobile App (.env)
```bash
# RevenueCat for Android Billing
REVENUECAT_API_KEY_ANDROID=rc_***REPLACE***
USE_DIRECT_IAP=false
```

### 2. RevenueCat Dashboard Setup

1. **Create RevenueCat Project**
   - Go to [RevenueCat Dashboard](https://app.revenuecat.com)
   - Create new project
   - Add Google Play Store integration

2. **Configure Products**
   Create the following products in RevenueCat:
   
   **Subscriptions:**
   - `sub_starter_monthly`
   - `sub_plus_monthly`
   - `sub_pro_monthly`
   - `sub_power_monthly`
   
   **Consumables:**
   - `pack_50_tokens`
   - `pack_150_tokens`
   - `pack_400_tokens`

3. **Create Offerings**
   - Create offering named "default"
   - Add packages:
     - `starter_monthly` → `sub_starter_monthly`
     - `plus_monthly` → `sub_plus_monthly`
     - `pro_monthly` → `sub_pro_monthly`
     - `power_monthly` → `sub_power_monthly`
     - `pack50` → `pack_50_tokens`
     - `pack150` → `pack_150_tokens`
     - `pack400` → `pack_400_tokens`

4. **Configure Entitlements**
   - Create entitlement named "premium"
   - Attach all subscription products to this entitlement

5. **Set up Webhooks**
   - URL: `https://your-domain.com/webhooks/revenuecat`
   - Authorization Header: `Bearer your-webhook-secret-here`
   - Events: Enable all purchase events

### 3. Google Play Console Setup

1. **Create Products in Google Play Console**
   
   **⚠️ Important**: Product IDs must match exactly:
   
   **Subscriptions** (In-app products → Subscriptions):
   - `sub_starter_monthly`
   - `sub_plus_monthly`
   - `sub_pro_monthly`
   - `sub_power_monthly`
   
   **Managed Products** (In-app products → Managed products):
   - `pack_50_tokens`
   - `pack_150_tokens`
   - `pack_400_tokens`

2. **Add Test Accounts**
   - Go to Setup → License testing
   - Add test Gmail accounts
   - Set license test response to "RESPOND_NORMALLY"

3. **Upload Signed AAB**
   - Build signed AAB (see build instructions below)
   - Upload to Internal Testing track
   - Wait for Google Play to process (~2 hours)

### 4. Build & Deploy

#### Generate Signed AAB for Google Play
```bash
# Navigate to mobile app directory
cd mobile-shell

# Install dependencies
npm install

# Update app.json version codes if needed
# android.versionCode should be incremented for each release

# Build production AAB using EAS
npx eas build --platform android --profile production

# Alternative: Build locally (requires Android Studio setup)
npx eas build --platform android --local
```

#### EAS Build Configuration
Ensure your `eas.json` contains:
```json
{
  "cli": {
    "version": ">= 7.8.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "aab"
      }
    }
  }
}
```

## 🧪 Testing Checklist

### Before Testing
- [ ] RevenueCat products configured
- [ ] Google Play Console products created and active
- [ ] Test accounts added to license testing
- [ ] AAB uploaded to Internal Testing track
- [ ] App processing completed (check Play Console)
- [ ] Test account joined internal testing track

### Test Scenarios
- [ ] Subscription purchase (starter_monthly)
- [ ] Consumable purchase (pack_50_tokens)
- [ ] Restore purchases on second device
- [ ] Subscription cancellation
- [ ] Token balance updates after purchase
- [ ] Zero-token banner appears/disappears
- [ ] Webhook receives and processes events

### Testing Commands
```bash
# Test server webhook locally
curl -X POST http://localhost:3001/webhooks/revenuecat \
  -H "Authorization: Bearer your-webhook-secret-here" \
  -H "Content-Type: application/json" \
  -d '{"event": {"type": "NON_RENEWING_PURCHASE", "app_user_id": "test-user", "product_id": "pack_50_tokens"}}'

# Check server logs for webhook processing
# Check Supabase token_ledger table for new entries
```

## 🔍 Troubleshooting

### Common Issues

**"Product not found" error**
- Verify product IDs match exactly between RevenueCat and Google Play
- Ensure products are active in Google Play Console
- Check that app is on test track with products activated

**Purchases not processing**
- Check webhook URL is reachable
- Verify webhook authentication header
- Check server logs for webhook errors
- Ensure Supabase sp_grant_tokens function exists

**"Authentication required" webhook error**
- Verify REVENUECAT_WEBHOOK_SECRET matches RevenueCat settings
- Ensure authorization header format: "Bearer your-secret"

**Build failures**
- Run `npx expo install --fix` to resolve dependency conflicts
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check EAS Build logs for specific errors

### Debug Tools

**Check RevenueCat Integration**
```javascript
// Add to PaywallScreen for debugging
useEffect(() => {
  purchaseService.getCustomerInfo().then(info => {
    console.log('Customer Info:', JSON.stringify(info, null, 2))
  })
}, [])
```

**Test Webhook Locally**
```bash
# Install ngrok for local testing
npx ngrok http 3001

# Use ngrok URL in RevenueCat webhook settings
# https://abc123.ngrok.io/webhooks/revenuecat
```

## 🔐 Security Notes

- Never commit RevenueCat API keys to version control
- Use environment variables for all secrets
- Implement proper webhook signature verification in production
- Regularly rotate webhook secrets
- Monitor webhook logs for suspicious activity

## 📱 App Integration Examples

### Check Token Balance Before Action
```javascript
import { useTokens, useTokenGuard } from '../hooks/useTokens'

function InterviewScreen() {
  const { balance } = useTokens(userId)
  const checkTokens = useTokenGuard(1)
  
  const startInterview = () => {
    const hasTokens = checkTokens(balance, () => {
      router.push('/paywall')
    })
    if (hasTokens) {
      // Start interview
    }
  }
}
```

### Add Zero Token Banner
```javascript
import ZeroTokenBanner from '../components/ZeroTokenBanner'

<ZeroTokenBanner
  visible={balance <= 0}
  currentTokens={balance}
  onBuyTokensPress={() => router.push('/paywall')}
/>
```

## 📊 Analytics & Monitoring

Monitor these metrics:
- Purchase conversion rates
- Subscription retention
- Token consumption patterns  
- Revenue per user
- Failed purchase attempts

## 🚀 Production Deployment

1. **Update Environment Variables**
   - Replace all placeholder values with production keys
   - Update webhook URLs to production domain

2. **RevenueCat Production Setup**
   - Switch to production environment in RevenueCat
   - Update API keys in mobile app
   - Test webhook with production server

3. **Google Play Release**
   - Upload signed AAB to Production track
   - Gradually rollout to 100% of users
   - Monitor crash reports and reviews

## 🔄 Maintenance

### Regular Tasks
- Monitor webhook health
- Update RevenueCat SDK quarterly
- Review subscription metrics monthly
- Test purchase flows after major updates
- Backup and monitor token transaction logs

---

**Need Help?** Check the [RevenueCat Documentation](https://docs.revenuecat.com/) or [Google Play Billing Guide](https://developer.android.com/google/play/billing/)