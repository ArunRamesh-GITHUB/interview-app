-- Attempts table for storing interview answers securely per user
-- Run this in Supabase SQL Editor once.
create extension if not exists pgcrypto; -- for gen_random_uuid()

create table if not exists public.attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mode text not null check (mode in ('live','drill','agent')),
  question text not null,
  answer text not null,
  scoring jsonb not null,
  created_at timestamptz not null default now()
);

-- Helpful index for dashboard queries
create index if not exists attempts_user_created_idx on public.attempts(user_id, created_at desc);

alter table public.attempts enable row level security;

-- Policies: users can CRUD only their own attempts
drop policy if exists "attempts_select_own" on public.attempts;
create policy "attempts_select_own" on public.attempts
for select using (auth.uid() = user_id);

drop policy if exists "attempts_insert_own" on public.attempts;
create policy "attempts_insert_own" on public.attempts
for insert with check (auth.uid() = user_id);

drop policy if exists "attempts_update_own" on public.attempts;
create policy "attempts_update_own" on public.attempts
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "attempts_delete_own" on public.attempts;
create policy "attempts_delete_own" on public.attempts
for delete using (auth.uid() = user_id);
