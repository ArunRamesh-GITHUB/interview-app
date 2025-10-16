import express from 'express'
import { STARTER_PACK } from '../../config/iapProducts.js'

const router = express.Router()

/**
 * POST /api/starter/grant-once
 * Auto-grant 20 free starter tokens on first signup
 * This is called once after user login (client-side check or server trigger)
 */
router.post('/starter/grant-once', express.json(), async (req, res) => {
  try {
    const { userId } = req.body

    if (!userId) {
      return res.status(400).json({ ok: false, error: 'userId required' })
    }

    // Get Supabase admin client
    const sbAdmin = req.sbAdmin

    if (!sbAdmin) {
      console.error('[Starter] Supabase admin client not available')
      return res.status(500).json({ ok: false, error: 'Server configuration error' })
    }

    // Check if starter tokens already granted
    const { data: existing } = await sbAdmin
      .from('purchases')
      .select('id')
      .eq('user_id', userId)
      .eq('product_id', STARTER_PACK.productId)
      .limit(1)
      .maybeSingle()

    if (existing) {
      console.log('[Starter] Tokens already granted for user:', userId)
      return res.json({ ok: true, granted: false, message: 'Starter tokens already granted' })
    }

    // Record the starter "purchase" (free)
    const { error: purchaseError } = await sbAdmin.from('purchases').insert({
      user_id: userId,
      platform: 'web',
      product_id: STARTER_PACK.productId,
      transaction_key: `starter-${userId}`,
      raw_payload: { reason: 'auto-grant', tokens: STARTER_PACK.tokens },
    })

    if (purchaseError) {
      // Check for duplicate (race condition)
      if (purchaseError.code === '23505') {
        console.log('[Starter] Duplicate detected (race condition):', userId)
        return res.json({ ok: true, granted: false, message: 'Starter tokens already granted' })
      }

      console.error('[Starter] Failed to record starter grant:', purchaseError)
      return res.status(500).json({ ok: false, error: 'Failed to record starter grant' })
    }

    // Grant the tokens
    const { error: tokenError } = await sbAdmin.rpc('increment_tokens', {
      user_id: userId,
      add_tokens: STARTER_PACK.tokens,
    })

    if (tokenError) {
      console.error('[Starter] Failed to grant tokens:', tokenError)
      return res.status(500).json({ ok: false, error: 'Failed to grant tokens' })
    }

    console.log('[Starter] Granted', STARTER_PACK.tokens, 'tokens to user:', userId)

    return res.json({
      ok: true,
      granted: true,
      message: `${STARTER_PACK.tokens} free starter tokens added to your account!`,
      tokens: STARTER_PACK.tokens,
    })
  } catch (error) {
    console.error('[Starter] Unexpected error:', error)
    return res.status(500).json({ ok: false, error: 'Internal server error' })
  }
})

export default router
