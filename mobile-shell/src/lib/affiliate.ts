import React from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Branch.io configuration
// NOTE: Branch keys are configured in native files:
// - iOS: Info.plist (branch_key dict)  
// - Android: AndroidManifest.xml (io.branch.sdk.BranchKey meta-data)
const BRANCH_CONFIG = {
  // Deep link path pattern: /r/{slug} or /{slug}
  REFERRAL_PATH_PATTERN: /\/r\/([^/?#]+)/,
  // Storage keys
  PENDING_AFFILIATE_KEY: 'pending_affiliate_slug',
  ATTRIBUTION_DONE_KEY: 'attribution_complete',
}

/**
 * Capture affiliate slug from Branch.io deep links
 * Call this hook once in a root component (e.g., App.tsx)
 */
export function useCaptureAffiliateSlug() {
  React.useEffect(() => {
    let subscription: (() => void) | null = null

    const initBranch = async () => {
      try {
        // Dynamic import to handle case where Branch isn't installed yet
        const branch = await import('react-native-branch').then(m => m.default).catch(() => null)

        if (!branch) {
          console.log('📱 Branch.io SDK not available - using manual referral codes only')
          return
        }

        // Subscribe to Branch deep link events
        subscription = branch.subscribe(({ error, params }) => {
          if (error) {
            console.warn('⚠️ Branch subscription error:', error)
            return
          }

          if (!params) return

          // Log the params for debugging
          if (__DEV__) {
            console.log('🔗 Branch params received:', JSON.stringify(params, null, 2))
          }

          // Extract affiliate slug from various possible locations
          let affiliateSlug: string | null = null

          // Method 1: Direct affiliate_slug parameter (from Branch link data)
          if (params?.affiliate_slug) {
            affiliateSlug = String(params.affiliate_slug)
          }

          // Method 2: Extract from referring link URL
          if (!affiliateSlug) {
            const referringLink = params?.['~referring_link'] || params?.['$canonical_url'] || ''
            const match = String(referringLink).match(BRANCH_CONFIG.REFERRAL_PATH_PATTERN)
            if (match?.[1]) {
              affiliateSlug = match[1]
            }
          }

          // Method 3: Custom data field
          if (!affiliateSlug && params?.ref) {
            affiliateSlug = String(params.ref)
          }

          // Store the affiliate slug if found
          if (affiliateSlug) {
            console.log('✅ Captured affiliate slug from deep link:', affiliateSlug)
            AsyncStorage.setItem(BRANCH_CONFIG.PENDING_AFFILIATE_KEY, affiliateSlug)
            AsyncStorage.setItem('affiliate_source', 'deeplink')
          }
        })

        console.log('📱 Branch.io subscription active')
      } catch (e) {
        console.warn('⚠️ Branch initialization error:', e)
      }
    }

    initBranch()

    return () => {
      if (subscription) {
        subscription()
      }
    }
  }, [])
}

/**
 * Manually set a referral code (for onboarding flow)
 * @param code The referral/creator code entered by user
 */
export async function setManualReferralCode(code: string): Promise<void> {
  if (!code || code.trim().length === 0) return

  const cleanCode = code.trim().toLowerCase()
  await AsyncStorage.setItem(BRANCH_CONFIG.PENDING_AFFILIATE_KEY, cleanCode)
  await AsyncStorage.setItem('affiliate_source', 'manual')
  console.log('✅ Manual referral code set:', cleanCode)
}

/**
 * Get the pending affiliate slug (not yet sent to server)
 */
export async function getPendingAffiliateSlug(): Promise<string | null> {
  return await AsyncStorage.getItem(BRANCH_CONFIG.PENDING_AFFILIATE_KEY)
}

/**
 * Check if attribution has already been completed
 */
export async function isAttributionComplete(): Promise<boolean> {
  const done = await AsyncStorage.getItem(BRANCH_CONFIG.ATTRIBUTION_DONE_KEY)
  return done === 'true'
}

/**
 * Bind the pending affiliate to the current user (call after login)
 * This should be called once on first app open after signup/login
 * 
 * @param apiBase The API base URL
 * @returns Object with attribution result
 */
export async function bindAffiliateIfAny(apiBase: string): Promise<{
  attributed: boolean
  affiliateSlug?: string
  message?: string
}> {
  try {
    // Check if already attributed
    const alreadyDone = await isAttributionComplete()
    if (alreadyDone) {
      console.log('📱 Attribution already complete, skipping')
      return { attributed: false, message: 'Already attributed' }
    }

    // Get pending affiliate slug
    const affiliateSlug = await AsyncStorage.getItem(BRANCH_CONFIG.PENDING_AFFILIATE_KEY)
    if (!affiliateSlug) {
      console.log('📱 No pending affiliate slug found')
      return { attributed: false, message: 'No affiliate code' }
    }

    // Get source (deeplink or manual)
    const source = await AsyncStorage.getItem('affiliate_source') || 'manual'

    console.log(`📱 Attempting to attribute user to: ${affiliateSlug} (source: ${source})`)

    // Call the attribution endpoint
    const response = await fetch(`${apiBase}/api/affiliate/attribute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        affiliate_slug: affiliateSlug,
        source,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.warn('⚠️ Attribution request failed:', response.status, errorText)
      return { attributed: false, message: 'Server error' }
    }

    const result = await response.json()

    if (result.attributed) {
      console.log('✅ User successfully attributed to:', affiliateSlug)
      // Mark as complete so we don't try again
      await AsyncStorage.setItem(BRANCH_CONFIG.ATTRIBUTION_DONE_KEY, 'true')
      // Clear the pending slug
      await AsyncStorage.removeItem(BRANCH_CONFIG.PENDING_AFFILIATE_KEY)
      return { attributed: true, affiliateSlug }
    } else {
      console.log('📱 Attribution not applied:', result.message)
      // Still mark as complete (user already has an attribution)
      await AsyncStorage.setItem(BRANCH_CONFIG.ATTRIBUTION_DONE_KEY, 'true')
      return { attributed: false, message: result.message }
    }
  } catch (e: any) {
    console.error('❌ Attribution error:', e.message)
    return { attributed: false, message: e.message }
  }
}

/**
 * Check current user's attribution status from server
 * @param apiBase The API base URL
 */
export async function getAttributionStatus(apiBase: string): Promise<{
  attributed: boolean
  affiliateSlug?: string
  attributedAt?: string
  source?: string
}> {
  try {
    const response = await fetch(`${apiBase}/api/affiliate/attribution`, {
      method: 'GET',
      credentials: 'include',
    })

    if (!response.ok) {
      return { attributed: false }
    }

    const data = await response.json()
    return {
      attributed: data.attributed,
      affiliateSlug: data.affiliate_slug,
      attributedAt: data.attributed_at,
      source: data.source,
    }
  } catch (e) {
    console.warn('⚠️ Failed to get attribution status:', e)
    return { attributed: false }
  }
}

/**
 * Clear all affiliate data (for testing)
 */
export async function clearAffiliateData(): Promise<void> {
  await AsyncStorage.multiRemove([
    BRANCH_CONFIG.PENDING_AFFILIATE_KEY,
    BRANCH_CONFIG.ATTRIBUTION_DONE_KEY,
    'affiliate_source',
  ])
  console.log('🗑️ Affiliate data cleared')
}