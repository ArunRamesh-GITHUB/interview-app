-- Consumable IAP Schema Migration
-- Run this in Supabase SQL Editor

-- Ensure profiles table has tokens column
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS tokens INT DEFAULT 0;

-- Create purchases table for recording all purchases (consumables + starter)
CREATE TABLE IF NOT EXISTS purchases (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  product_id TEXT NOT NULL,
  transaction_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  raw_payload JSONB
);

-- Create unique index on transaction_key for idempotency
CREATE UNIQUE INDEX IF NOT EXISTS purchases_unique_tx ON purchases (transaction_key);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_product_id ON purchases(product_id);
CREATE INDEX IF NOT EXISTS idx_purchases_platform ON purchases(platform);

-- Create or replace the increment_tokens RPC function
CREATE OR REPLACE FUNCTION increment_tokens(user_id UUID, add_tokens INT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update the user's token balance in profiles
  UPDATE profiles
    SET tokens = COALESCE(tokens, 0) + add_tokens
  WHERE id = user_id;

  -- If no rows updated, user doesn't exist
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found: %', user_id;
  END IF;
END;
$$;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION increment_tokens TO service_role;

-- Add comments for documentation
COMMENT ON TABLE purchases IS 'Records all purchases (consumables, starter pack) with idempotency';
COMMENT ON COLUMN purchases.transaction_key IS 'Unique key for idempotency: ios_<orderId>, android_<orderId>, or starter-<userId>';
COMMENT ON COLUMN purchases.raw_payload IS 'Full purchase data from client or store verification';
COMMENT ON COLUMN profiles.tokens IS 'User token balance';

-- RLS Policies for purchases table
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

-- Users can view their own purchases
CREATE POLICY "Users can view own purchases"
  ON purchases
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can do everything (for IAP verification)
CREATE POLICY "Service role can manage all purchases"
  ON purchases
  FOR ALL
  USING (auth.role() = 'service_role');

-- Optional: View for purchase history (convenient for client queries)
CREATE OR REPLACE VIEW user_purchase_history AS
SELECT
  p.id,
  p.user_id,
  p.platform,
  p.product_id,
  p.created_at,
  CASE
    WHEN p.product_id = 'starter_free_20' THEN 20
    WHEN p.product_id LIKE '%plus%' THEN 500
    WHEN p.product_id LIKE '%pro%' THEN 1200
    WHEN p.product_id LIKE '%power%' THEN 3000
    ELSE 0
  END as tokens_granted
FROM purchases p
ORDER BY p.created_at DESC;

-- Grant access to the view
GRANT SELECT ON user_purchase_history TO authenticated;
