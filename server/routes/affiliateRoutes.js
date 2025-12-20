import express from 'express'

/**
 * Affiliate Routes Module
 * Handles affiliate attribution, stats, and admin management
 */

/**
 * Mount affiliate routes on the Express app
 * @param {express.Application} app 
 * @param {object} options - { sbAdmin, currentUser, authRequired, requireServer }
 */
export function mountAffiliateRoutes(app, { sbAdmin, currentUser, authRequired, requireServer }) {

    // ==================== USER ENDPOINTS ====================

    /**
     * POST /api/affiliate/attribute
     * Capture user attribution (once, then locked)
     * Body: { affiliate_slug: string, source?: 'deeplink' | 'manual' }
     */
    app.post('/api/affiliate/attribute', authRequired, async (req, res) => {
        try {
            const user = currentUser(req)
            const { affiliate_slug, source = 'manual' } = req.body || {}

            if (!affiliate_slug) {
                return res.status(400).json({ error: 'affiliate_slug required' })
            }

            // Call stored procedure to attribute user (handles locking)
            const { data, error } = await sbAdmin.rpc('sp_attribute_user', {
                p_user_id: user.id,
                p_affiliate_slug: affiliate_slug,
                p_source: source
            })

            if (error) {
                console.error('Attribution error:', error)
                return res.status(500).json({ error: error.message })
            }

            res.json({ ok: true, ...data })
        } catch (e) {
            console.error('Attribution endpoint error:', e)
            res.status(500).json({ error: 'Attribution failed' })
        }
    })

    /**
     * GET /api/affiliate/me
     * Get current user's affiliate data (if they are an affiliate)
     */
    app.get('/api/affiliate/me', authRequired, async (req, res) => {
        try {
            const user = currentUser(req)

            // Check if user is an affiliate
            const { data: affiliate, error } = await sbAdmin
                .from('affiliates')
                .select('slug, display_name, status, commission_rate_bps, paypal_email, created_at')
                .eq('user_id', user.id)
                .maybeSingle()

            if (error) {
                console.error('Affiliate lookup error:', error)
                return res.status(500).json({ error: error.message })
            }

            if (!affiliate) {
                // Check if user has applied (pending status without user_id link)
                // For now, return not_applied
                return res.status(404).json({ status: 'not_applied' })
            }

            res.json({
                status: affiliate.status,
                code: affiliate.slug,
                display_name: affiliate.display_name,
                rate_bps: affiliate.commission_rate_bps,
                created_at: affiliate.created_at
            })
        } catch (e) {
            console.error('Get affiliate error:', e)
            res.status(500).json({ error: 'Failed to get affiliate data' })
        }
    })

    /**
     * GET /api/affiliate/me/stats
     * Get affiliate stats for current user (if they are an affiliate)
     */
    app.get('/api/affiliate/me/stats', authRequired, async (req, res) => {
        try {
            const user = currentUser(req)

            // Get user's affiliate slug
            const { data: affiliate } = await sbAdmin
                .from('affiliates')
                .select('slug')
                .eq('user_id', user.id)
                .eq('status', 'active')
                .maybeSingle()

            if (!affiliate) {
                return res.json({ clicks: 0, signups: 0, pending_cents: 0, paid_cents: 0 })
            }

            // Get stats via stored procedure
            const { data, error } = await sbAdmin.rpc('sp_get_affiliate_stats', {
                p_slug: affiliate.slug
            })

            if (error) {
                console.error('Stats error:', error)
                return res.status(500).json({ error: error.message })
            }

            res.json({
                clicks: 0, // Not tracked yet, would need Branch.io analytics or custom tracking
                signups: data?.attributed_users || 0,
                pending_cents: data?.pending_cents || 0,
                paid_cents: data?.paid_cents || 0
            })
        } catch (e) {
            console.error('Get stats error:', e)
            res.status(500).json({ error: 'Failed to get stats' })
        }
    })

    /**
     * POST /api/affiliate/apply
     * Apply to become an affiliate
     * Body: { paypal_email: string }
     */
    app.post('/api/affiliate/apply', authRequired, async (req, res) => {
        try {
            const user = currentUser(req)
            const { paypal_email } = req.body || {}

            if (!paypal_email) {
                return res.status(400).json({ error: 'paypal_email required' })
            }

            // Check if already an affiliate
            const { data: existing } = await sbAdmin
                .from('affiliates')
                .select('slug, status')
                .eq('user_id', user.id)
                .maybeSingle()

            if (existing) {
                return res.json({ ok: true, status: existing.status, code: existing.slug })
            }

            // Generate a slug from user id (first 8 chars)
            const slug = 'ref_' + user.id.replace(/-/g, '').substring(0, 8).toLowerCase()

            // Get user email for display name
            const { data: profile } = await sbAdmin
                .from('profiles')
                .select('email, username')
                .eq('id', user.id)
                .maybeSingle()

            const displayName = profile?.username || profile?.email?.split('@')[0] || 'Affiliate'

            // Insert new affiliate with pending status
            const { error: insertError } = await sbAdmin
                .from('affiliates')
                .insert({
                    slug,
                    display_name: displayName,
                    status: 'pending',
                    commission_rate_bps: 2000,
                    paypal_email,
                    user_id: user.id
                })

            if (insertError) {
                console.error('Affiliate insert error:', insertError)
                return res.status(500).json({ error: insertError.message })
            }

            res.json({ ok: true, status: 'pending', code: slug })
        } catch (e) {
            console.error('Apply error:', e)
            res.status(500).json({ error: 'Application failed' })
        }
    })

    /**
     * GET /api/affiliate/attribution
     * Check current user's attribution status
     */
    app.get('/api/affiliate/attribution', authRequired, async (req, res) => {
        try {
            const user = currentUser(req)

            const { data, error } = await sbAdmin
                .from('user_attribution')
                .select('affiliate_slug, attributed_at, source')
                .eq('user_id', user.id)
                .maybeSingle()

            if (error) {
                console.error('Attribution lookup error:', error)
                return res.status(500).json({ error: error.message })
            }

            if (!data) {
                return res.json({ attributed: false })
            }

            res.json({
                attributed: true,
                affiliate_slug: data.affiliate_slug,
                attributed_at: data.attributed_at,
                source: data.source
            })
        } catch (e) {
            console.error('Get attribution error:', e)
            res.status(500).json({ error: 'Failed to get attribution' })
        }
    })

    // ==================== ADMIN ENDPOINTS ====================

    /**
     * GET /api/affiliate/admin/list
     * List all affiliates (admin only)
     */
    app.get('/api/affiliate/admin/list', requireServer, async (req, res) => {
        try {
            const { data, error } = await sbAdmin
                .from('affiliates')
                .select('slug, display_name, status, commission_rate_bps, paypal_email, user_id, created_at, updated_at')
                .order('created_at', { ascending: false })
                .limit(100)

            if (error) {
                return res.status(500).json({ error: error.message })
            }

            res.json({ affiliates: data || [] })
        } catch (e) {
            console.error('List affiliates error:', e)
            res.status(500).json({ error: 'Failed to list affiliates' })
        }
    })

    /**
     * POST /api/affiliate/admin/create
     * Create a new affiliate (admin only)
     * Body: { slug, display_name, paypal_email?, user_id?, commission_rate_bps? }
     */
    app.post('/api/affiliate/admin/create', requireServer, async (req, res) => {
        try {
            const { slug, display_name, paypal_email, user_id, commission_rate_bps = 2000 } = req.body || {}

            if (!slug || !display_name) {
                return res.status(400).json({ error: 'slug and display_name required' })
            }

            const { data, error } = await sbAdmin.rpc('sp_create_affiliate', {
                p_slug: slug,
                p_display_name: display_name,
                p_paypal_email: paypal_email || null,
                p_user_id: user_id || null,
                p_commission_rate_bps: commission_rate_bps
            })

            if (error) {
                return res.status(500).json({ error: error.message })
            }

            res.json({ ok: true, ...data })
        } catch (e) {
            console.error('Create affiliate error:', e)
            res.status(500).json({ error: 'Failed to create affiliate' })
        }
    })

    /**
     * PUT /api/affiliate/admin/:slug/status
     * Update affiliate status (admin only)
     * Body: { status: 'active' | 'paused' | 'banned' }
     */
    app.put('/api/affiliate/admin/:slug/status', requireServer, async (req, res) => {
        try {
            const { slug } = req.params
            const { status } = req.body || {}

            if (!status || !['active', 'paused', 'banned', 'pending'].includes(status)) {
                return res.status(400).json({ error: 'Invalid status' })
            }

            const { data, error } = await sbAdmin.rpc('sp_update_affiliate_status', {
                p_slug: slug,
                p_status: status
            })

            if (error) {
                return res.status(500).json({ error: error.message })
            }

            res.json({ ok: true, ...data })
        } catch (e) {
            console.error('Update status error:', e)
            res.status(500).json({ error: 'Failed to update status' })
        }
    })

    /**
     * GET /api/affiliate/admin/:slug/stats
     * Get affiliate stats (admin only)
     */
    app.get('/api/affiliate/admin/:slug/stats', requireServer, async (req, res) => {
        try {
            const { slug } = req.params

            const { data, error } = await sbAdmin.rpc('sp_get_affiliate_stats', {
                p_slug: slug
            })

            if (error) {
                return res.status(500).json({ error: error.message })
            }

            res.json(data || { attributed_users: 0, purchases_count: 0, pending_cents: 0, paid_cents: 0 })
        } catch (e) {
            console.error('Get admin stats error:', e)
            res.status(500).json({ error: 'Failed to get stats' })
        }
    })

    /**
     * GET /api/affiliate/admin/commissions
     * List all pending commissions (admin only)
     */
    app.get('/api/affiliate/admin/commissions', requireServer, async (req, res) => {
        try {
            const status = req.query.status || 'pending'

            const { data, error } = await sbAdmin
                .from('affiliate_commissions')
                .select('*')
                .eq('status', status)
                .order('created_at', { ascending: false })
                .limit(100)

            if (error) {
                return res.status(500).json({ error: error.message })
            }

            res.json({ commissions: data || [] })
        } catch (e) {
            console.error('List commissions error:', e)
            res.status(500).json({ error: 'Failed to list commissions' })
        }
    })

    /**
     * POST /api/affiliate/admin/commissions/:id/pay
     * Mark a commission as paid (admin only)
     */
    app.post('/api/affiliate/admin/commissions/:id/pay', requireServer, async (req, res) => {
        try {
            const { id } = req.params

            const { error } = await sbAdmin
                .from('affiliate_commissions')
                .update({ status: 'paid' })
                .eq('id', id)

            if (error) {
                return res.status(500).json({ error: error.message })
            }

            res.json({ ok: true })
        } catch (e) {
            console.error('Pay commission error:', e)
            res.status(500).json({ error: 'Failed to pay commission' })
        }
    })
}

/**
 * Helper function to create commission after a purchase
 * Call this from iap.js after successful purchase verification
 */
export async function createCommissionForPurchase(sbAdmin, {
    purchaseId,
    userId,
    platform,
    productId,
    grossAmountCents = 0
}) {
    try {
        const { data, error } = await sbAdmin.rpc('sp_create_commission', {
            p_purchase_id: purchaseId,
            p_user_id: userId,
            p_platform: platform,
            p_product_id: productId,
            p_gross_amount_cents: grossAmountCents
        })

        if (error) {
            console.error('Create commission error:', error)
            return { created: false, error: error.message }
        }

        if (data?.created) {
            console.log(`✅ Commission created: ${data.commission_cents} cents for affiliate ${data.affiliate_slug}`)
        }

        return data
    } catch (e) {
        console.error('Commission creation exception:', e)
        return { created: false, error: e.message }
    }
}
