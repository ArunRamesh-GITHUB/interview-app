import express from 'express'
import { z } from 'zod'
import { verifyGooglePurchase } from '../services/googleVerify.js'
import { verifyAppleReceipt } from '../services/appleVerifyLegacy.js'
import { ALLOWLIST, tokensFor, getProductLabel } from '../../config/iapProducts.js'

const router = express.Router()

// Validation schema
const VerifyPurchaseSchema = z.object({
  userId: z.string().uuid(),
  platform: z.enum(['ios', 'android']),
  productId: z.string(),
  orderId: z.string().optional(),
  transactionReceipt: z.string().optional(), // iOS base64 receipt
  purchaseToken: z.string().optional(), // Android purchase token
})

/**
 * POST /api/iap/verify-purchase
 * Verify a consumable purchase and grant tokens
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

    // Validate product ID is in allowlist
    if (!ALLOWLIST.has(input.productId)) {
      console.error('[IAP] Invalid product ID:', input.productId)
      return res.json({
        ok: false,
        error: 'Invalid product ID',
      })
    }

    // Get Supabase admin client from request
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

      const packageName = process.env.GOOGLE_PACKAGE_NAME
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

    // Generate unique transaction key for idempotency
    const transactionKey =
      input.platform === 'ios'
        ? `ios_${input.orderId || input.transactionReceipt?.substring(0, 50)}`
        : `android_${input.orderId || input.purchaseToken?.substring(0, 50)}`

    // Check for idempotency (prevent double-granting)
    const { data: existingPurchase } = await sbAdmin
      .from('purchases')
      .select('id')
      .eq('transaction_key', transactionKey)
      .maybeSingle()

    if (existingPurchase) {
      console.log('[IAP] Purchase already processed:', transactionKey)
      return res.json({
        ok: true,
        message: 'Purchase already processed',
        tokensGranted: 0,
      })
    }

    // Get token amount for this product
    const tokens = tokensFor(input.productId)

    if (tokens === 0) {
      console.error('[IAP] Unknown product ID:', input.productId)
      return res.json({
        ok: false,
        error: 'Unknown product',
      })
    }

    // Record the purchase in database
    const { error: purchaseInsertError } = await sbAdmin.from('purchases').insert({
      user_id: input.userId,
      platform: input.platform,
      product_id: input.productId,
      transaction_key: transactionKey,
      raw_payload: input,
    })

    if (purchaseInsertError) {
      // Check if it's a duplicate key error (race condition)
      if (purchaseInsertError.code === '23505') {
        console.log('[IAP] Duplicate purchase detected (race condition):', transactionKey)
        return res.json({
          ok: true,
          message: 'Purchase already processed',
          tokensGranted: 0,
        })
      }

      console.error('[IAP] Failed to record purchase:', purchaseInsertError)
      return res.status(500).json({
        ok: false,
        error: 'Failed to record purchase',
      })
    }

    // Grant tokens
    const { error: tokenError } = await sbAdmin.rpc('increment_tokens', {
      user_id: input.userId,
      add_tokens: tokens,
    })

    if (tokenError) {
      console.error('[IAP] Failed to grant tokens:', tokenError)
      return res.status(500).json({
        ok: false,
        error: 'Failed to grant tokens',
      })
    }

    console.log('[IAP] Granted', tokens, 'tokens for', input.productId)

    const productLabel = getProductLabel(input.productId)

    return res.json({
      ok: true,
      message: `${productLabel} pack purchased! ${tokens} tokens added.`,
      tokensGranted: tokens,
    })
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

export default router
