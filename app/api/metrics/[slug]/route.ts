import { supabaseAdminClient } from '@/lib/supabase/admin'
import { trackingClient } from '@/lib/tracking/server'
import { requireAuthenticatedUser } from '@/lib/auth/require-session'

type Props = {
  params: Promise<{ slug: string }>
}

// Prethodno javna (curi count leadova) — sada auth-gated + ownership.
export async function GET(_request: Request, { params }: Props) {
  const user = await requireAuthenticatedUser()
  if (!user) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { slug } = await params

  const { data: landing } = await supabaseAdminClient
    .from('landing_pages')
    .select('id, profile_id, title')
    .eq('slug', slug)
    .eq('is_active', true)
    .limit(1)

  const page = landing?.[0]
  if (!page) {
    return Response.json({ error: 'landing not found' }, { status: 404 })
  }

  const isOwner = page.profile_id === null || page.profile_id === user.id
  if (!isOwner) {
    return Response.json({ error: 'forbidden' }, { status: 403 })
  }

  const id = page.id

  // views: posete atribuirane ovom landingu
  const viewsRes = await trackingClient
    .from('visits')
    .select('id', { count: 'exact', head: true })
    .eq('landing_page_id', id)

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

  const views = viewsRes.count ?? 0
  const leads = leadsRes.count ?? 0
  const conversionRate = views > 0 ? leads / views : 0

  return Response.json({
    slug,
    title: page.title,
    views,
    clicks,
    leads,
    conversionRate,
  })
}
