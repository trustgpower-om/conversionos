# ConversionOS — Arhitektura sistema

Ovaj dokument opisuje kako su svi delovi sistema povezani: od baze podataka,
authentikacije, API sloja, do UI i tracking toka.

---

## 1. High-level pregled

```
┌─────────────────────────────────────────────────────────────────┐
│                        ConversionOS                             │
├──────────────┬──────────────────┬───────────────────────────────┤
│  Admin zona  │   Agent Panel    │      Javni landing            │
│ /admin/system│  /panel/[slug]   │         /l/[slug]             │
├──────────────┴──────────────────┴───────────────────────────────┤
│                    Builder  /builder/[slug]                      │
├─────────────────────────────────────────────────────────────────┤
│              Next.js App Router (TypeScript)                     │
├──────────────────────────────┬──────────────────────────────────┤
│       Supabase Auth + RLS    │      API Routes (/api/*)         │
├──────────────────────────────┼──────────────────────────────────┤
│      PostgreSQL (Supabase)   │    Bitrix24 (webhook)            │
└──────────────────────────────┴──────────────────────────────────┘
```

---

## 2. Glavni entiteti (baza podataka)

```
profiles               ← Supabase Auth users (id = auth.uid())
  ↓ 1:N
landing_pages          ← Svaki landing page agenta
  ↓ 1:N
leads                  ← Lead capture (name, phone, email, message)
  ↓ M:1
visit_events           ← Tracking: click, form_submit, time_on_page

agents                 ← Agent profili (linked na profiles)
```

### `landing_pages` ključna polja

| Kolona | Tip | Opis |
|---|---|---|
| `slug` | text | URL identifikator `/l/[slug]` i `/builder/[slug]` |
| `profile_id` | uuid | Vlasnik (FK → profiles) |
| `is_active` | bool | Da li je landing javno dostupan |
| `custom_sections` | jsonb | Niz blokova (block model) |
| `form_fields` | jsonb | Definicija polja lead forme |
| `color_primary` | text | Hex boja za CTA i brand elemente |
| `headline`, `subheadline`, `cta_text` | text | Top-level copy (fallback ako nema custom_sections) |

---

## 3. Aplikacione zone

### 3.1 Javni landing `/l/[slug]`

```
User posećuje /l/[slug]
  → Server fetch: landing_pages WHERE slug = ? AND is_active = true
  → Ako custom_sections nije null → renderuj block-by-block (BlockRenderer)
  → Ako custom_sections je null  → fallback fixed render (headline/form)
  → TrackingProvider montiran na page
  → Visit event INSERT za page_view
  → Korisnik popuni formu → POST /api/leads/submit
    → INSERT leads
    → POST Bitrix24 webhook (crm.lead.add)
    → INSERT visit_event "form_submit"
```

### 3.2 Builder `/builder/[slug]`

```
Agent otvori builder
  → GET /api/pages/[slug]  (auth required: profile_id = auth.uid())
  → Učita custom_sections jsonb → prikaže canvas
  → Agent edituje blok u properties panelu
  → Debounced autosave: PATCH /api/pages/[slug]
  → "Live metrika" panel: GET /api/metrics/[slug]
  → Publish: PATCH { is_active: true }
```

### 3.3 Agent panel `/panel/[slug]`

```
Agent se loguje → /login (Supabase Auth cookie)
  → Redirect na /panel/[slug]
  → Overview: KPI kartice (visits, leads, conversion rate, revenue, commissions)
              grafikoni (visits by source, conversion funnel)
              top agents, recent activity
  → Agents: lista, create/edit forma
  → Leads: tabela sa filterom
  → Landing pages: lista → otvori builder
```

### 3.4 Admin zona `/admin/system`

Super-admin pregled svih tenanta, sistema, konfiguracija.
Pristup samo za role = `admin` (provjera u middleware).

---

## 4. API rute

| Ruta | Metoda | Auth | Opis |
|---|---|---|---|
| `/api/leads/submit` | POST | ❌ javna | Kreiranje leada + Bitrix24 sync |
| `/api/metrics/[slug]` | GET | ❌ javna | Vraća visits/clicks/leads za landing |
| `/api/pages/[slug]` | GET | ✅ session | Čita landing za builder |
| `/api/pages/[slug]` | PATCH | ✅ session | Update custom_sections, is_active itd. |

> ⚠️ RLS politike su primenjene na tabele. `/api/leads/submit` i tracking
> koriste `service_role` jer su javne rute (nema korisničke sesije).

---

## 5. Block sistem

Kompletan block model je dokumentovan u [`docs/builder-block-model.md`](./builder-block-model.md).

Kratki pregled blok tipova:

| Block type | Komponenta | Opis |
|---|---|---|
| `hero` | `HeroBlock` | Glavni banner sa CTA dugmetom |
| `stats` | `StatsBlock` | Statistika (value + label parovi) |
| `unit` | `UnitBlock` | Kartice nekretnina/stanova |
| `form` | `FormBlock` | Lead capture forma (čita form_fields) |
| `cta` | `CtaBlock` | Standalone CTA dugme |
| `text`, `list`, `testimonial`, `spacer`, `gallery`, `agent`, `map`, `contact`, `banner` | (u razvoju) | Ostali tipovi — placeholder u builder biblioteci |

**Block render tok:**
```
custom_sections (jsonb) → BlockRenderer → po tipu → konkretna Block komponenta
                                        → data-track-id atribut → TrackingProvider
```

---

## 6. Tracking tok

Detaljno u [`docs/tracking-instrumentation-spec.md`](./tracking-instrumentation-spec.md).

```
[User action] → TrackingProvider (client)
  → detectuje: click na [data-track-id], form_submit, time_on_page
  → POST /api/track  (ili direktan Supabase insert)
  → INSERT visit_events (landing_page_id, event_type, track_id, ip_hash, metadata)
  → /api/metrics/[slug] agregira visit_events → vraća KPI-eve
  → Builder desni panel prikazuje live metrics
```

---

## 7. Autentikacija i autorizacija

```
Supabase Auth (cookie-based, SSR)
  → createServerSupabaseClient() za server komponente i API rute
  → createClientSupabaseClient() za client komponente

Zaštitne zone:
  /login          → javna
  /l/[slug]       → javna (landing page)
  /panel/*        → requires auth session
  /builder/*      → requires auth + profile_id mora biti vlasnik landinga
  /admin/*        → requires auth + role = 'admin'
  /api/pages/*    → requires auth session (server-side provjera)
```

**RLS migracije:**
- `20260715000000_lockdown_pii.sql` — PII zaštita, IP hash
- `20260715000001_schema_maturity.sql` — constraints i RLS politike

---

## 8. Bitrix24 integracija

```
Lead submit → /api/leads/submit
  → INSERT leads (lokalna baza)
  → POST BITRIX_WEBHOOK_URL  (crm.lead.add)
    ← 200 OK (Bitrix lead kreiran)
  → Bitrix24 može slati outgoing webhook natrag
    → BITRIX_WEBHOOK_SECRET validacija
    → UPDATE leads (status, assigned_to, itd.)
```

---

## 9. Supabase migracije (redosled)

```
20260714000000_init_core_schema.sql       → profiles, landing_pages, leads, agents
20260715000000_lockdown_pii.sql           → PII zaštita, IP hash funkcija
20260715000001_schema_maturity.sql        → indeksi, constraints, RLS politike
20260715000002_visit_events.sql           → visit_events tabela
20260715000003_schema_overview_function.sql → get_overview() stored function
```

Primena: `supabase db push` (sve migracije, hronološkim redom)

---

## 10. Development workflow

```bash
# 1. Klon i setup
git clone https://github.com/trustgpower-om/conversionos
cd conversionos && cp .env.example .env.local
pnpm install

# 2. Supabase migracije
supabase link --project-ref YOUR_PROJECT_ID
supabase db push

# 3. Development server
pnpm dev   # http://localhost:3000

# 4. Cursor AI development
# Pogledaj docs/cursor-prompt-builder.md za prompts
```

---

## 11. Aktivan roadmap

Pogledaj [GitHub Issues](https://github.com/trustgpower-om/conversionos/issues) za aktivan task board.

Ključne oblasti u razvoju:
- ✅ Core schema + migracije
- ✅ Block sistem (Hero, Stats, Unit, Form, CTA)
- ✅ Tracking (visit events, funnel)
- ✅ Agent panel shell + navigacija
- 🔄 Builder: properties panel, autosave, publish
- 🔄 Admin zona: tenant management
- ⏳ Drag-drop block reorder
- ⏳ Image upload
- ⏳ Undo/redo u builder-u
- ⏳ Device preview (mobile/desktop)
