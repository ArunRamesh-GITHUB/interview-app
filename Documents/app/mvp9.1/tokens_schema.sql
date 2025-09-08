-- tokens_schema.sql
-- SQL schema for token wallet and ledger system with RLS

-- 1) Wallet (balance) per user
create table if not exists public.user_wallets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance_tokens numeric not null default 0,
  updated_at timestamptz not null default now()
);

-- 2) Ledger (append-only)
create table if not exists public.token_ledger (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  delta_tokens numeric not null,
  reason text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- 3) RLS
alter table public.user_wallets enable row level security;
alter table public.token_ledger enable row level security;

-- Users can read only their own rows
create policy "wallet_read_own" on public.user_wallets
  for select using (auth.uid() = user_id);

create policy "ledger_read_own" on public.token_ledger
  for select using (auth.uid() = user_id);

-- No direct inserts/updates/deletes by clients; only via functions
create policy "wallet_no_client_write" on public.user_wallets
  for all using (false) with check (false);

create policy "ledger_no_client_write" on public.token_ledger
  for all using (false) with check (false);

-- 4) Upsert helper to ensure wallet exists
create or replace function public.sp_init_wallet(p_user_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  insert into public.user_wallets (user_id, balance_tokens)
  values (p_user_id, 0)
  on conflict (user_id) do nothing;
end;
$$;

-- 5) Grant tokens (server-side)
create or replace function public.sp_grant_tokens(
  p_user_id uuid,
  p_amount numeric,
  p_reason text,
  p_metadata jsonb default '{}'::jsonb
) returns numeric
language plpgsql
security definer
as $$
declare
  new_balance numeric;
begin
  perform public.sp_init_wallet(p_user_id);
  -- lock wallet row
  update public.user_wallets
     set balance_tokens = balance_tokens + p_amount,
         updated_at = now()
   where user_id = p_user_id
   returning balance_tokens into new_balance;

  insert into public.token_ledger (user_id, delta_tokens, reason, metadata)
  values (p_user_id, p_amount, p_reason, coalesce(p_metadata, '{}'::jsonb));

  return new_balance;
end;
$$;

-- 6) Consume tokens (server-side, atomic; reject if insufficient)
create or replace function public.sp_consume_tokens(
  p_user_id uuid,
  p_amount numeric,
  p_reason text,
  p_metadata jsonb default '{}'::jsonb
) returns numeric
language plpgsql
security definer
as $$
declare
  current_balance numeric;
  new_balance numeric;
begin
  perform public.sp_init_wallet(p_user_id);
  select balance_tokens into current_balance
    from public.user_wallets
   where user_id = p_user_id
   for update;

  if current_balance is null then
     current_balance := 0;
  end if;

  if current_balance < p_amount then
     raise exception 'INSUFFICIENT_TOKENS';
  end if;

  update public.user_wallets
     set balance_tokens = balance_tokens - p_amount,
         updated_at = now()
   where user_id = p_user_id
   returning balance_tokens into new_balance;

  insert into public.token_ledger (user_id, delta_tokens, reason, metadata)
  values (p_user_id, -p_amount, p_reason, coalesce(p_metadata, '{}'::jsonb));

  return new_balance;
end;
$$;