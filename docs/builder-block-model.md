# ConversionOS — Builder Block Model

Specifikacija kako builder (mockup `ConversionOS-Builder-Mockup.html`) skladišti i
renderuje sadržaj landinga. Ovo je **most između mockupa i baze** — definiše jsonb
šemu koju koriste `landing_pages.custom_sections` i `landing_pages.form_fields`.

## Odnos prema postojećem sistemu

- **Runtime (već živ):** `/l/[slug]` renderuje landing iz baze, `/api/leads/submit`
  pravi lead, `/api/metrics/[slug]` vraća prave brojeve, `TrackingProvider` hvata
  click/form_submit/time_on_page. Builder NE menja ovo — on **piše** u iste tabele.
- **Builder (nov):** `/builder/[slug]` učitava landing, edituje `custom_sections` +
  `form_fields`, autosave-uje preko `PATCH /api/pages/[slug]`, a "Objavi" flipuje
  `is_active`. Canvas u builderu ≈ isto što renderuje `/l/[slug]`.

## 1. `custom_sections` jsonb (niz blokova)

`landing_pages.custom_sections` je `jsonb` niz. Svaki element je jedan **blok**:

```jsonc
{
  "id": "hero-1",                 // jedinstven unutar stranice (kebab-case ili uuid)
  "type": "hero",                 // tip bloka (vidi tabelu ispod)
  "trackId": "hero-cta",          // NULL ako blok nije praćen; mapira se na data-track-id
  "props": { ... }                // tip-specifična svojstva
}
```

Zajednička pravila:
- `id` — jedinstveno; generiše se pri dodavanju bloka (`<type>-<n>`). Nikad se ne menja.
- `type` — jedan od dozvoljenih tipova (enum). Nepoznat tip → renderer ga preskače (ne puca).
- `trackId` — ako nije null, renderuje se kao `data-track-id` na root elementu bloka
  (ili na CTA elementu unutar bloka — vidi po tipu). TrackingProvider već hvata
  `[data-track-id]` klikove i `form_submit`. **Nema novog tracking koda — samo postavi atribut.**
- `props` — objekat; nepoznata polja se ignorišu pri renderu (forvard-kompatibilnost).
- Redosled u nizu = redosled na stranici (odozgo nadole).

## 2. Tipovi blokova i `props` (izvedeno iz mockupa)

| type         | Naziv (mockup)    | trackId na šta        | props                                                                |
|--------------|-------------------|-----------------------|----------------------------------------------------------------------|
| `hero`       | Hero sekcija      | CTA dugme             | `headline`, `subheadline`, `ctaText`, `ctaStyle`(filled\|outline\|text), `ctaColor`(hex), `bgImage`(url\|null), `badge`(string\|null) |
| `banner`     | Baner             | ceo banner            | `headline`, `ctaText`(string\|null), `bgImage`(url), `bgColor`(hex\|null) |
| `stats`     | Statistika        | null                  | `items`: `[{value:string, label:string}]`                            |
| `list`       | Lista             | null                  | `heading`(string\|null), `items`: `[{text:string}]`                  |
| `text`       | Tekst             | null                  | `heading`(string\|null), `body`(string, markdown-dozvoljen)          |
| `testimonial`| Preporuka        | null                  | `author`, `role`, `quote`, `photo`(url\|null)                       |
| `spacer`     | Razmak            | null                  | `height`(number, px)                                                |
| `gallery`    | Galerija          | null                  | `images`: `[{url:string, alt:string}]`, `columns`(1-4)             |
| `agent`      | Agent             | kontakt podaci        | `name`, `role`, `phone`, `email`, `photo`(url\|null)               |
| `unit`       | Stan / Nekretnine | cela kartica          | `heading`(string\|null), `ctaText`(string\|null), `items`: `[{price, location, image, m2, rooms, floor}]` |
| `map`        | Mapa              | null                  | `address`(string), `lat`(number), `lng`(number), `zoom`(number), `embedUrl`(url\|null) |
| `form`       | Forma / Lead hvatanje | forma (form_submit) | `heading`, `subtext`, `submitLabel`, `trackId`(default `"lead-form"`) + polja se čitaju iz `form_fields` jsonb |
| `cta`        | CTA dugme         | dugme                 | `text`, `ctaStyle`(filled\|outline\|text), `ctaColor`(hex)          |
| `contact`    | Uspostavi kontakte| kontakt               | `heading`, `phone`, `email`, `whatsapp`(string\|null)               |

Napomene:
- `form` i `lead-capture` su **isti tip** (`form`) — razlika je samo u poljima (`form_fields`).
- `ctaColor` je hex (`#0f766e`); ako null → koristi `landing_pages.color_primary`.
- Sve URL slike su string; builder ne upload-uje fajlove (samo URL unos) za ovaj rez.

## 3. `form_fields` jsonb (šema forme)

`landing_pages.form_fields` je `jsonb` niz definicija polja. Mapira se 1:1 na kolone
`leads` tabele (`name`, `phone`, `email`, `message`).

```jsonc
[
  { "name": "name",    "label": "Vaše ime",   "type": "text",     "required": true,  "placeholder": "Vaše ime" },
  { "name": "phone",   "label": "Telefon",   "type": "tel",      "required": true,  "placeholder": "+381 ..." },
  { "name": "email",   "label": "Email",      "type": "email",    "required": false, "placeholder": "" },
  { "name": "message", "label": "Poruka",     "type": "textarea", "required": false, "placeholder": "Poruka (opciono)" }
]
```

Pravila:
- `name` MORA biti jedna od: `name`, `phone`, `email`, `message` (kolone `leads`).
  Ostala imena se odbacuju pri submitu (validacija u `/api/leads/submit`).
- `type` ∈ `text`, `tel`, `email`, `textarea`.
- Postojeći `LeadForm` + `/api/leads/submit` već rade s ovim poljima — samo ih renderuj iz `form_fields`.

## 4. Tok `trackId` (kako tracking "zživi" kroz builder)

```
builder (properties: trackId toggle ON)
  → custom_sections[].trackId = "hero-cta"
  → PATCH /api/pages/[slug]  (save u bazu)
  → /l/[slug] renderuje <section data-track-id="hero-cta">
  → TrackingProvider (već na /l/[slug]) hvata click → insertVisitEvent("click", {trackId})
  → /api/metrics/[slug] broji click events za taj landing
  → "Live metrika" u builder desnom panelu = pravi brojevi (ne 142/23/7)
```

Builder SAMO postavlja `trackId` u jsonb. Sve ostalo (capture, count, prikaz) već postoji.

## 5. API kontrakt (builder)

### `GET /api/pages/[slug]`
Vraća ceo `landing_pages` red za editor: `id`, `slug`, `title`, `is_active`,
`headline`, `subheadline`, `cta_text`, `color_primary`, `hero_image_url`,
`custom_sections` (jsonb), `form_fields` (jsonb).
- Resolve `slug`→`id` server-side (`supabaseAdminClient`, `.eq('is_active')` NIJE obavezno
  ovde — editor mora videti i neaktivne). `limit(1)`. 404 ako nema.

### `PATCH /api/pages/[slug]`
Body: parcijalni update (`custom_sections?`, `form_fields?`, `headline?`, …, `is_active?`).
- Validacija: `custom_sections` mora biti niz; svaki blok mora imati `id`+`type`.
- `form_fields[].name` mora biti u dozvoljenoj listi (`name|phone|email|message`).
- Update samo prosleđenih polja (partial). Vraća 200 + ažurirani red.

### Render: `/l/[slug]` proširenje
- Ako `custom_sections` nije null i nije prazan → renderuj blokove redom (svaki tip → komponenta).
- Ako je null/empty → fallback na postojeći fixed render (headline/subheadline/cta + LeadForm)
  iz top-level kolona (tako radi i danas). Ovo čini migraciju bezbednom.
- `form` blok renderuje `<LeadForm slug landingPageId>` (već postoji) sa `data-track-id`.

### Metrike: `/api/metrics/[slug]` (već postoji, NE dirati)
Builder desni panel ga poziva i prikazuje prave `views/clicks/leads`.

## 6. Autorizacija (KRITIČNO za builder)

Runtime (javni `/l/[slug]`, `/api/leads/submit`) koristi `service_role` jer su javne rute.
Ali **builder i `PATCH /api/pages/[slug]` smeju samo vlasnik landinga** — ne sme biti javan.
Za vertikalni rez:
- `GET/PATCH /api/pages/[slug]` i `/builder/*` moraju zahtevati logovanog Supabase korisnika.
- Dozvoljen edit samo ako `auth.uid() = landing_pages.profile_id` (ili je `profile_id` null = demo).
- Implementacija: koristi `createServerSupabaseClient()` (cookie auth) za proveru sesije,
  pa `supabaseAdminClient` za sam read/write. Ako nema sesije → 401.
- RLS još nije modelovan — ova server-side provera je privremena zaštita dok se ne doda RLS politika
  (TODO: `policy select on landing_pages for authenticated using (profile_id = auth.uid())`).

## 7. Obim za "do sutra" (vertikalni rez)

Implementirati:
- Blok tipovi: `hero`, `stats`, `unit`, `form`, `cta` (5 tipova). Ostali tipovi: samo placeholder u biblioteci (ne renderuju).
- `/builder/[slug]`: učitavanje, canvas iz `custom_sections`, properties panel za izabrani blok,
  debounced autosave (PATCH), publish toggle (`is_active`), "Live metrika" iz `/api/metrics/[slug]`.
- Ne za sutra: pravi drag-drop reorder (blokovi u fiksnom redosledu iz niza — dodavanje na kraj),
  undo/redo, zoom, device preview, upload slika.

## 8. Seed (već postoji)
`landing_pages` slug `apartmani-13` (`2f68ec4c-…`). Trenutno `custom_sections` = NULL.
Builder pri prvom otvaranju može inicijalizovati `custom_sections` iz postojećih top-level
kolona (`headline`→hero.headline, `subheadline`→hero.subheadline, `cta_text`→hero.ctaText)
i default `form_fields` (4 polja iznad) ako su null — ali samo kao draft, uz eksplicitan save.
