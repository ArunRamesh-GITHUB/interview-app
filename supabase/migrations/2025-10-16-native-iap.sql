-- Native IAP Schema Migration
-- Run this in Supabase SQL Editor

-- Add IAP-related fields to profiles table (if they don't exist)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS plan_active BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS plan_store TEXT, -- 'ios' or 'android'
  ADD COLUMN IF NOT EXISTS plan_product_id TEXT,
  ADD COLUMN IF NOT EXISTS plan_renews_at TIMESTAMPTZ;

-- Create subscriptions table for tracking subscription lifecycle
CREATE TABLE IF NOT EXISTS subscriptions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  store TEXT NOT NULL, -- 'ios' or 'android'
  product_id TEXT NOT NULL,
  status TEXT NOT NULL, -- 'active', 'cancelled', 'expired', 'paused'
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  renews_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  expired_at TIMESTAMPTZ,
  raw_payload JSONB, -- Store full webhook/purchase data
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_product_id ON subscriptions(product_id);

-- Create or replace the increment_tokens RPC function
-- This is a simpler version that works with the existing token_ledger structure
CREATE OR REPLACE FUNCTION increment_tokens(
  user_id_param UUID,
  add_tokens_param INT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update the user's token balance in profiles
  UPDATE profiles
    SET tokens = COALESCE(tokens, 0) + add_tokens_param
  WHERE id = user_id_param;

  -- If no rows updated, user doesn't exist
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found: %', user_id_param;
  END IF;
END;
$$;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION increment_tokens TO service_role;

-- Add comments for documentation
COMMENT ON TABLE subscriptions IS 'Tracks subscription lifecycle for native IAP (iOS/Android)';
COMMENT ON COLUMN profiles.plan IS 'Current plan tier: free, starter, plus, pro, power';
COMMENT ON COLUMN profiles.plan_active IS 'Whether the plan is currently active';
COMMENT ON COLUMN profiles.plan_store IS 'Store where subscription was purchased: ios or android';
COMMENT ON COLUMN profiles.plan_product_id IS 'Product ID from App Store or Google Play';
COMMENT ON COLUMN profiles.plan_renews_at IS 'When the subscription renews (for auto-renewing subs)';

-- RLS Policies for subscriptions table
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions"
  ON subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can do everything (for webhook handlers)
CREATE POLICY "Service role can manage all subscriptions"
  ON subscriptions
  FOR ALL
  USING (auth.role() = 'service_role');
