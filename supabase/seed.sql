-- ConversionOS — lokalni seed podaci
-- Pokreće se automatski nakon migracija pri `supabase db reset` / `supabase start`.
--
-- Kreira PONOVLJIV dev fixture: auth korisnik + profil + aktivan landing 'apartmani-13',
-- tako da login → /panel/apartmani-13 radi bez ručnog podešavanja.
--
-- Dev login:  marko@conversionos.local  /  conversionos
-- (U produkciji koristi prave korisnike — ovo je samo za lokalni dev.)

-- 1) Auth korisnik (bound: profiles.id = auth.uid()).
--    crypt()/gen_salt() iz pgcrypto; GoTrue prihvata bcrypt hash.
--    DO blok: ako auth.users šema odudara, seed ne puca — samo preskoči.
do $$
begin
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, confirmed_at, created_at, updated_at,
    last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
    is_sso_user, phone, phone_confirmed_at
  )
  values (
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'marko@conversionos.local',
    crypt('conversionos', gen_salt('bf')),
    now(), now(), now(), now(), now(),
    '{}'::jsonb, '{}'::jsonb, false, null, null
  )
  on conflict (id) do nothing;
exception when others then
  raise notice 'Seed: auth.users insert preskočen — %', SQLERRM;
end $$;

-- 2) Profil vezan za tog auth korisnika (profiles.id = auth.users.id).
insert into profiles (id, slug, full_name, email, phone, commission_rate)
values (
  '11111111-1111-1111-1111-111111111111',
  'marko-demo',
  'Marko Obradovic',
  'marko@conversionos.local',
  '+381600000000',
  0.03
)
on conflict (id) do update set
  email = excluded.email,
  phone = excluded.phone;

-- 3) Aktivan landing 'apartmani-13' (canonical demo slug — koristi ga login + flows).
insert into landing_pages (
  profile_id, slug, title, headline, subheadline, cta_text, color_primary, is_active
)
select
  p.id,
  'apartmani-13',
  'Stanovi — Novi Beograd',
  'Pronađite svoj savršen stan',
  'Od 85.000€ u Bloku 61',
  'Zatraži informacije',
  '#1a1a2e',
  true
from profiles p
where p.slug = 'marko-demo'
on conflict (profile_id, slug) do update set
  headline = excluded.headline,
  is_active = true;

-- 4) Demo poseta (visit) — da panel metrike imaju šta da pokažu odmah.
insert into visits (session_id, profile_id, landing_page_id, referrer, device_type)
select
  '22222222-2222-2222-2222-222222222222',
  p.id,
  lp.id,
  'https://facebook.com',
  'mobile'
from profiles p
join landing_pages lp on lp.profile_id = p.id
where p.slug = 'marko-demo' and lp.slug = 'apartmani-13'
on conflict (session_id) do nothing;
