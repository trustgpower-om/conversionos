# Frontend tracking instrumentation — spec (Issue #7)

Repo: https://github.com/trustgpower-om/conversionos (Next.js 16 App Router, TS strict, pnpm, Tailwind 4, Supabase).
Read these first: `.cursor/rules/00-project.mdc`, `.cursor/rules/03-coding.mdc`, `lib/supabase/admin.ts`, `lib/supabase/client.ts`, `lib/env.ts`, `lib/supabase/types.ts`, `app/page.tsx`, `app/layout.tsx`.

## Architecture (decided — do not change the model)

Tracking inserts go through **Layer 1 API routes**, NOT direct browser→Supabase. Reasons (from Cursor rules):
- `IP_SALT` is server-only (`lib/env.ts`); `visits.ip_hash` must be SHA-256(ip + IP_SALT) computed server-side. Browser cannot hash correctly.
- Rule 03: "Tracking via `/api/track` must never block page render (fire-and-forget)".
- Rule 00: Layer 1 is the stable client-agnostic contract (future iOS consumes it); tracking must not depend on web Supabase client types.

The anon insert-only RLS on `visits`/`visit_events` stays (defense-in-depth) but is NOT the product path.

## DB schema (already applied — do NOT migrate)

`visits` columns: id, session_id (unique), profile_id (nullable, FK profiles.id), landing_page_id (nullable, FK landing_pages.id), referrer, device_type, ip_hash, created_at, updated_at.

`visit_events` columns: id, visit_session_id (FK visits.session_id, ON DELETE CASCADE), event_type (CHECK in 'click','form_submit','time_on_page'), event_payload (jsonb), created_at. Append-only.

Funnel: pageview(visits) → click → form_submit(attempt) → leads(success). form_submit = submit-button ATTEMPT; the leads row (separate task) = success.

## types.ts constraint (CRITICAL)

`lib/supabase/types.ts` is STALE — it lacks `visit_events`, `updated_at`, `public_profiles`. The Cursor guardrail forbids hand-editing `types.ts` (it is generated). DO NOT edit `lib/supabase/types.ts`.

Instead, in `lib/tracking/server.ts` create a NARROW typed client with local Insert/Update/Row types for ONLY `visits` and `visit_events`, and `createClient<NarrowDatabase>(env.supabaseUrl, env.supabaseServiceRoleKey, { auth: { persistSession: false } })`. This keeps inserts fully typed without touching types.ts. Add a clear comment: "types.ts regen pending (Issue #7); using a narrow typed client until `supabase gen types` is run locally." No `any` anywhere.

## Files to CREATE

### `lib/tracking/server.ts` (`server-only`)
- `hashIp(request: Request): string | null` — read IP from `x-forwarded-for` (first, trimmed) else `x-real-ip`; return `sha256(ip + IP_SALT)` hex (use node:crypto `createHash('sha256')`). If no IP, return null.
- Types: `VisitEventType = 'click' | 'form_submit' | 'time_on_page'`.
- `insertPageview(input: { session_id; profile_id?; landing_page_id?; referrer?; device_type?; ip_hash? })` → upsert into `visits` with `{ onConflict: 'session_id', ignoreDuplicates: true }`. Returns `{ error: string | null }`.
- `insertVisitEvent(input: { visit_session_id; event_type: VisitEventType; event_payload?: Record<string, unknown> })` → insert into `visit_events`. Returns `{ error: string | null }`.
- Export the narrow `TrackingDatabase` type + a `trackingClient`.

### `app/api/track/pageview/route.ts`
- `export async function POST(request: Request)`.
- Parse JSON body. Validate `session_id` is a non-empty string (also accept it as a valid UUID — use a simple regex or `crypto.randomUUID` shape check; reject otherwise → 400). `profile_id?`, `landing_page_id?` optional UUIDs; `referrer?`, `device_type?` optional strings.
- `ip_hash = hashIp(request)`. device_type fallback: if body absent, infer coarse from User-Agent (mobile/tablet/desktop) — optional, keep simple.
- Call `insertPageview`. On error return 500 with `{ error }`. Else 204 (No Content).
- Do NOT block page render concerns apply client-side; route itself is just the endpoint.

### `app/api/track/event/route.ts`
- `export async function POST(request: Request)`.
- Parse JSON body `{ session_id, event_type, event_payload? }`.
- Validate `session_id` non-empty; `event_type` ∈ the 3 allowed (else 400); `event_payload` if present must be a plain object (else 400).
- Call `insertVisitEvent`. Return 204 or 500.

### `lib/tracking/client.ts` (browser-safe, NO `'use client'` directive — it is a plain module imported by the client component)
- `getOrCreateSessionId(): string` — read/create in `sessionStorage` key `cos_session_id`; value `crypto.randomUUID()`. Guard for SSR (typeof window === 'undefined' → return '').
- `trackPageview(ctx): void` — fire-and-forget `fetch('/api/track/pageview', { method:'POST', headers:{'Content-Type':'application/json'}, body, keepalive:true })`. Catch+ignore errors.
- `trackEvent(event_type, payload?, sessionId?): void` — POST to `/api/track/event` via `navigator.sendBeacon` if available (send a Blob with type application/json), else `fetch(..., {keepalive:true})`. Catch+ignore.
- A `trackTimeOnPage(durationSeconds, sessionId)` helper using sendBeacon (same path).
- Helper `getDeviceType(): 'mobile'|'tablet'|'desktop'` from `navigator.userAgent` + `matchMedia('(pointer:coarse)')`.

### `components/tracking/TrackingProvider.tsx` (`'use client'`)
- Props: `profileId?: string`, `landingPageId?: string` (optional context — a rendered landing passes these; demo page omits).
- On mount (useEffect):
  1. `sessionId = getOrCreateSessionId()`. Record `pageEnter = Date.now()`.
  2. Fire `trackPageview({ session_id: sessionId, profile_id, landing_page_id, referrer: document.referrer || undefined, device_type: getDeviceType() })`. Store a resolved flag/promise.
  3. Attach a delegated `click` listener (on document) that, when `event.target` (or closest) has `data-track-id`, calls `trackEvent('click', { track_id, label, href, selector? }, sessionId)`. Read `data-track-id`, `data-track-label`, `href` (if anchor). selector fallback = a stable identifier only if no track_id (but we only track elements that HAVE data-track-id, so selector is optional/debug).
  4. Attach a `submit` listener on forms that have `data-track-id` (or `data-track="form"`); fire `trackEvent('form_submit', { track_id, form_id }, sessionId)`.
  5. On `pagehide` and `visibilitychange` (hidden): if not already sent, compute `duration_seconds = Math.round((Date.now()-pageEnter)/1000)` and call `trackTimeOnPage(duration_seconds, sessionId)`. Use sendBeacon so it survives unload. Guard "send once".
- Cleanup all listeners on unmount.

### `app/page.tsx`
- Keep it minimal but make it a real demo landing. Mount `<TrackingProvider />` at the top. Add a demo CTA button (or anchor) with `data-track-id="hero-cta"` `data-track-label="Zatraži informacije"` and a demo tracked `<form data-track-id="lead-form">` with a submit button (the form does NOT need to actually create leads — that is a separate task; just `preventDefault` or let it be inert, but fire the form_submit event via the provider's submit listener). You may simplify the existing create-next-app page into a small hero + CTA + form. Do NOT build the real leads submission logic.

## Verification (REQUIRED before committing)
1. `pnpm install` (if node_modules missing; use pnpm).
2. `pnpm typecheck` — MUST pass (tsc --noEmit). Fix all type errors.
3. `pnpm lint` — MUST pass. Fix all lint errors.
- Runtime route testing is blocked (env vars service_role/IP_SALT not in sandbox). Note this in the commit body. The DB behavior was already verified on the live project in Issue #6.

## Commit
- Conventional Commit: `feat(tracking): frontend tracking instrumentation — TrackingProvider + /api/track routes`
- Body summarizing: API routes (pageview/event), server adapter with IP hashing + narrow typed client (types.ts untouched, regen TODO #7), client tracker (sendBeacon), TrackingProvider (click/form_submit/time_on_page), demo page with data-track-id. typecheck+lint pass; runtime env-blocked.
- Footer: `Refs #7`
- Push to main.

## Constraints / guardrails (from Cursor rules)
- TS strict, no `any`.
- Server Components by default; `'use client'` only where needed (TrackingProvider + the client tracker helpers it imports are the only client surface).
- Never expose service_role / IP_SALT in client code. `lib/tracking/server.ts` is `server-only`.
- Explicit `.select(...)` never `*` — N/A here (inserts only).
- No placeholder stubs — implement fully.
- Tracking must not block page render (fire-and-forget).
