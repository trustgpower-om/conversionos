-- ConversionOS tracking domain: visit_events
-- Migration: visit_events (applied to Supabase project ucvkrsizaiaxsjlibpqx on 2026-07-15)
-- GitHub Issue: https://github.com/trustgpower-om/conversionos/issues/6
-- Repo location: supabase/migrations/20260715000002_visit_events.sql

-- Context: `visits` only captures a pageview (one row per session). There is no record of
-- *what the visitor did*. This adds the granular behavioral layer as a child of `visits`.

-- Domain split:
--   Tracking domain -> visits (session/pageview), visit_events (this), leads
--   Account domain  -> profiles (deferred)
--   Billing domain  -> payout_periods (derived)

-- visit_events is append-only (insert only, never updated) -> no updated_at needed.

create table visit_events (
  id uuid primary key default gen_random_uuid(),
  visit_session_id uuid references visits(session_id) on delete cascade,
  event_type   text not null,
  event_payload jsonb,
  created_at   timestamptz not null default now(),
  constraint visit_events_event_type_check
    check (event_type in ('click','form_submit','time_on_page'))
);

alter table visit_events enable row level security;

-- anon can only insert events (tracking), never read them. service_role reads for dashboard.
create policy "Anon insert visit_events" on visit_events
  for insert to anon with check (true);

-- =========================
-- Expected event_payload shapes (documented, not enforced)
-- =========================
--   click        : { track_id, label, href, selector? }
--                  data-track-id is the primary identifier (intentional, stable);
--                  CSS selector is a fallback when data-track-id is absent.
--   form_submit  : { track_id?, form_id? }
--                  submit-button click = ATTEMPT. The leads row = SUCCESS (no duplication).
--   time_on_page : { duration_seconds }
--                  one event per session, fired on pagehide / visibilitychange.

-- =========================
-- Funnel
-- =========================
--   pageview (visits) -> click (CTA) -> form_submit (attempt) -> leads (success)

-- =========================
-- Indexes for dashboard queries
-- =========================
create index idx_visit_events_session on visit_events(visit_session_id);
create index idx_visit_events_created on visit_events(created_at);
create index idx_visit_events_type   on visit_events(event_type);

comment on table visit_events is 'Append-only behavioral events (clicks, form_submit attempts, time_on_page) linked to a visits session via session_id.';
