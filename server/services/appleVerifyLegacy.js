/**
 * Apple App Store Receipt Verification (Legacy Endpoint)
 *
 * This uses the legacy /verifyReceipt endpoint which still works and is fast to implement.
 * For future migration to App Store Server API, see:
 * https://developer.apple.com/documentation/appstoreserverapi
 *
 * @param {Object} params
 * @param {string} params.receiptDataBase64 - Base64-encoded receipt from iOS
 * @param {string} params.password - App-specific shared secret from App Store Connect
 * @returns {Promise<{valid: boolean, transactions?: any[], latestReceipt?: string}>}
 */
export async function verifyAppleReceipt({ receiptDataBase64, password }) {
  try {
    if (!password) {
      console.error('[Apple Verify] APPLE_SHARED_SECRET not configured')
      return { valid: false, error: 'Server configuration error' }
    }

    const requestBody = {
      'receipt-data': receiptDataBase64,
      password,
      'exclude-old-transactions': true,
    }

    console.log('[Apple Verify] Verifying receipt...')

    // Try production endpoint first
    let response = await fetch('https://buy.itunes.apple.com/verifyReceipt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    })

    let data = await response.json()

    console.log('[Apple Verify] Production response status:', data?.status)

    // Status 21007 means it's a sandbox receipt
    if (data?.status === 21007) {
      console.log('[Apple Verify] Sandbox receipt detected, retrying with sandbox endpoint...')
      response = await fetch('https://sandbox.itunes.apple.com/verifyReceipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })
      data = await response.json()
      console.log('[Apple Verify] Sandbox response status:', data?.status)
    }

    // Status codes:
    // 0 = Valid
    // 21000 = App Store could not read JSON
    // 21002 = receipt-data malformed
    // 21003 = receipt could not be authenticated
    // 21004 = shared secret doesn't match
    // 21005 = receipt server unavailable
    // 21006 = receipt valid but subscription expired
    // 21007 = sandbox receipt sent to production
    // 21008 = production receipt sent to sandbox
    // 21010 = receipt could not be authorized (customer may have refunded)

    if (data?.status === 0) {
      // Valid receipt
      const inApp = data?.receipt?.in_app || []
      const latestReceiptInfo = data?.latest_receipt_info || []
      const transactions = latestReceiptInfo.length > 0 ? latestReceiptInfo : inApp

      console.log('[Apple Verify] Valid receipt with', transactions.length, 'transaction(s)')

      return {
        valid: true,
        transactions,
        latestReceipt: data?.latest_receipt,
        pendingRenewalInfo: data?.pending_renewal_info,
      }
    } else if (data?.status === 21006) {
      // Receipt valid but subscription expired
      console.log('[Apple Verify] Subscription expired')
      return {
        valid: false,
        error: 'Subscription expired',
        transactions: data?.latest_receipt_info || [],
      }
    } else {
      console.error('[Apple Verify] Verification failed with status:', data?.status)
      return {
        valid: false,
        error: `Verification failed (status: ${data?.status})`,
      }
    }
  } catch (error) {
    console.error('[Apple Verify] Unexpected error:', error)
    return {
      valid: false,
      error: error.message || 'Verification failed',
    }
  }
}

/**
 * Parse the most recent transaction from Apple receipt data
 * @param {Array} transactions - Array of in_app transactions from receipt
 * @returns {Object} Most recent transaction with expiration date
 */
export function parseMostRecentTransaction(transactions) {
  if (!transactions || transactions.length === 0) {
    return null
  }

  // Sort by purchase_date_ms descending (most recent first)
  const sorted = [...transactions].sort((a, b) => {
    const aTime = parseInt(a.purchase_date_ms || '0', 10)
    const bTime = parseInt(b.purchase_date_ms || '0', 10)
    return bTime - aTime
  })

  const mostRecent = sorted[0]

  return {
    productId: mostRecent.product_id,
    transactionId: mostRecent.transaction_id,
    originalTransactionId: mostRecent.original_transaction_id,
    purchaseDate: parseInt(mostRecent.purchase_date_ms || '0', 10),
    expiresDate: mostRecent.expires_date_ms
      ? parseInt(mostRecent.expires_date_ms, 10)
      : null,
    isTrialPeriod: mostRecent.is_trial_period === 'true',
    cancellationDate: mostRecent.cancellation_date_ms
      ? parseInt(mostRecent.cancellation_date_ms, 10)
      : null,
  }
}
