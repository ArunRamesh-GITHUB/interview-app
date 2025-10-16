import express from 'express'
import { z } from 'zod'
import { verifyGooglePurchase } from '../services/googleVerify.js'
import { verifyAppleReceipt, parseMostRecentTransaction } from '../services/appleVerifyLegacy.js'
import { isSubscription, tokensForProduct, planTierForProduct } from '../../config/iapProducts.js'

const router = express.Router()

// Validation schemas
const VerifyPurchaseSchema = z.object({
  userId: z.string().uuid(),
  platform: z.enum(['ios', 'android']),
  productId: z.string(),
  orderId: z.string().optional(),
  transactionReceipt: z.string().optional(), // iOS base64 receipt
  purchaseToken: z.string().optional(), // Android purchase token
  packageName: z.string().optional(), // Android package name
})

const RestorePurchasesSchema = z.object({
  userId: z.string().uuid(),
  platform: z.enum(['ios', 'android']),
  purchases: z.array(
    z.object({
      productId: z.string(),
      transactionId: z.string().optional(),
      transactionReceipt: z.string().optional(),
      purchaseToken: z.string().optional(),
    })
  ),
})

/**
 * POST /api/iap/verify-purchase
 * Verify a purchase with Apple or Google and grant tokens/subscription
 */
router.post('/verify-purchase', express.json(), async (req, res) => {
  try {
    // Validate input
    const input = VerifyPurchaseSchema.parse(req.body)

    console.log('[IAP] Verify purchase request:', {
      userId: input.userId,
      platform: input.platform,
      productId: input.productId,
    })

    // Get Supabase admin client from request (set by middleware in server.js)
    const sbAdmin = req.sbAdmin

    if (!sbAdmin) {
      console.error('[IAP] Supabase admin client not available')
      return res.status(500).json({
        ok: false,
        error: 'Server configuration error',
      })
    }

    // Verify with platform store
    let verificationResult

    if (input.platform === 'android') {
      if (!input.purchaseToken) {
        return res.status(400).json({
          ok: false,
          error: 'Missing purchaseToken for Android',
        })
      }

      const packageName = input.packageName || process.env.GOOGLE_PACKAGE_NAME
      if (!packageName) {
        console.error('[IAP] GOOGLE_PACKAGE_NAME not configured')
        return res.status(500).json({
          ok: false,
          error: 'Server configuration error',
        })
      }

      verificationResult = await verifyGooglePurchase({
        packageName,
        productId: input.productId,
        purchaseToken: input.purchaseToken,
      })
    } else if (input.platform === 'ios') {
      if (!input.transactionReceipt) {
        return res.status(400).json({
          ok: false,
          error: 'Missing transactionReceipt for iOS',
        })
      }

      const password = process.env.APPLE_SHARED_SECRET
      if (!password) {
        console.error('[IAP] APPLE_SHARED_SECRET not configured')
        return res.status(500).json({
          ok: false,
          error: 'Server configuration error',
        })
      }

      verificationResult = await verifyAppleReceipt({
        receiptDataBase64: input.transactionReceipt,
        password,
      })
    } else {
      return res.status(400).json({
        ok: false,
        error: 'Invalid platform',
      })
    }

    // Check if verification succeeded
    if (!verificationResult.valid) {
      console.log('[IAP] Purchase verification failed:', verificationResult.error)
      return res.json({
        ok: false,
        error: verificationResult.error || 'Purchase verification failed',
      })
    }

    console.log('[IAP] Purchase verified successfully')

    // Check for idempotency (prevent double-granting)
    const transactionId = input.orderId || input.transactionReceipt?.substring(0, 50)

    if (transactionId) {
      const { data: existingLedger } = await sbAdmin
        .from('token_ledger')
        .select('id')
        .eq('transaction_id', transactionId)
        .maybeSingle()

      if (existingLedger) {
        console.log('[IAP] Transaction already processed:', transactionId)
        return res.json({
          ok: true,
          isConsumable: !isSubscription(input.productId),
          message: 'Purchase already processed',
        })
      }
    }

    const isSub = isSubscription(input.productId)
    const tokens = tokensForProduct(input.productId)
    const planTier = planTierForProduct(input.productId)

    if (isSub) {
      // Handle subscription purchase
      console.log('[IAP] Processing subscription:', {
        productId: input.productId,
        tokens,
        planTier,
      })

      // Update user's subscription status in profiles table
      const { error: profileError } = await sbAdmin
        .from('profiles')
        .update({
          plan: planTier,
          plan_active: true,
          plan_store: input.platform,
          plan_product_id: input.productId,
          plan_renews_at: verificationResult.expiryTime
            ? new Date(verificationResult.expiryTime).toISOString()
            : null,
        })
        .eq('id', input.userId)

      if (profileError) {
        console.error('[IAP] Failed to update profile:', profileError)
        return res.status(500).json({
          ok: false,
          error: 'Failed to update subscription status',
        })
      }

      // Grant tokens for initial subscription purchase
      if (tokens > 0) {
        const { error: tokenError } = await sbAdmin.rpc('sp_grant_tokens', {
          p_user_id: input.userId,
          p_amount: tokens,
          p_reason: `iap_subscription_${input.productId}`,
          p_metadata: {
            product_id: input.productId,
            platform: input.platform,
            transaction_id: transactionId,
            plan_tier: planTier,
            processed_at: new Date().toISOString(),
          },
        })

        if (tokenError) {
          console.error('[IAP] Failed to grant tokens:', tokenError)
          // Don't fail the request - subscription was still activated
        } else {
          console.log('[IAP] Granted', tokens, 'tokens for subscription')
        }
      }

      // Optionally: Insert into subscriptions table for tracking
      await sbAdmin.from('subscriptions').insert({
        user_id: input.userId,
        store: input.platform,
        product_id: input.productId,
        status: 'active',
        started_at: new Date().toISOString(),
        renews_at: verificationResult.expiryTime
          ? new Date(verificationResult.expiryTime).toISOString()
          : null,
        raw_payload: input,
      }).catch((err) => console.warn('[IAP] Failed to insert subscription record:', err))

      return res.json({
        ok: true,
        isConsumable: false,
        message: `${planTier.charAt(0).toUpperCase() + planTier.slice(1)} subscription activated!`,
        tokensGranted: tokens,
      })
    } else {
      // Handle consumable purchase (one-time token pack)
      console.log('[IAP] Processing consumable:', {
        productId: input.productId,
        tokens,
      })

      if (tokens > 0) {
        const { error: tokenError } = await sbAdmin.rpc('sp_grant_tokens', {
          p_user_id: input.userId,
          p_amount: tokens,
          p_reason: `iap_consumable_${input.productId}`,
          p_metadata: {
            product_id: input.productId,
            platform: input.platform,
            transaction_id: transactionId,
            processed_at: new Date().toISOString(),
          },
        })

        if (tokenError) {
          console.error('[IAP] Failed to grant tokens:', tokenError)
          return res.status(500).json({
            ok: false,
            error: 'Failed to grant tokens',
          })
        }

        console.log('[IAP] Granted', tokens, 'tokens for consumable')
      }

      return res.json({
        ok: true,
        isConsumable: true,
        message: `${tokens} tokens added to your account!`,
        tokensGranted: tokens,
      })
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('[IAP] Validation error:', error.errors)
      return res.status(400).json({
        ok: false,
        error: 'Invalid request data',
        details: error.errors,
      })
    }

    console.error('[IAP] Unexpected error:', error)
    return res.status(500).json({
      ok: false,
      error: 'Internal server error',
    })
  }
})

/**
 * POST /api/iap/restore-purchases
 * Restore and reconcile previous purchases
 */
router.post('/restore-purchases', express.json(), async (req, res) => {
  try {
    const input = RestorePurchasesSchema.parse(req.body)

    console.log('[IAP] Restore purchases request:', {
      userId: input.userId,
      platform: input.platform,
      purchaseCount: input.purchases.length,
    })

    const sbAdmin = req.sbAdmin

    if (!sbAdmin) {
      return res.status(500).json({
        ok: false,
        error: 'Server configuration error',
      })
    }

    // Process each purchase
    const results = []
    for (const purchase of input.purchases) {
      try {
        // Re-verify each purchase
        let verificationResult

        if (input.platform === 'android' && purchase.purchaseToken) {
          const packageName = process.env.GOOGLE_PACKAGE_NAME
          verificationResult = await verifyGooglePurchase({
            packageName,
            productId: purchase.productId,
            purchaseToken: purchase.purchaseToken,
          })
        } else if (input.platform === 'ios' && purchase.transactionReceipt) {
          const password = process.env.APPLE_SHARED_SECRET
          verificationResult = await verifyAppleReceipt({
            receiptDataBase64: purchase.transactionReceipt,
            password,
          })
        }

        if (verificationResult?.valid) {
          // If it's a subscription, update profile
          if (isSubscription(purchase.productId)) {
            const planTier = planTierForProduct(purchase.productId)
            await sbAdmin
              .from('profiles')
              .update({
                plan: planTier,
                plan_active: true,
                plan_store: input.platform,
                plan_product_id: purchase.productId,
              })
              .eq('id', input.userId)

            results.push({
              productId: purchase.productId,
              restored: true,
              type: 'subscription',
            })
          } else {
            results.push({
              productId: purchase.productId,
              restored: false,
              type: 'consumable',
              note: 'Consumables cannot be restored',
            })
          }
        }
      } catch (error) {
        console.error('[IAP] Failed to restore purchase:', error)
        results.push({
          productId: purchase.productId,
          restored: false,
          error: error.message,
        })
      }
    }

    return res.json({
      ok: true,
      results,
    })
  } catch (error) {
    console.error('[IAP] Restore error:', error)
    return res.status(500).json({
      ok: false,
      error: 'Failed to restore purchases',
    })
  }
})

export default router
