# ConversionOS

**Multi-tenant CRM i landing page platforma za agente i timove.**  
Svaki agent dobija vlastiti panel, page builder i conversion tracking — sve u jednom sistemu.

---

## Šta radi

- 🏠 **Landing page builder** — vizuelni block-based editor (Hero, CTA, Form, Stats, Units, Gallery, Agent, Map…)
- 📊 **Conversion tracking** — visit events, funnel analitika, lead capture, Bitrix24 sync
- 👤 **Multi-tenant panel** — svaki agent ima vlastiti `/panel/[slug]` sa overview, agents, leads i landing pages
- 🔒 **Role-based pristup** — admin sistem (`/admin/system`) + agent panel (`/panel/[slug]`)
- 🔗 **Bitrix24 integracija** — lead-ovi se automatski šalju u CRM via webhook
- 🛡️ **PII zaštita** — IP adrese se hash-uju, RLS politike na svim tabelama

---

## Tech stack

| Sloj | Tehnologija |
|---|---|
| Framework | Next.js 15 (App Router, TypeScript) |
| Backend / DB | Supabase (PostgreSQL + Auth + RLS) |
| Styling | Tailwind CSS |
| CRM | Bitrix24 (webhook integracija) |
| Package manager | pnpm |
| Deploy | Vercel |

---

## Quick start

```bash
git clone https://github.com/trustgpower-om/conversionos
cd conversionos
cp .env.example .env.local   # popuni Supabase i Bitrix24 kredencijale
pnpm install
```

### Supabase setup

```bash
# Instaliraj Supabase CLI ako ga nemaš
npm install -g supabase

# Prijavi se i linkuj projekat
supabase login
supabase link --project-ref YOUR_PROJECT_ID

# Primeni sve migracije
supabase db push
```

### Pokretanje

```bash
pnpm dev
# → http://localhost:3000
```

---

## Environment varijable

Kopirati `.env.example` u `.env.local` i popuniti:

```env
# Supabase — public (safe za client)
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_anon_...

# Supabase — server only (NIKAD u client kodu)
SUPABASE_SERVICE_ROLE_KEY=sb_service_role_...

# Bitrix24
BITRIX_WEBHOOK_URL=https://YOUR_PORTAL.bitrix24.com/rest/.../
BITRIX_WEBHOOK_SECRET=...

# Tracking
IP_SALT=...   # random string za hash IP adresa
```

---

## Struktura projekta

```
conversionos/
├── app/
│   ├── login/              # Auth ekran (Supabase Auth)
│   ├── admin/system/       # Super-admin zona
│   ├── panel/[slug]/       # Agent panel (overview, agents, leads, landing pages)
│   ├── builder/            # Page builder UI
│   ├── l/                  # Javni landing page serving (/l/[slug])
│   └── api/                # API rute (leads, metrics, pages, tracking)
├── components/
│   ├── blocks/             # Block komponente (HeroBlock, FormBlock, CtaBlock…)
│   ├── builder/            # Builder UI (canvas, sidebar, properties panel)
│   ├── landing/            # Landing page render komponente
│   └── tracking/           # TrackingProvider, visit events
├── lib/                    # Supabase klijenti, utility funkcije
├── supabase/
│   └── migrations/         # SQL migracije (5 fajlova, hronološki)
└── docs/
    ├── architecture.md                  # Arhitektura sistema (ovaj fajl + ovo)
    ├── builder-block-model.md           # Block sistem — jsonb šema, tipovi, API kontrakt
    ├── tracking-instrumentation-spec.md # Tracking specifikacija
    └── cursor-prompt-builder.md         # Cursor AI prompts za development
```

---

## Demo flow (5 koraka)

1. **Login** → `/login` (Supabase Auth)
2. **Agent panel** → `/panel/[slug]` — overview sa KPI karticama, lista agenata, leads
3. **Landing page lista** → pregled aktivnih landing page-ova agenta
4. **Builder** → `/builder/[slug]` — vizuelni editor sa block sistemom, autosave, publish
5. **Javni landing** → `/l/[slug]` — rendered landing sa tracking i lead capture formom

---

## Dokumentacija

| Dokument | Opis |
|---|---|
| [Architecture](./docs/architecture.md) | High-level pregled sistema, entiteti, tokovi |
| [Builder Block Model](./docs/builder-block-model.md) | Block sistem — tipovi, jsonb šema, API |
| [Tracking Spec](./docs/tracking-instrumentation-spec.md) | Visit events, funnel tracking |
| [Cursor Prompts](./docs/cursor-prompt-builder.md) | AI prompts za development |

---

## Supabase migracije

| Fajl | Šta radi |
|---|---|
| `20260714000000_init_core_schema.sql` | Osnovna šema: profiles, landing_pages, leads, agents |
| `20260715000000_lockdown_pii.sql` | PII zaštita: hash IP, RLS politike |
| `20260715000001_schema_maturity.sql` | Indeksi, constraints, maturing |
| `20260715000002_visit_events.sql` | Visit events tabela za tracking |
| `20260715000003_schema_overview_function.sql` | Stored function za overview KPI-eve |

---

## GitHub Issues (aktivan roadmap)

Pogledaj [open issues](https://github.com/trustgpower-om/conversionos/issues) za aktivan roadmap i taskove u razvoju.
