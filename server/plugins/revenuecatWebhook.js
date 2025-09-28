import express from 'express'
import { TOKEN_PACKS } from '../../config/tokenPacks.js'

export function mountRevenueCatWebhook(app, { sbAdmin }) {
  const raw = express.json({ type: '*/*' }) // RC posts JSON; no signature HMAC, we use Auth header
  
  app.post('/api/rc/webhook', raw, async (req, res) => {
    try {
      const auth = req.headers['authorization'] || ''
      if (auth !== process.env.REVENUECAT_WEBHOOK_AUTH) {
        return res.status(401).send('unauthorized')
      }

      const ev = req.body?.event || {}
      const type = ev?.type || ev?.event_type || ''
      const productId = ev?.product_id || ''
      const appUserId = ev?.app_user_id || ev?.app_user_id_rc || ev?.app_user_id_alias || null
      const store = ev?.store || ev?.store_name || 'unknown'
      const rcEventId = (req.body?.event_id || req.body?.id || '') + ':' + (ev?.original_transaction_id || ev?.transaction_id || productId)

      // We only grant tokens for non-subscription purchases (consumables) and one-off web purchases.
      const isConsumable = type === 'NON_RENEWING_PURCHASE' || type === 'NON_SUBSCRIPTION_PURCHASE'
      const isWebOneOff = type === 'INITIAL_PURCHASE' && store?.toLowerCase().includes('web')
      if (!isConsumable && !isWebOneOff) {
        return res.json({ ok: true, ignored: type })
      }

      // Map productId -> tokens (search across iOS/Android/Web IDs)
      let tokens = 0, packKey = null
      for (const [k, v] of Object.entries(TOKEN_PACKS)) {
        if ([v.productIdIOS, v.productIdAndroid, v.productIdWeb].includes(productId)) {
          tokens = v.tokens; packKey = k; break
        }
      }
      if (!tokens || !packKey) {
        return res.json({ ok: true, ignored: 'unknown_product' })
      }

      // Derive affiliate slug (bind-once model)
      let affiliate_slug = null
      if (appUserId) {
        const { data: prof } = await sbAdmin.from('profiles').select('referred_by').eq('id', appUserId).maybeSingle()
        affiliate_slug = prof?.referred_by || null
      }

      // Insert purchase row idempotently
      const purchaseRow = {
        user_id: appUserId,
        provider: store?.toLowerCase().includes('app_store') ? 'apple'
                 : store?.toLowerCase().includes('play_store') ? 'google'
                 : 'web',
        provider_tx_id: rcEventId,
        product_id: productId,
        tokens_granted: tokens,
        amount_cents: null,
        currency: null,
        affiliate_slug,
        commission_cents: 0,
        raw: req.body
      }
      
      const ins = await sbAdmin.from('purchases').insert(purchaseRow)
      const err = ins.error
      if (err && !String(err.message).includes('duplicate')) { 
        console.error('Purchase insert error:', err); 
        /* continue */ 
      }

      if (appUserId && tokens > 0) {
        const { error: gErr } = await sbAdmin.rpc('sp_grant_tokens', {
          p_user_id: appUserId,
          p_amount: tokens,
          p_reason: `rc_${packKey}`,
          p_metadata: { product_id: productId, rc_event: type }
        })
        if (gErr) {
          console.error('sp_grant_tokens error', gErr)
        }
      }
      
      res.json({ ok: true, granted: tokens, user: appUserId })
    } catch (e) {
      console.error('rc webhook error', e)
      res.json({ ok: true }) // ack to avoid retry storms
    }
  })
}