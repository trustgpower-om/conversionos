import { supabaseAdminClient } from '@/lib/supabase/admin'
import { trackingClient } from '@/lib/tracking/server'
import { isUuid } from '@/lib/tracking/validation'
import { createBitrixLead } from '@/lib/bitrix/client'

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

  // Resolve landing id + profile_id server-side (ne veruj klijentu).
  // profile_id se upisuje na lead — bez toga per-agent atribucija puca.
  const slug = asString(body.slug)
  if (!slug) {
    return Response.json({ error: 'slug is required' }, { status: 400 })
  }
  const { data: landing } = await supabaseAdminClient
    .from('landing_pages')
    .select('id, profile_id')
    .eq('slug', slug)
    .eq('is_active', true)
    .limit(1)
  const landingRow = landing?.[0] ?? null
  const landingPageId = landingRow?.id ?? null
  const profileId = landingRow?.profile_id ?? null
  if (!landingPageId) {
    return Response.json({ error: 'active landing not found for slug' }, { status: 404 })
  }

  // Safety: visits.session_id FK — osiguraj da visit red postoji.
  const { error: visitError } = await trackingClient
    .from('visits')
    .upsert(
      {
        session_id: body.session_id,
        landing_page_id: landingPageId,
        profile_id: profileId,
      },
      { onConflict: 'session_id' },
    )
  if (visitError) {
    return Response.json({ error: visitError.message }, { status: 500 })
  }

  // 1) Uvek sačuvaj lead lokalno — nikada ne izgubi lead.
  const { data: inserted, error } = await supabaseAdminClient
    .from('leads')
    .insert({
      session_id: body.session_id,
      landing_page_id: landingPageId,
      profile_id: profileId,
      name,
      phone,
      email: asString(body.email),
      message: asString(body.message),
      status: 'new',
      bitrix_sync_status: 'pending',
    })
    .select('id')
    .limit(1)

  if (error || !inserted?.[0]) {
    return Response.json({ error: error?.message ?? 'lead insert failed' }, { status: 500 })
  }

  const leadId = inserted[0].id

  // 2) Bitrix sync — „nema lažnog uspeha": ako je konfigurisan pa pukne,
  //    lead ostaje sačuvan, ali agent VIDI da sinhronizacija nije prošla
  //    (status u panel lead-listi + server log). Ako nije konfigurisan,
  //    to je dev stanje — lead je i dalje sačuvan lokalno.
  const bitrix = await createBitrixLead({
    name,
    phone,
    email: asString(body.email),
    message: asString(body.message),
  })

  let bitrixStatus: 'synced' | 'not_configured' | 'failed' = 'failed'
  if (bitrix.ok) {
    bitrixStatus = 'synced'
    await supabaseAdminClient
      .from('leads')
      .update({ bitrix_lead_id: bitrix.bitrixLeadId, bitrix_sync_status: 'synced' })
      .eq('id', leadId)
  } else if (bitrix.reason === 'not_configured') {
    bitrixStatus = 'not_configured'
    await supabaseAdminClient
      .from('leads')
      .update({ bitrix_sync_status: 'not_configured' })
      .eq('id', leadId)
  } else {
    // http_error | api_error — perzistiraj status + loguj; agent VIDI neuspeh.
    await supabaseAdminClient
      .from('leads')
      .update({ bitrix_sync_status: 'failed' })
      .eq('id', leadId)
    console.error('[bitrix] lead sync failed', { leadId, ...bitrix })
  }

  // 3) Realtime signal panelu da je stigao novi lead — broadcast bez PII.
  //    Panel ga koristi kao okidač za re-fetch /api/leads/list (koji nosi PII
  //    preko auth-gated service_role rute), ne kao prenos PII.
  //    Broadcast zahteva da publisher bude subscribed pre slanja.
  try {
    const channel = supabaseAdminClient.channel(`leads:${slug}`)
    await new Promise<void>((resolve) => {
      let settled = false
      const finish = () => {
        if (settled) return
        settled = true
        supabaseAdminClient.removeChannel(channel)
        resolve()
      }
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          channel
            .send({ type: 'broadcast', event: 'new_lead', payload: { slug } })
            .then(finish, finish)
          setTimeout(finish, 500)
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          finish()
        }
      })
      setTimeout(finish, 2000)
    })
  } catch {
    // Realtime je "nice to have" — ne sme oboriti lead capture.
  }

  return Response.json(
    { ok: true, lead_id: leadId, bitrix: bitrixStatus },
    { status: 201 },
  )
}
