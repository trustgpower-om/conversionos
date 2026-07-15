# Cursor prompt — ConversionOS Builder (vertikalni rez)

> Zalepi ceo blok ispod u Cursor Chat/Composer (Agent mod). Sve je tu da ne nagađa.

```
# Zadatak: ConversionOS Builder — vertikalni rez (do sutra)

## Cilj
Napravi /builder/[slug] editor koji UČITAVA landing iz baze, edituje blokove,
autosave-uje u landing_pages.custom_sections, i prikazuje LIVE metrike.
Builder piše u iste tabele koje runtime već čita — ne pravi paralelni sistem.

## Obim (samo ovo za sutra, ništa više)
- Blok tipovi za render: hero, stats, unit, form, cta (5). Ostali tipovi iz mockupa
  idu u block library kao disabled/placeholder (ne moraju da rade).
- /builder/[slug]: učitavanje, canvas iz custom_sections, properties panel za izabrani blok,
  debounced autosave (PATCH), publish toggle (is_active), "Live metrika" iz /api/metrics/[slug].
- NE: pravi drag-drop reorder, undo/redo, zoom, device preview, upload slika.

## Stack + postojeći kod (KORISTI OVO, ne reimplementiraj)
Next.js 16 App Router, React 19, TS strict, Supabase, Tailwind.
- lib/supabase/admin.ts → supabaseAdminClient (service_role, server-only)
- lib/supabase/server.ts → createServerSupabaseClient() (cookie auth, za proveru sesije)
- lib/tracking/server.ts, client.ts, components/tracking/TrackingProvider.tsx (već radi)
- components/landing/LeadForm.tsx (već radi — prima slug + landingPageId, data-track-id="lead-form")
- app/l/[slug]/page.tsx (već renderuje iz baze — PROŠIRI da renderuje custom_sections)
- app/api/metrics/[slug]/route.ts (već vraća {views,clicks,leads} — NE diraj, samo pozovi)
- docs/builder-block-model.md — PROČITAJ GA PRVO. Tu je jsonb šema blokova i form_fields.

## Verifikovana šema (public)
- landing_pages: id, profile_id, slug, title, headline, subheadline, hero_image_url,
  cta_text, color_primary, custom_sections jsonb, form_fields jsonb, is_active bool.
  slug NIJE globalno unikatan (UNIQUE(profile_id,slug)) → uvek .limit(1).
- leads: session_id, landing_page_id, name, phone, email, message, status (CHECK new|contacted|...).
  form_fields[].name MORA biti jedno od: name|phone|email|message.

## Korak 1: PROČITAJ docs/builder-block-model.md
Tu su svi tipovi blokova, props, trackId pravila, form_fields šema, API kontrakt, auth zahtevi.

## Korak 2: API rute (server, service_role + auth)

### GET /api/pages/[slug]/route.ts
- createServerSupabaseClient() → ako nema sesije → 401. (builder je samo za logovane)
- supabaseAdminClient: resolve slug→red (NE filtriraj is_active ovde — editor vidi i neaktivne), .limit(1). 404 ako nema.
- Vrati: id, slug, title, is_active, headline, subheadline, cta_text, color_primary, hero_image_url, custom_sections, form_fields.

### PATCH /api/pages/[slug]/route.ts
- Auth: createServerSupabaseClient() → 401 ako nema sesije.
- Resolve slug→id server-side (limit 1). 404 ako nema.
- Body je PARCIJALAN: { custom_sections?, form_fields?, headline?, subheadline?, cta_text?, color_primary?, hero_image_url?, is_active? }.
- Validacija:
  - custom_sections mora biti niz; svaki elem { id:string, type:string, props?:object, trackId?:string|null }.
  - form_fields mora biti niz; svako polje { name:(name|phone|email|message), label, type:(text|tel|email|textarea), required?:bool, placeholder?:string }. Odbaci polja sa nedozvoljenim name.
- Update samo prosleđenih kolona (ne null-uj neprosleđene). supabaseAdminClient.update(...).eq('id', landingPageId).
- Vrati 200 + ažurirani red.

## Korak 3: Block render komponente (components/blocks/)
Napravi jednu komponentu po tipu (hero, stats, unit, form, cta). Svaka prima { block } i renderuje Tailwind.
- Block = { id, type, trackId, props }.
- Ako block.trackId != null → stavi data-track-id={block.trackId} na root (hero: na CTA dugmetu; form: na <LeadForm>; cta: na dugmetu; unit: na kartici).
- hero: badge (props.badge), h1 headline, p subheadline, <a> CTA (props.ctaText, style props.ctaStyle, color props.ctaColor ?? color_primary), bgImage kao inline background.
- stats: map props.items → {value, label} kartice.
- unit: heading + grid kartica {price, location, image, m2, rooms, floor}.
- form: <LeadForm slug={slug} landingPageId={landingPageId} /> + props.heading/subtext iznad. (LeadForm već ima data-track-id="lead-form" — postavi block.trackId na "lead-form" podrazumevano.)
- cta: dugme props.text, style, color.
- Nepoznat type → renderuj null (preskoči).

## Korak 4: Proširi app/l/[slug]/page.tsx (render iz custom_sections)
- Nakon što fetch-uješ landing_pages red:
  - Ako custom_sections != null && nije prazan → renderuj blokove redom (map → <BlockRenderer block={b} landingPageId={page.id} slug={page.slug} />). Zadrži <TrackingProvider landingPageId={page.id} /> kao sibling (kao i danas).
  - Else → postojeći fixed render (headline/subheadline/cta + <LeadForm>). Tako stari landingi ne pucaju.
- BlockRenderer: switch po block.type → odgovarajuća komponenta iz koraka 3.

## Korak 5: /builder/[slug]/page.tsx ('use client')
- const { slug } = use(params) (React 19).
- useSWAG ili useEffect: GET /api/pages/[slug] → state { page, blocks, formFields }.
- Layout kao mockup: top bar (breadcrumb title, "Objavi" toggle = is_active), levo block library (5 tipova + disabled placeholderi), centar canvas, desno properties.
- Canvas: renderuje blocks redom. Klik na blok → setSelectedId.
- Block library: klik na tip → doda { id:`${type}-${Date.now()}`, type, trackId: type==='form'?'lead-form':null, props: default props za taj tip } u blocks. (Ne pravi drag-drop — dodavanje na kraj.)
- Properties panel: za izabrani blok prikaži inpute za njegov props (vidi docs/builder-block-model.md tabelu). onChange → update lokalni state + debounce 800ms → PATCH /api/pages/[slug] sa { custom_sections: blocks }.
- "Objavi" toggle → PATCH { is_active: !is_active }.
- "Live metrika" sekcija (desno dole): fetch /api/metrics/[slug] na mount + svakih 5s → prikaži views/clicks/leads (pravi brojevi).
- Styling: koristi mockup paletu (CSS varijable iz ConversionOS-Builder-Mockup.html: --primary:#0f766e, --surface, --border, --text...). Tailwind + inline style gde treba.
- Tracking dots na tracked blokovima: mali indikator ako block.trackId != null.

## Korak 6: Default init (draft)
Ako GET vrati custom_sections=null → builder lokalno generiše draft iz top-level kolona
(headline→hero.headline, subheadline→hero.subheadline, cta_text→hero.ctaText) + default form_fields (4 polja).
Ostaje draft dok korisnik ne izmeni/objavi (autosave ga snimi). NE piši u bazu pri učitavanju bez akcije.

## Pravila (non-negotiable)
- Builder rute (GET/PATCH /api/pages, /builder/*) OBAVEZNO auth (createServerSupabaseClient). 401 bez sesije.
- PATCH uvek parcijalni update; resolve slug→id server-side; nikad ne veruj klijentu za id.
- custom_sections/form_fields validacija pre upisa (vidi gore).
- trackId SAMO postavlja atribut u jsonb — ne piši novi tracking kod (TrackingProvider već hvata).
- Ne diraj /api/metrics/[slug], /api/leads/submit, TrackingProvider — samo ih koristi.
- landing_pages.slug nije globalno unique → .limit(1) svuda.

## Verifikacija (pre "gotovo")
1. pnpm typecheck → EXIT 0
2. pnpm lint → EXIT 0
3. git commit (feat(builder): ...) + git push origin main
4. pnpm dev:
   - /builder/apartmani-13 → vidiš canvas sa blokovima, možeš da edituješ headline u properties
   - izmena se snima (autosave) → proveri u Supabase: select custom_sections from landing_pages where slug='apartmani-13'
   - /l/apartmani-13 → renderuje izmenjeni headline (ako je custom_sections sada setovan)
   - /builder desni panel "Live metrika" → pravi brojevi iz /api/metrics (ne 142/23/7)
   - "Objavi" toggle → flipuje is_active
5. Ako neki blok nema trackId → bez tracking dota. Ako ga ima → pojavljuje se dot + klik na /l/ povećava clicks u metrikama.

## Poznate rupe (radi kasnije)
- Builder trenutno nema RLS politiku u bazi (auth provera je server-side privremena). TODO: policy select/update on landing_pages for authenticated using (profile_id = auth.uid()).
- profile_id na seed landingu je null → svi logovani mogu da edituju dok RLS ne stigne. Za demo ok, za prod ne.
- Blok tipovi van 5 implementiranih su placeholderi.
- views = unikatne sesije (ne reload-i) — poznata rupa iz mosta.

Radi korak po korak, posle svakog pokreni typecheck. Javi status nakon koraka 2 (API), 4 (render), 5 (builder UI).
```
