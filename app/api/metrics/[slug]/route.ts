import { supabaseAdminClient } from '@/lib/supabase/admin'
import { trackingClient } from '@/lib/tracking/server'

type Props = {
  params: Promise<{ slug: string }>
}

export async function GET(_request: Request, { params }: Props) {
  const { slug } = await params

  const { data: landing } = await supabaseAdminClient
    .from('landing_pages')
    .select('id, slug, title')
    .eq('slug', slug)
    .eq('is_active', true)
    .limit(1)

  const page = landing?.[0]
  if (!page) {
    return Response.json({ error: 'landing not found' }, { status: 404 })
  }

  const id = page.id

  // views: visits attributed to this landing
  const viewsRes = await trackingClient
    .from('visits')
    .select('id', { count: 'exact', head: true })
    .eq('landing_page_id', id)

  // sessions for this landing — click events attribute via visit_session_id -> visits.session_id
  const sessionsRes = await trackingClient
    .from('visits')
    .select('session_id')
    .eq('landing_page_id', id)
  const sessionIds = (sessionsRes.data ?? []).map((r) => r.session_id)

  let clicks = 0
  if (sessionIds.length > 0) {
    const clicksRes = await trackingClient
      .from('visit_events')
      .select('id', { count: 'exact', head: true })
      .eq('event_type', 'click')
      .in('visit_session_id', sessionIds)
    clicks = clicksRes.count ?? 0
  }

  const leadsRes = await supabaseAdminClient
    .from('leads')
    .select('id', { count: 'exact', head: true })
    .eq('landing_page_id', id)

  return Response.json({
    slug: page.slug,
    title: page.title,
    views: viewsRes.count ?? 0,
    clicks,
    leads: leadsRes.count ?? 0,
  })
}
