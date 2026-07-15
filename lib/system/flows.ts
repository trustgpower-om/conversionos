import type { Flow, FlowContext, FlowResult, SchemaOverview } from '@/lib/system/types'

const HEADLINE_SNIPPET = 'Pronađite svoj savršen stan'

async function readBody(res: Response): Promise<string> {
  const text = await res.text()
  return text.length > 4000 ? `${text.slice(0, 4000)}…` : text
}

function fromResponse(res: Response, body: string, ok: boolean): FlowResult {
  return { ok, status: res.status, body }
}

function fail(error: string, status?: number, body?: string): FlowResult {
  return { ok: false, error, status, body }
}

async function ensurePageview(ctx: FlowContext): Promise<Response> {
  return fetch('/api/track/pageview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: ctx.sessionId,
      landing_page_id: ctx.landingId,
      device_type: 'desktop',
      referrer: 'system-panel',
    }),
  })
}

export const SYSTEM_FLOWS: Flow[] = [
  {
    id: 'render-landing',
    title: 'Render landinga (javno)',
    description:
      'Server renderuje /l/[slug] iz baze. TrackingProvider na klijentu okida pageview.',
    doc: 'app/l/[slug]/page.tsx',
    files: [
      'app/l/[slug]/page.tsx',
      'lib/supabase/admin.ts',
      'components/tracking/TrackingProvider.tsx',
    ],
    tables: ['landing_pages', 'visits'],
    execute: async (ctx) => {
      const res = await fetch(`/l/${ctx.slug}`)
      const body = await readBody(res)
      const hasHeadline = body.includes(HEADLINE_SNIPPET)
      if (!res.ok) {
        return fail(`HTTP ${res.status}`, res.status, body)
      }
      if (!hasHeadline) {
        return fail('Headline nije pronađen u HTML-u', res.status, body.slice(0, 500))
      }
      return fromResponse(res, `200 OK — headline "${HEADLINE_SNIPPET}" pronađen`, true)
    },
  },
  {
    id: 'track-pageview',
    title: 'Track pageview',
    description: 'Layer 1 POST /api/track/pageview → upsert u visits.',
    doc: 'lib/tracking/server.ts',
    files: [
      'components/tracking/TrackingProvider.tsx',
      'lib/tracking/client.ts',
      'app/api/track/pageview/route.ts',
      'lib/tracking/server.ts',
      'lib/env.ts',
    ],
    tables: ['visits'],
    execute: async (ctx) => {
      const res = await fetch('/api/track/pageview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: ctx.sessionId,
          landing_page_id: ctx.landingId,
          device_type: 'desktop',
          referrer: 'system-panel',
        }),
      })
      const body = await readBody(res)
      return fromResponse(res, body || '(no content)', res.status === 204)
    },
  },
  {
    id: 'track-click',
    title: 'Track klik',
    description: 'Pageview safety, zatim click event u visit_events.',
    doc: 'lib/tracking/server.ts',
    files: [
      'components/tracking/TrackingProvider.tsx',
      'app/api/track/event/route.ts',
      'lib/tracking/server.ts',
    ],
    tables: ['visit_events'],
    execute: async (ctx) => {
      const pv = await ensurePageview(ctx)
      if (!pv.ok && pv.status !== 204) {
        const pvBody = await readBody(pv)
        return fail(`Pageview failed: ${pv.status}`, pv.status, pvBody)
      }

      const res = await fetch('/api/track/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: ctx.sessionId,
          event_type: 'click',
          event_payload: { track_id: 'hero-cta' },
        }),
      })
      const body = await readBody(res)
      return fromResponse(res, body || '(no content)', res.status === 204)
    },
  },
  {
    id: 'submit-lead',
    title: 'Slanje leada',
    description: 'POST /api/leads/submit — lead + safety visit upsert.',
    doc: 'app/api/leads/submit/route.ts',
    files: [
      'components/landing/LeadForm.tsx',
      'app/api/leads/submit/route.ts',
      'lib/supabase/admin.ts',
      'lib/tracking/server.ts',
    ],
    tables: ['leads', 'visits', 'visit_events'],
    execute: async (ctx) => {
      const res = await fetch('/api/leads/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: ctx.sessionId,
          slug: ctx.slug,
          name: 'Test Panel',
          phone: '+381600000000',
          email: 'test@panel.dev',
          message: 'Provera iz system panela',
        }),
      })
      const body = await readBody(res)
      return fromResponse(res, body, res.status === 201)
    },
  },
  {
    id: 'metrics',
    title: 'Live metrike',
    description: 'GET /api/metrics/[slug] — views, clicks, leads iz baze.',
    doc: 'app/api/metrics/[slug]/route.ts',
    files: [
      'app/panel/[slug]/page.tsx',
      'app/api/metrics/[slug]/route.ts',
      'lib/tracking/server.ts',
      'lib/supabase/admin.ts',
    ],
    tables: ['visits', 'visit_events', 'leads'],
    execute: async (ctx) => {
      const res = await fetch(`/api/metrics/${encodeURIComponent(ctx.slug)}`)
      const body = await readBody(res)
      return fromResponse(res, body, res.ok)
    },
  },
  {
    id: 'builder-load',
    title: 'Builder — učitaj landing',
    description: 'GET /api/pages/[slug] — custom_sections, form_fields, is_active.',
    doc: 'docs/builder-block-model.md',
    files: ['app/builder/[slug]/page.tsx', 'app/api/pages/[slug]/route.ts'],
    tables: ['landing_pages'],
    execute: async (ctx) => {
      const res = await fetch(`/api/pages/${encodeURIComponent(ctx.slug)}`)
      const body = await readBody(res)
      return fromResponse(res, body, res.ok)
    },
  },
  {
    id: 'builder-save',
    title: 'Builder — snimi izmenu',
    description: 'PATCH custom_sections sa test blokom (system-panel-test).',
    doc: 'docs/builder-block-model.md',
    files: ['app/builder/[slug]/page.tsx', 'app/api/pages/[slug]/route.ts'],
    tables: ['landing_pages'],
    execute: async (ctx) => {
      const getRes = await fetch(`/api/pages/${encodeURIComponent(ctx.slug)}`)
      if (!getRes.ok) {
        const errBody = await readBody(getRes)
        return fail(`GET failed: ${getRes.status}`, getRes.status, errBody)
      }

      const page = (await getRes.json()) as {
        custom_sections?: Array<{ id: string; type: string }> | null
      }

      const existing = page.custom_sections ?? []
      const testBlock = {
        id: `system-panel-test-${Date.now()}`,
        type: 'cta',
        trackId: null,
        props: { text: 'System panel test', ctaStyle: 'outline', ctaColor: '#0f766e' },
      }

      const withoutOldTest = existing.filter((b) => !b.id.startsWith('system-panel-test-'))
      const nextSections = [...withoutOldTest, testBlock]

      const res = await fetch(`/api/pages/${encodeURIComponent(ctx.slug)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ custom_sections: nextSections }),
      })
      const body = await readBody(res)
      return fromResponse(res, body, res.ok)
    },
  },
  {
    id: 'publish',
    title: 'Objavi / deaktiviraj',
    description: 'PATCH is_active — toggle publish stanja landinga.',
    doc: 'app/builder/[slug]/page.tsx',
    files: ['app/builder/[slug]/page.tsx', 'app/api/pages/[slug]/route.ts'],
    tables: ['landing_pages'],
    execute: async (ctx) => {
      const getRes = await fetch(`/api/pages/${encodeURIComponent(ctx.slug)}`)
      if (!getRes.ok) {
        const errBody = await readBody(getRes)
        return fail(`GET failed: ${getRes.status}`, getRes.status, errBody)
      }

      const page = (await getRes.json()) as { is_active?: boolean | null }
      const nextActive = !(page.is_active ?? false)

      const res = await fetch(`/api/pages/${encodeURIComponent(ctx.slug)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: nextActive }),
      })
      const body = await readBody(res)
      return fromResponse(res, `is_active → ${String(nextActive)}\n${body}`, res.ok)
    },
  },
  {
    id: 'schema',
    title: 'Šema baze (overview)',
    description: 'GET /api/schema — get_schema_overview() RPC.',
    doc: '—',
    files: ['app/api/schema/route.ts'],
    tables: ['(metadata)'],
    execute: async () => {
      const res = await fetch('/api/schema')
      const body = await readBody(res)
      return fromResponse(res, body, res.ok)
    },
  },
]

export async function resolveFlowContext(): Promise<FlowContext> {
  const sessionId = crypto.randomUUID()
  const slug = 'apartmani-13'
  let landingId = '2f68ec4c-6029-4174-a37a-e776878cc24b'

  try {
    const res = await fetch(`/api/pages/${encodeURIComponent(slug)}`)
    if (res.ok) {
      const data = (await res.json()) as { id?: string }
      if (data.id) {
        landingId = data.id
      }
    }
  } catch {
    // fallback landing id
  }

  return { landingId, sessionId, slug }
}

export function computeDeltas(
  tables: string[],
  before: Record<string, number>,
  after: Record<string, number>,
): Array<{ table: string; before: number; after: number; delta: number }> {
  const relevant = tables.filter((t) => t !== '(metadata)')
  const keys = relevant.length > 0 ? relevant : Object.keys({ ...before, ...after })

  return keys.map((table) => {
    const pre = before[table] ?? 0
    const post = after[table] ?? 0
    return { table, before: pre, after: post, delta: post - pre }
  })
}

function normalizeRowCounts(
  raw: SchemaOverview['row_counts'],
): Record<string, number> {
  if (!raw) {
    return {}
  }
  if (Array.isArray(raw)) {
    return Object.fromEntries(raw.map(({ table, count }) => [table, count]))
  }
  return raw
}

export async function fetchRowCounts(): Promise<Record<string, number>> {
  const res = await fetch('/api/schema')
  if (!res.ok) {
    return {}
  }
  const schema = (await res.json()) as SchemaOverview
  return normalizeRowCounts(schema.row_counts)
}
