-- ConversionOS core schema
-- Migration: init_core_schema (applied to Supabase project ucvkrsizaiaxsjlibpqx on 2026-07-14)
-- GitHub Issue: https://github.com/trustgpower-om/conversionos/issues/2
-- Repo location: supabase/migrations/20260714000000_init_core_schema.sql

-- =========================
-- PROFILES (agenti / profili)
-- =========================
create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  full_name text not null,
  email text unique not null,
  phone text,
  photo_url text,
  commission_rate numeric default 0.02,
  is_active boolean default true,
  created_at timestamptz default now()
);

alter table profiles enable row level security;

create policy "Public read profiles"
  on profiles for select
  using (true);

-- =========================
-- LANDING PAGES
-- =========================
create table if not exists landing_pages (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  slug text not null,
  title text not null,
  headline text,
  subheadline text,
  hero_image_url text,
  cta_text text default 'Zatraži informacije',
  color_primary text default '#1a1a2e',
  custom_sections jsonb,
  form_fields jsonb,
  is_active boolean default true,
  created_at timestamptz default now(),
  unique (profile_id, slug)
);

alter table landing_pages enable row level security;

create policy "Public read landing pages"
  on landing_pages for select
  using (true);

create index if not exists idx_landing_pages_profile on landing_pages(profile_id);

-- =========================
-- VISITS (pageviews)
-- =========================
create table if not exists visits (
  id uuid primary key default gen_random_uuid(),
  session_id uuid unique not null,
  profile_id uuid references profiles(id),
  landing_page_id uuid references landing_pages(id),
  referrer text,
  device_type text,
  ip_hash text,
  created_at timestamptz default now()
);

alter table visits enable row level security;

create policy "Public read visits"
  on visits for select
  using (true);

create index if not exists idx_visits_profile on visits(profile_id);
create index if not exists idx_visits_landing on visits(landing_page_id);
create index if not exists idx_visits_created on visits(created_at);

-- =========================
-- LEADS (form submit)
-- =========================
create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references visits(session_id),
  profile_id uuid references profiles(id),
  landing_page_id uuid references landing_pages(id),
  name text,
  phone text,
  email text,
  message text,
  bitrix_lead_id text,
  bitrix_deal_id text,
  status text default 'new',
  deal_value numeric,
  converted_at timestamptz,
  created_at timestamptz default now()
);

alter table leads enable row level security;

create policy "Public read leads"
  on leads for select
  using (true);

create index if not exists idx_leads_profile on leads(profile_id);
create index if not exists idx_leads_session on leads(session_id);
create index if not exists idx_leads_status on leads(status);

-- =========================
-- PAYOUT PERIODS
-- =========================
create table if not exists payout_periods (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id),
  period_start date not null,
  period_end date not null,
  total_visits integer default 0,
  total_leads integer default 0,
  total_conversions integer default 0,
  total_deal_value numeric default 0,
  commission_rate numeric default 0.02,
  payout_amount numeric default 0,
  status text default 'pending',
  created_at timestamptz default now(),
  unique (profile_id, period_start, period_end)
);

alter table payout_periods enable row level security;

create policy "Public read payout periods"
  on payout_periods for select
  using (true);

create index if not exists idx_payout_periods_profile on payout_periods(profile_id);
