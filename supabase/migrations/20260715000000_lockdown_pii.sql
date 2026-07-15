-- ConversionOS PII lockdown
-- Migration: lockdown_pii (applied to Supabase project ucvkrsizaiaxsjlibpqx on 2026-07-15)
-- GitHub Issue: https://github.com/trustgpower-om/conversionos/issues/4
-- Repo location: supabase/migrations/20260715000000_lockdown_pii.sql

-- Context: leads, visits, payout_periods each had a `using (true)` public-read SELECT policy.
-- The anon key is public in the Next.js client bundle, so anyone could read PII and payout data.
-- The Supabase advisor only flags MISSING RLS, not PERMISSIVE RLS — so rls_enabled gave a false sense of security.

-- =========================
-- LEADS — anon insert-only, no public SELECT
-- PII protected: name, phone, email, message, deal_value
-- =========================
drop policy if exists "Public read leads" on leads;
create policy "Anon insert leads" on leads
  for insert to anon with check (true);

-- =========================
-- VISITS — anon insert-only (pageview tracking), no public SELECT
-- PII protected: ip_hash, referrer, device_type
-- =========================
drop policy if exists "Public read visits" on visits;
create policy "Anon insert visits" on visits
  for insert to anon with check (true);

-- =========================
-- PAYOUT_PERIODS — no anon access at all
-- Protected: commission_rate, payout_amount, total_deal_value
-- Only service_role reads/writes (bypasses RLS).
-- =========================
drop policy if exists "Public read payout periods" on payout_periods;
-- intentionally no policy for anon -> blocked

-- =========================
-- OUT OF SCOPE (tracked separately)
-- =========================
-- profiles and landing_pages keep public read (needed to render landing pages).
-- Residual exposure: profiles public read still exposes email and phone.
-- To be solved with a column-level / security-definer view in a later lab (Lab 5).
--
-- Verification (run on the live project):
--   set role anon;
--   insert into leads (name, phone, email, message) values ('RLS probe','000','probe@example.invalid','lockdown verification');
--   select count(*) from leads;          -- 0  (anon cannot read back even the row it just inserted)
--   select count(*) from visits;         -- 0
--   select count(*) from payout_periods; -- 0
