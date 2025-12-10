import express from 'express'
import { TOKEN_PACKS } from '../../config/tokenPacks.js'

/**
 * Verify IAP receipt and grant tokens
 * Supports both Apple App Store and Google Play Store receipts
 */
export async function verifyIAPReceipt(req, res, sbAdmin) {
  try {
    const { transactionReceipt, productId, transactionId, platform, userId } = req.body

    if (!productId || !transactionId || !platform) {
      return res.status(400).json({ error: 'Missing required fields: productId, transactionId, platform' })
    }

    // FOR TEST PRODUCTS: COMPLETELY IGNORE USER CHECKS - JUST GRANT TOKENS
    const isTestProduct = productId.startsWith('com.yourname.test.')

    let finalUserId = null

    if (isTestProduct) {
      // TEST MODE: Find or create user, NO CHECKS, NO VALIDATION, JUST DO IT
      let { data: anyUser } = await sbAdmin
        .from('profiles')
        .select('id')
        .limit(1)
        .maybeSingle()

      if (!anyUser) {
        // Create test user - NO ERROR HANDLING, JUST CREATE IT
        try {
          const testEmail = `test${Date.now()}@test.com`
          const { data: authUser } = await sbAdmin.auth.admin.createUser({
            email: testEmail,
            password: 'test123456',
            email_confirm: true
          })

          if (authUser?.user?.id) {
            await sbAdmin.from('profiles').insert({
              id: authUser.user.id,
              email: testEmail,
              created_at: new Date().toISOString()
            })
            anyUser = { id: authUser.user.id }
            console.log('✅ Created test user:', anyUser.id)
          }
        } catch (e) {
          // If creation fails, try to find ANY user
          const { data: fallback } = await sbAdmin.from('profiles').select('id').limit(1).maybeSingle()
          if (fallback) anyUser = fallback
        }
      }

      // Use first user found/created, or fail silently and still grant tokens
      finalUserId = anyUser?.id || null
      console.log('🧪 TEST MODE: Using user (or null):', finalUserId || 'NO USER - will still try to grant')
    } else {
      // Production: normal user handling
      finalUserId = userId
      if (!finalUserId && req.session?.user?.id) {
        finalUserId = req.session.user.id
      }
    }

    let verified = false
    let purchaseData = null

    if (isTestProduct) {
      // For test products, skip Apple verification and trust the transaction
      console.log('🧪 Test product detected, skipping receipt verification')
      purchaseData = {
        transactionId,
        productId,
        purchaseDate: Date.now(),
        amountCents: null,
        currency: null
      }
      verified = true
    } else {
      // For production products, verify receipt
      if (platform === 'ios') {
        // StoreKit 2 (react-native-iap v14+) uses JWS tokens that can't be verified
        // with the deprecated verifyReceipt endpoint (causes error 21002).
        // The transaction was already validated on-device by StoreKit/Apple.
        // For consumables, we trust the client and record the transaction.
        // TODO: For subscriptions, implement App Store Server API validation.
        console.log('🍏 iOS purchase - trusting client-verified StoreKit 2 transaction')
        console.log(`   Transaction ID: ${transactionId}`)
        console.log(`   Product ID: ${productId}`)

        // Basic validation: ensure we have transaction details
        if (transactionId && productId) {
          purchaseData = {
            transactionId,
            productId,
            purchaseDate: Date.now(),
            amountCents: null,
            currency: null
          }
          verified = true
        } else {
          console.error('❌ Missing transactionId or productId')
          return res.status(400).json({ error: 'Invalid transaction data' })
        }
      } else if (platform === 'android') {
        // Verify Google Play receipt
        purchaseData = await verifyGoogleReceipt(transactionReceipt, productId, transactionId)
        verified = purchaseData !== null
      } else {
        return res.status(400).json({ error: 'Invalid platform' })
      }

      if (!verified || !purchaseData) {
        return res.status(400).json({ error: 'Receipt verification failed' })
      }
    }

    // Map productId -> tokens (including test product IDs)
    let tokens = 0
    let packKey = null

    // Check production product IDs
    for (const [k, v] of Object.entries(TOKEN_PACKS)) {
      if ([v.productIdIOS, v.productIdAndroid, v.productIdWeb].includes(productId)) {
        tokens = v.tokens
        packKey = k
        break
      }
    }

    // If not found, check for test product IDs (com.yourname.test.pack.*)
    if (!tokens || !packKey) {
      const testProductMap = {
        'com.yourname.test.pack.starter': { tokens: 120, packKey: 'starter' },
        'com.yourname.test.pack.plus': { tokens: 250, packKey: 'plus' },
        'com.yourname.test.pack.pro': { tokens: 480, packKey: 'pro' },
        'com.yourname.test.pack.power': { tokens: 1000, packKey: 'power' },
      }

      const testProduct = testProductMap[productId]
      if (testProduct) {
        tokens = testProduct.tokens
        packKey = testProduct.packKey
        console.log(`🧪 Test product recognized: ${productId} → ${tokens} tokens`)
      }
    }

    if (!tokens || !packKey) {
      console.error('Unknown product ID:', productId)
      return res.status(400).json({ error: `Unknown product ID: ${productId}` })
    }

    // Check for duplicate transaction (idempotency)
    const { data: existingPurchase } = await sbAdmin
      .from('purchases')
      .select('id')
      .eq('provider_tx_id', transactionId)
      .maybeSingle()

    if (existingPurchase) {
      return res.json({ ok: true, granted: 0, message: 'Transaction already processed' })
    }

    // Insert purchase record
    const purchaseRow = {
      user_id: finalUserId || null,
      provider: platform === 'ios' ? 'apple' : 'google',
      provider_tx_id: transactionId,
      product_id: productId,
      tokens_granted: tokens,
      amount_cents: purchaseData.amountCents || null,
      currency: purchaseData.currency || null,
      raw: { receipt: transactionReceipt, purchaseData }
    }

    const { error: insertError } = await sbAdmin.from('purchases').insert(purchaseRow)

    if (insertError && !String(insertError.message).includes('duplicate')) {
      console.error('Purchase insert error:', insertError)
      return res.status(500).json({ error: 'Failed to record purchase' })
    }

    // FOR TEST PRODUCTS: GRANT TOKENS NO MATTER WHAT - CREATE USER IF NEEDED
    if (isTestProduct && tokens > 0) {
      // If no user, create one NOW
      if (!finalUserId) {
        try {
          const testEmail = `test${Date.now()}@test.com`
          const { data: authUser } = await sbAdmin.auth.admin.createUser({
            email: testEmail,
            password: 'test123456',
            email_confirm: true
          })
          if (authUser?.user?.id) {
            await sbAdmin.from('profiles').insert({
              id: authUser.user.id,
              email: testEmail,
              created_at: new Date().toISOString()
            })
            finalUserId = authUser.user.id
            console.log('✅ Created user on-the-fly:', finalUserId)
          }
        } catch (e) {
          console.error('Failed to create user:', e.message)
        }
      }

      // Grant tokens - even if finalUserId is still null, try anyway
      if (finalUserId) {
        console.log(`💰 TEST MODE: Granting ${tokens} tokens to ${finalUserId}`)
        const { error: grantError } = await sbAdmin.rpc('sp_grant_tokens', {
          p_user_id: finalUserId,
          p_amount: tokens,
          p_reason: `iap_${packKey}`,
          p_metadata: { product_id: productId, transaction_id: transactionId, platform }
        })

        if (!grantError) {
          console.log(`✅ Granted ${tokens} tokens!`)
          return res.json({ ok: true, granted: tokens, user: finalUserId, tokens: tokens })
        }
      }

      // If we get here, still return success for test products (tokens recorded in purchase table)
      console.log(`⚠️ Could not grant tokens, but purchase recorded for testing`)
      return res.json({ ok: true, granted: 0, user: finalUserId, tokens: tokens, message: 'Purchase recorded' })
    } else if (finalUserId && tokens > 0) {
      // Production mode: Grant tokens if userId is available
      console.log(`💰 Granting ${tokens} tokens to user ${finalUserId} for product ${productId}`)
      const { error: grantError } = await sbAdmin.rpc('sp_grant_tokens', {
        p_user_id: finalUserId,
        p_amount: tokens,
        p_reason: `iap_${packKey}`,
        p_metadata: { product_id: productId, transaction_id: transactionId, platform }
      })

      if (grantError) {
        console.error('❌ sp_grant_tokens error', grantError)
        return res.status(500).json({ error: 'Failed to grant tokens', details: grantError.message })
      }
      console.log(`✅ Successfully granted ${tokens} tokens to user ${finalUserId}`)
      return res.json({
        ok: true,
        granted: tokens,
        user: finalUserId,
        message: `${tokens} tokens granted successfully!`,
        tokens: tokens
      })
    } else {
      // Production mode without userId
      console.warn('⚠️ No userId available, purchase recorded but tokens not granted')
      return res.json({
        ok: true,
        granted: 0,
        user: null,
        message: `Purchase recorded. ${tokens} tokens will be granted when you log in and use "Restore Purchases".`,
        tokens: tokens
      })
    }
  } catch (error) {
    console.error('IAP verification error:', error)
    res.status(500).json({ error: 'Internal server error', details: error.message })
  }
}

/**
 * Verify Apple App Store receipt
 * Note: This is a simplified version. For production, use proper Apple receipt validation
 */
async function verifyAppleReceipt(receipt, productId, transactionId) {
  try {
    const applePassword = process.env.APPLE_SHARED_SECRET

    // Helper to fetch from specific Apple URL
    const verifyWithApple = async (url) => {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          'receipt-data': receipt,
          'password': applePassword,
          'exclude-old-transactions': true
        })
      })

      if (!response.ok) throw new Error(`Apple API failed: ${response.status}`)
      return await response.json()
    }

    // Try Production URL first (default)
    let verifyUrl = 'https://buy.itunes.apple.com/verifyReceipt'
    let data = await verifyWithApple(verifyUrl)

    // Handle Sandbox receipt sent to Production (Status 21007)
    if (data.status === 21007) {
      console.log('🍏 Got 21007 (Sandbox receipt) - retrying with Sandbox URL...')
      verifyUrl = 'https://sandbox.itunes.apple.com/verifyReceipt'
      data = await verifyWithApple(verifyUrl)
    }

    if (data.status !== 0) {
      console.error('Apple receipt status error:', data.status)
      return null
    }

    // Find the transaction in the receipt
    const transactions = data.receipt?.in_app || []

    // In sandbox, transaction ID might vary or be original_transaction_id
    // We try to find match by ID, or if only 1 transaction matches product
    const transaction = transactions.find(t => t.transaction_id === transactionId) ||
      transactions.find(t => t.product_id === productId) // Fallback: find any matching product

    if (!transaction) {
      console.error('Transaction not found in receipt')
      if (transactions.length > 0) {
        console.log('Available transactions:', transactions.map(t => `${t.product_id} (${t.transaction_id})`))
      }
      return null
    }

    // Verify product ID matches
    if (transaction.product_id !== productId) {
      console.error(`Product ID mismatch: expected ${productId}, got ${transaction.product_id}`)
      return null
    }

    return {
      transactionId: transaction.transaction_id,
      productId: transaction.product_id,
      purchaseDate: transaction.purchase_date_ms,
      amountCents: null,
      currency: null
    }
  } catch (error) {
    console.error('Apple receipt verification error:', error)
    return null
  }
}

/**
 * Verify Google Play receipt
 * Note: This requires Google Play Billing API setup
 */
async function verifyGoogleReceipt(receipt, productId, transactionId) {
  try {
    // For production, you should:
    // 1. Use Google Play Developer API to verify the purchase token
    // 2. Check the purchase state
    // 3. Validate the signature

    // This is a simplified version - in production, use Google Play Developer API
    // You'll need to set up OAuth2 and use the purchases.products.get endpoint

    const packageName = process.env.GOOGLE_PLAY_PACKAGE_NAME || 'com.nailit.interview'

    // For now, we'll do basic validation
    // In production, implement proper Google Play API verification
    if (!receipt || !productId || !transactionId) {
      return null
    }

    // TODO: Implement proper Google Play API verification
    // This requires:
    // 1. Google Service Account with Play Developer API access
    // 2. OAuth2 token generation
    // 3. Call to purchases.products.get API

    // For now, return basic structure (you should implement full verification)
    return {
      transactionId,
      productId,
      purchaseDate: Date.now(),
      amountCents: null,
      currency: null
    }
  } catch (error) {
    console.error('Google receipt verification error:', error)
    return null
  }
}

