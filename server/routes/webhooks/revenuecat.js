import crypto from 'crypto'

// Product token mapping (matching tokenPacks.js config)
const PRODUCT_TOKEN_MAP = {
  // Google Play Console product IDs (current)
  'starter_monthly': 120,
  'plus_monthly': 250,
  'pro_monthly': 480,
  'power_monthly': 1000,
  // iOS subscription products
  'tokens.starter': 120,
  'tokens.plus': 250,
  'tokens.pro': 480,
  'tokens.power': 1000,
  // Android subscription products (alternative format)
  'tokens_starter': 120,
  'tokens_plus': 250,
  'tokens_pro': 480,
  'tokens_power': 1000,
  // Legacy format for compatibility
  sub_starter_monthly: 120,
  sub_plus_monthly: 250,
  sub_pro_monthly: 480,
  sub_power_monthly: 1000,
}

/**
 * RevenueCat webhook handler for purchase events
 * Handles subscriptions and consumable purchases
 * 
 * TODO: Set up webhook in RevenueCat dashboard:
 * - URL: https://your-domain.com/webhooks/revenuecat
 * - Add authorization header: Bearer your-webhook-secret
 */
export async function handleRevenueCatWebhook(req, res, sbAdmin) {
  try {
    // Verify webhook signature/auth (optional but recommended)
    const authHeader = req.headers.authorization
    const expectedAuth = process.env.REVENUECAT_WEBHOOK_SECRET
    
    if (expectedAuth && authHeader !== expectedAuth) {
      console.error('RevenueCat webhook: Invalid authorization header')
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const webhookEvent = req.body
    const eventType = webhookEvent.event?.type
    const eventData = webhookEvent.event
    
    if (!eventType || !eventData) {
      console.error('RevenueCat webhook: Missing event data')
      return res.status(400).json({ error: 'Invalid webhook payload' })
    }

    console.log(`RevenueCat webhook received: ${eventType}`, {
      user_id: eventData.app_user_id,
      product_id: eventData.product_id
    })

    const userId = eventData.app_user_id
    const productId = eventData.product_id
    const transactionId = eventData.transaction_id || eventData.original_transaction_id
    
    if (!userId) {
      console.error('RevenueCat webhook: Missing app_user_id')
      return res.status(400).json({ error: 'Missing user ID' })
    }

    // Handle different event types
    switch (eventType) {
      case 'INITIAL_PURCHASE':
      case 'RENEWAL':
        await handleSubscriptionEvent(sbAdmin, userId, productId, transactionId, eventType)
        break
        
      case 'NON_RENEWING_PURCHASE':
        await handleConsumableEvent(sbAdmin, userId, productId, transactionId)
        break
        
      case 'CANCELLATION':
      case 'EXPIRATION':
        console.log(`Subscription ${eventType.toLowerCase()} for user ${userId}, product ${productId}`)
        // TODO: Update subscription status in your database if needed
        break
        
      default:
        console.log(`RevenueCat webhook: Unhandled event type: ${eventType}`)
    }

    res.status(200).json({ received: true })

  } catch (error) {
    console.error('RevenueCat webhook error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

async function handleSubscriptionEvent(sbAdmin, userId, productId, transactionId, eventType) {
  const tokens = PRODUCT_TOKEN_MAP[productId]
  
  if (!tokens) {
    console.error(`Unknown subscription product ID: ${productId}`)
    return
  }

  try {
    // Check if we've already processed this transaction (idempotency)
    const { data: existingLedger } = await sbAdmin
      .from('token_ledger')
      .select('id')
      .eq('transaction_id', transactionId)
      .single()

    if (existingLedger) {
      console.log(`Transaction ${transactionId} already processed`)
      return
    }

    // Grant tokens using your stored procedure
    const { data, error } = await sbAdmin.rpc('sp_grant_tokens', {
      p_user_id: userId,
      p_amount: tokens,
      p_reason: `revenuecat_${eventType.toLowerCase()}_${productId}`,
      p_metadata: {
        product_id: productId,
        transaction_id: transactionId,
        event_type: eventType,
        processed_at: new Date().toISOString()
      }
    })

    if (error) {
      throw error
    }

    console.log(`Granted ${tokens} tokens to user ${userId} for ${productId} (${eventType})`)

    // Log the transaction for idempotency
    await sbAdmin
      .from('token_ledger')
      .update({
        transaction_id: transactionId,
        metadata: {
          revenuecat_event: eventType,
          product_id: productId
        }
      })
      .eq('user_id', userId)
      .eq('reason', `revenuecat_${eventType.toLowerCase()}_${productId}`)
      .order('created_at', { ascending: false })
      .limit(1)

  } catch (error) {
    console.error(`Failed to process subscription event for user ${userId}:`, error)
    throw error
  }
}

async function handleConsumableEvent(sbAdmin, userId, productId, transactionId) {
  const tokens = PRODUCT_TOKEN_MAP[productId]
  
  if (!tokens) {
    console.error(`Unknown consumable product ID: ${productId}`)
    return
  }

  try {
    // Check if we've already processed this transaction (idempotency)
    const { data: existingLedger } = await sbAdmin
      .from('token_ledger')
      .select('id')
      .eq('transaction_id', transactionId)
      .single()

    if (existingLedger) {
      console.log(`Transaction ${transactionId} already processed`)
      return
    }

    // Grant tokens for consumable purchase
    const { data, error } = await sbAdmin.rpc('sp_grant_tokens', {
      p_user_id: userId,
      p_amount: tokens,
      p_reason: `revenuecat_consumable_${productId}`,
      p_metadata: {
        product_id: productId,
        transaction_id: transactionId,
        processed_at: new Date().toISOString()
      }
    })

    if (error) {
      throw error
    }

    console.log(`Granted ${tokens} tokens to user ${userId} for consumable ${productId}`)

    // Log the transaction for idempotency
    await sbAdmin
      .from('token_ledger')
      .update({
        transaction_id: transactionId,
        metadata: {
          revenuecat_event: 'NON_RENEWING_PURCHASE',
          product_id: productId
        }
      })
      .eq('user_id', userId)
      .eq('reason', `revenuecat_consumable_${productId}`)
      .order('created_at', { ascending: false })
      .limit(1)

  } catch (error) {
    console.error(`Failed to process consumable event for user ${userId}:`, error)
    throw error
  }
}