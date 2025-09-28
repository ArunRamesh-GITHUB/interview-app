-- RevenueCat Integration Database Migrations
-- Run this in Supabase SQL Editor

-- 1) Add tokens column to profiles table (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'tokens'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN tokens integer NOT NULL DEFAULT 0;
    END IF;
END $$;

-- 2) Create RevenueCat events table for idempotency
CREATE TABLE IF NOT EXISTS public.rc_events (
    event_id text PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type text NOT NULL,
    product_id text NOT NULL,
    tokens_granted integer NOT NULL DEFAULT 0,
    processed_at timestamptz NOT NULL DEFAULT now(),
    raw_event jsonb NOT NULL DEFAULT '{}'::jsonb
);

-- 3) Add RLS policies for rc_events table
ALTER TABLE public.rc_events ENABLE ROW LEVEL SECURITY;

-- Only allow server-side operations (no client access)
CREATE POLICY "rc_events_no_client_access" ON public.rc_events
    FOR ALL USING (false) WITH CHECK (false);

-- 4) Create index for faster lookups
CREATE INDEX IF NOT EXISTS rc_events_user_id_idx ON public.rc_events(user_id);
CREATE INDEX IF NOT EXISTS rc_events_event_type_idx ON public.rc_events(event_type);

-- 5) Grant appropriate permissions
GRANT ALL ON public.rc_events TO service_role;

-- 6) Add transaction_id column to token_ledger if not exists (for idempotency)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'token_ledger' AND column_name = 'transaction_id'
    ) THEN
        ALTER TABLE public.token_ledger ADD COLUMN transaction_id text NULL;
        CREATE INDEX IF NOT EXISTS token_ledger_transaction_id_idx ON public.token_ledger(transaction_id);
    END IF;
END $$;

-- 7) Update sp_grant_tokens to support transaction_id for idempotency
CREATE OR REPLACE FUNCTION public.sp_grant_tokens(
  p_user_id uuid,
  p_amount numeric,
  p_reason text,
  p_metadata jsonb DEFAULT '{}'::jsonb,
  p_transaction_id text DEFAULT NULL
) RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_balance numeric;
BEGIN
  -- Check for existing transaction if transaction_id provided
  IF p_transaction_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM public.token_ledger WHERE transaction_id = p_transaction_id) THEN
      -- Transaction already processed, return current balance
      SELECT balance_tokens INTO new_balance FROM public.user_wallets WHERE user_id = p_user_id;
      RETURN COALESCE(new_balance, 0);
    END IF;
  END IF;

  -- Initialize wallet if needed
  PERFORM public.sp_init_wallet(p_user_id);

  -- Update wallet balance
  UPDATE public.user_wallets
     SET balance_tokens = balance_tokens + p_amount,
         updated_at = now()
   WHERE user_id = p_user_id
   RETURNING balance_tokens INTO new_balance;

  -- Insert ledger entry with transaction_id
  INSERT INTO public.token_ledger (user_id, delta_tokens, reason, metadata, transaction_id)
  VALUES (p_user_id, p_amount, p_reason, COALESCE(p_metadata, '{}'::jsonb), p_transaction_id);

  RETURN new_balance;
END;
$$;

-- 8) Create a profiles trigger to sync wallet tokens (optional, for compatibility)
CREATE OR REPLACE FUNCTION sync_profile_tokens()
RETURNS TRIGGER AS $$
BEGIN
    -- When profiles.tokens is updated, sync with user_wallets
    INSERT INTO public.user_wallets (user_id, balance_tokens)
    VALUES (NEW.id, NEW.tokens)
    ON CONFLICT (user_id) DO UPDATE
    SET balance_tokens = NEW.tokens, updated_at = now();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Only create trigger if profiles table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
        DROP TRIGGER IF EXISTS sync_profile_tokens_trigger ON public.profiles;
        CREATE TRIGGER sync_profile_tokens_trigger
            AFTER INSERT OR UPDATE OF tokens ON public.profiles
            FOR EACH ROW
            EXECUTE FUNCTION sync_profile_tokens();
    END IF;
END $$;

-- 9) Create a reverse sync function (wallet -> profiles)
CREATE OR REPLACE FUNCTION sync_wallet_to_profile()
RETURNS TRIGGER AS $$
BEGIN
    -- When user_wallets.balance_tokens is updated, sync with profiles.tokens
    UPDATE public.profiles
    SET tokens = NEW.balance_tokens::integer
    WHERE id = NEW.user_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Only create trigger if profiles table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
        DROP TRIGGER IF EXISTS sync_wallet_to_profile_trigger ON public.user_wallets;
        CREATE TRIGGER sync_wallet_to_profile_trigger
            AFTER INSERT OR UPDATE OF balance_tokens ON public.user_wallets
            FOR EACH ROW
            EXECUTE FUNCTION sync_wallet_to_profile();
    END IF;
END $$;