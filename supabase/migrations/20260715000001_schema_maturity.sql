-- ConversionOS schema maturity (Module 2)
-- Migration: schema_maturity (applied to Supabase project ucvkrsizaiaxsjlibpqx on 2026-07-15)
-- GitHub Issue: https://github.com/trustgpower-om/conversionos/issues/5
-- Repo location: supabase/migrations/20260715000001_schema_maturity.sql

-- Context: the PII lockdown (20260715000000_lockdown_pii.sql) closed the read path,
-- but the schema itself had maturity gaps from the GitHub audit (01):
--   * profiles.id = gen_random_uuid() -> no ownership model (that is WHY profiles had to be using(true))
--   * no updated_at on any table -> no audit trail of changes
--   * status is free text (any string); money columns had no CHECK against negatives

-- =========================
-- 1) OWNERSHIP: profiles.id -> auth.uid()
-- =========================
-- A profile now belongs to the logged-in user. Enables a real "my row" policy.
alter table profiles
  alter column id set default auth.uid();

-- =========================
-- 2) AUDIT: updated_at columns + reusable trigger function
-- =========================
create or replace function public.update_modified_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

alter table profiles        add column if not exists updated_at timestamptz not null default now();
alter table landing_pages   add column if not exists updated_at timestamptz not null default now();
alter table leads           add column if not exists updated_at timestamptz not null default now();
alter table visits          add column if not exists updated_at timestamptz not null default now();
alter table payout_periods  add column if not exists updated_at timestamptz not null default now();

drop trigger if exists set_updated_at_profiles        on profiles;
drop trigger if exists set_updated_at_landing_pages   on landing_pages;
drop trigger if exists set_updated_at_leads           on leads;
drop trigger if exists set_updated_at_visits         on visits;
drop trigger if exists set_updated_at_payout_periods  on payout_periods;

create trigger set_updated_at_profiles        before update on profiles        for each row execute function public.update_modified_column();
create trigger set_updated_at_landing_pages   before update on landing_pages   for each row execute function public.update_modified_column();
create trigger set_updated_at_leads           before update on leads           for each row execute function public.update_modified_column();
create trigger set_updated_at_visits         before update on visits          for each row execute function public.update_modified_column();
create trigger set_updated_at_payout_periods  before update on payout_periods  for each row execute function public.update_modified_column();

-- =========================
-- 3) CONSTRAINTS: status allowed values + non-negative money
-- =========================
alter table leads           add constraint leads_status_check            check (status in ('new','contacted','qualified','won','lost','cancelled'));
alter table payout_periods  add constraint payout_periods_status_check    check (status in ('pending','calculated','paid'));

alter table leads           add constraint leads_deal_value_nonneg          check (deal_value >= 0);
alter table payout_periods  add constraint pp_payout_amount_nonneg         check (payout_amount >= 0);
alter table payout_periods  add constraint pp_total_deal_value_nonneg      check (total_deal_value >= 0);
alter table payout_periods  add constraint pp_commission_rate_nonneg       check (commission_rate >= 0);
alter table profiles        add constraint profiles_commission_rate_nonneg  check (commission_rate >= 0);

-- =========================
-- 4) PUBLIC/PRIVATE SPLIT: profiles owner-only + public_profiles view
-- =========================
-- profiles is now readable/writable only by its owner (authenticated).
drop policy if exists "Public read profiles" on profiles;
create policy "Users manage own profile" on profiles
  for all to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Landing rendering reads this view (only public columns), not the profiles table.
-- View is security-definer (default): runs as the table owner, exposing only the
-- listed columns. anon cannot read profiles directly (no anon SELECT policy).
create or replace view public_profiles as
  select id, slug, full_name, photo_url
  from profiles;

grant select on public_profiles to anon, authenticated;

-- =========================
-- NOTES / FOLLOW-UPS
-- =========================
-- * profiles and the app code do not reference each other yet (0 usages),
--   so this sets the target architecture before the profile flow goes live.
-- * Profile creation MUST happen in an authenticated context (auth.uid() non-null),
--   or pass id explicitly. If created via service_role, set id = <user uid> manually.
-- * Allowed status values are a reasonable default CRM set; adjust if the app needs others.
