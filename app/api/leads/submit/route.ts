import { supabaseAdminClient } from '@/lib/supabase/admin'
import { trackingClient } from '@/lib/tracking/server'
import { isUuid } from '@/lib/tracking/validation'

type LeadRequestBody = {
  session_id?: unknown
  slug?: unknown
  landing_page_id?: unknown
  name?: unknown
  phone?: unknown
  email?: unknown
  message?: unknown
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : null
}

export async function POST(request: Request) {
  let body: LeadRequestBody

  try {
    body = (await request.json()) as LeadRequestBody
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (typeof body.session_id !== 'string' || !isUuid(body.session_id)) {
    return Response.json({ error: 'session_id must be a valid UUID' }, { status: 400 })
  }

  const name = asString(body.name)
  const phone = asString(body.phone)
  if (!name || !phone) {
    return Response.json({ error: 'name and phone are required' }, { status: 400 })
  }

  // Resolve landing_page_id from the slug server-side (do not trust client id).
  // If the slug is missing or no active landing matches, refuse — a lead with
  // null landing_page_id would never show up in per-landing metrics.
  const slug = asString(body.slug)
  if (!slug) {
    return Response.json({ error: 'slug is required' }, { status: 400 })
  }
  const { data } = await supabaseAdminClient
    .from('landing_pages')
    .select('id')
    .eq('slug', slug)
    .eq('is_active', true)
    .limit(1)
  const landingPageId = data?.[0]?.id ?? null
  if (!landingPageId) {
    return Response.json({ error: 'active landing not found for slug' }, { status: 404 })
  }

  // Safety: ensure the visit row exists (leads.session_id FK -> visits.session_id).
  const { error: visitError } = await trackingClient
    .from('visits')
    .upsert(
      { session_id: body.session_id, landing_page_id: landingPageId },
      { onConflict: 'session_id' },
    )
  if (visitError) {
    return Response.json({ error: visitError.message }, { status: 500 })
  }

  const { error } = await supabaseAdminClient.from('leads').insert({
    session_id: body.session_id,
    landing_page_id: landingPageId,
    name,
    phone,
    email: asString(body.email),
    message: asString(body.message),
    status: 'new',
  })

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ ok: true }, { status: 201 })
}
