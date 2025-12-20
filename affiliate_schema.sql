-- ============================================================
-- AFFILIATE REFERRAL SYSTEM SCHEMA
-- Copy this entire file to Supabase SQL Editor and run it
-- ============================================================

-- 1) AFFILIATES TABLE
-- Stores affiliate/creator information
-- ============================================================
CREATE TABLE IF NOT EXISTS public.affiliates (
  slug VARCHAR(50) PRIMARY KEY,
  display_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'paused', 'banned')),
  commission_rate_bps INT NOT NULL DEFAULT 2000, -- 2000 = 20%
  paypal_email TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- optional: link to user account
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_affiliates_user_id ON public.affiliates(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliates_status ON public.affiliates(status);

-- 2) USER ATTRIBUTION TABLE
-- Stores which affiliate referred which user (one per user, locked after first set)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_attribution (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  affiliate_slug VARCHAR(50) NOT NULL REFERENCES public.affiliates(slug) ON DELETE CASCADE,
  attributed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('deeplink', 'manual'))
);

-- Index for looking up users by affiliate
CREATE INDEX IF NOT EXISTS idx_user_attribution_affiliate ON public.user_attribution(affiliate_slug);

-- 3) AFFILIATE COMMISSIONS LEDGER
-- Tracks commissions per purchase (one per purchase, enforced by UNIQUE)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.affiliate_commissions (
  id BIGSERIAL PRIMARY KEY,
  purchase_id VARCHAR(255) UNIQUE NOT NULL, -- prevents double-paying
  affiliate_slug VARCHAR(50) NOT NULL REFERENCES public.affiliates(slug) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  product_id TEXT,
  gross_amount_cents INT NOT NULL DEFAULT 0,
  commission_rate_bps INT NOT NULL DEFAULT 2000,
  commission_amount_cents INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'void')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_commissions_affiliate ON public.affiliate_commissions(affiliate_slug);
CREATE INDEX IF NOT EXISTS idx_commissions_user ON public.affiliate_commissions(user_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON public.affiliate_commissions(status);
CREATE INDEX IF NOT EXISTS idx_commissions_created ON public.affiliate_commissions(created_at);

-- ============================================================
-- 4) ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_attribution ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;

-- Affiliates: Users can read their own affiliate record if they are one
CREATE POLICY "affiliates_read_own" ON public.affiliates
  FOR SELECT USING (user_id = auth.uid());

-- Affiliates: No direct client writes (managed via RPC)
CREATE POLICY "affiliates_no_client_write" ON public.affiliates
  FOR ALL USING (false) WITH CHECK (false);

-- User Attribution: Users can read their own attribution
CREATE POLICY "attribution_read_own" ON public.user_attribution
  FOR SELECT USING (user_id = auth.uid());

-- User Attribution: No direct client writes (managed via RPC)
CREATE POLICY "attribution_no_client_write" ON public.user_attribution
  FOR ALL USING (false) WITH CHECK (false);

-- Commissions: Affiliates can read commissions for their slug
CREATE POLICY "commissions_read_own" ON public.affiliate_commissions
  FOR SELECT USING (
    affiliate_slug IN (
      SELECT slug FROM public.affiliates WHERE user_id = auth.uid()
    )
  );

-- Commissions: No direct client writes
CREATE POLICY "commissions_no_client_write" ON public.affiliate_commissions
  FOR ALL USING (false) WITH CHECK (false);

-- ============================================================
-- 5) STORED PROCEDURES
-- ============================================================

-- SP: Attribute a user to an affiliate (once only, locked after first)
-- Returns: { attributed: boolean, message: string }
CREATE OR REPLACE FUNCTION public.sp_attribute_user(
  p_user_id UUID,
  p_affiliate_slug VARCHAR(50),
  p_source TEXT DEFAULT 'manual'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_existing_slug VARCHAR(50);
  v_affiliate_exists BOOLEAN;
BEGIN
  -- Check if affiliate exists and is active
  SELECT EXISTS(
    SELECT 1 FROM public.affiliates 
    WHERE slug = p_affiliate_slug AND status = 'active'
  ) INTO v_affiliate_exists;
  
  IF NOT v_affiliate_exists THEN
    RETURN jsonb_build_object('attributed', false, 'message', 'Affiliate not found or inactive');
  END IF;
  
  -- Check if user already has attribution
  SELECT affiliate_slug INTO v_existing_slug
  FROM public.user_attribution
  WHERE user_id = p_user_id;
  
  IF v_existing_slug IS NOT NULL THEN
    -- Already attributed, return without error (locked)
    RETURN jsonb_build_object('attributed', false, 'message', 'Already attributed to: ' || v_existing_slug);
  END IF;
  
  -- Insert new attribution
  INSERT INTO public.user_attribution (user_id, affiliate_slug, source, attributed_at)
  VALUES (p_user_id, p_affiliate_slug, p_source, NOW());
  
  RETURN jsonb_build_object('attributed', true, 'message', 'Successfully attributed');
END;
$$;

-- SP: Create commission for a purchase (idempotent via UNIQUE constraint)
-- Returns: { created: boolean, commission_id: bigint, message: string }
CREATE OR REPLACE FUNCTION public.sp_create_commission(
  p_purchase_id VARCHAR(255),
  p_user_id UUID,
  p_platform TEXT,
  p_product_id TEXT DEFAULT NULL,
  p_gross_amount_cents INT DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_affiliate_slug VARCHAR(50);
  v_commission_rate INT;
  v_commission_cents INT;
  v_commission_id BIGINT;
BEGIN
  -- Look up user attribution
  SELECT ua.affiliate_slug, a.commission_rate_bps
  INTO v_affiliate_slug, v_commission_rate
  FROM public.user_attribution ua
  JOIN public.affiliates a ON a.slug = ua.affiliate_slug
  WHERE ua.user_id = p_user_id
    AND a.status = 'active';
  
  IF v_affiliate_slug IS NULL THEN
    -- No attribution or affiliate inactive
    RETURN jsonb_build_object('created', false, 'message', 'No active attribution');
  END IF;
  
  -- Calculate commission
  v_commission_cents := FLOOR(p_gross_amount_cents * v_commission_rate / 10000);
  
  -- Insert commission (ON CONFLICT DO NOTHING for idempotency)
  INSERT INTO public.affiliate_commissions (
    purchase_id, affiliate_slug, user_id, platform, product_id,
    gross_amount_cents, commission_rate_bps, commission_amount_cents, status
  )
  VALUES (
    p_purchase_id, v_affiliate_slug, p_user_id, p_platform, p_product_id,
    p_gross_amount_cents, v_commission_rate, v_commission_cents, 'pending'
  )
  ON CONFLICT (purchase_id) DO NOTHING
  RETURNING id INTO v_commission_id;
  
  IF v_commission_id IS NULL THEN
    -- Already existed (conflict)
    RETURN jsonb_build_object('created', false, 'message', 'Commission already exists for this purchase');
  END IF;
  
  RETURN jsonb_build_object(
    'created', true,
    'commission_id', v_commission_id,
    'affiliate_slug', v_affiliate_slug,
    'commission_cents', v_commission_cents,
    'message', 'Commission created'
  );
END;
$$;

-- SP: Get affiliate stats for an affiliate slug (used by admin)
CREATE OR REPLACE FUNCTION public.sp_get_affiliate_stats(p_slug VARCHAR(50))
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_attributed_users INT;
  v_purchases_count INT;
  v_pending_cents BIGINT;
  v_paid_cents BIGINT;
BEGIN
  -- Count attributed users
  SELECT COUNT(*) INTO v_attributed_users
  FROM public.user_attribution
  WHERE affiliate_slug = p_slug;
  
  -- Count purchases and sum commissions
  SELECT 
    COALESCE(COUNT(*), 0),
    COALESCE(SUM(CASE WHEN status = 'pending' THEN commission_amount_cents ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN status = 'paid' THEN commission_amount_cents ELSE 0 END), 0)
  INTO v_purchases_count, v_pending_cents, v_paid_cents
  FROM public.affiliate_commissions
  WHERE affiliate_slug = p_slug;
  
  RETURN jsonb_build_object(
    'attributed_users', v_attributed_users,
    'purchases_count', v_purchases_count,
    'pending_cents', v_pending_cents,
    'paid_cents', v_paid_cents
  );
END;
$$;

-- SP: Create a new affiliate (admin use)
CREATE OR REPLACE FUNCTION public.sp_create_affiliate(
  p_slug VARCHAR(50),
  p_display_name TEXT,
  p_paypal_email TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_commission_rate_bps INT DEFAULT 2000
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.affiliates (slug, display_name, status, commission_rate_bps, paypal_email, user_id)
  VALUES (p_slug, p_display_name, 'active', p_commission_rate_bps, p_paypal_email, p_user_id)
  ON CONFLICT (slug) DO NOTHING;
  
  RETURN jsonb_build_object('ok', true, 'slug', p_slug);
END;
$$;

-- SP: Update affiliate status (admin use)
CREATE OR REPLACE FUNCTION public.sp_update_affiliate_status(
  p_slug VARCHAR(50),
  p_status TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.affiliates
  SET status = p_status, updated_at = NOW()
  WHERE slug = p_slug;
  
  RETURN jsonb_build_object('ok', true, 'slug', p_slug, 'status', p_status);
END;
$$;

-- ============================================================
-- 6) GRANT EXECUTE ON FUNCTIONS (for service role)
-- ============================================================

-- These are SECURITY DEFINER so they run with owner privileges
-- No explicit grants needed for service role

-- ============================================================
-- DONE! Your affiliate system schema is now ready.
-- ============================================================
