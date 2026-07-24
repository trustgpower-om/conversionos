-- ConversionOS — lokalni seed podaci
-- Pokreće se automatski nakon migracija pri `supabase db reset`
-- (vidi [db].seed u config.toml / `supabase start`).
-- RLS se za seed ne primenjuje (seed radi kao superuser).

-- 1) Demo agent / profil
INSERT INTO profiles (slug, full_name, email, phone, commission_rate)
VALUES (
  'marko-demo',
  'Marko Obradovic',
  'demo@conversionos.local',
  '+381600000000',
  0.03
)
ON CONFLICT (slug) DO NOTHING;

-- 2) Demo landing page (referencira profil preko slug-a)
INSERT INTO landing_pages (
  profile_id, slug, title, headline, subheadline, cta_text, color_primary
)
SELECT
  p.id,
  'novi-beograd-extend',
  'Novi Beograd — stanovi u prodaji',
  'Pronađite svoj novi dom',
  'Od 85.000€ u Bloku 61',
  'Zatraži informacije',
  '#1a1a2e'
FROM profiles p
WHERE p.slug = 'marko-demo'
ON CONFLICT (profile_id, slug) DO NOTHING;

-- 3) Demo poseta (visit)
INSERT INTO visits (session_id, profile_id, landing_page_id, referrer, device_type)
SELECT
  gen_random_uuid(),
  p.id,
  lp.id,
  'https://facebook.com',
  'mobile'
FROM profiles p
JOIN landing_pages lp ON lp.profile_id = p.id
WHERE p.slug = 'marko-demo' AND lp.slug = 'novi-beograd-extend'
ON CONFLICT (session_id) DO NOTHING;

-- 4) Demo lead
INSERT INTO leads (profile_id, landing_page_id, name, phone, email, message, status)
SELECT
  p.id,
  lp.id,
  'Jelena Petrović',
  '+381611111111',
  'jelena@example.com',
  'Zanima me dvosoban stan na 3. spratu.',
  'new'
FROM profiles p
JOIN landing_pages lp ON lp.profile_id = p.id
WHERE p.slug = 'marko-demo' AND lp.slug = 'novi-beograd-extend';
