import { supabaseAdminClient } from '@/lib/supabase/admin'
import { requireAuthenticatedUser } from '@/lib/auth/require-session'

type Props = {
  params: Promise<{ slug: string }>
}

// leads RLS: samo anon-insert, nema SELECT politike (lockdown_pii).
// => čitanje leadova ide isključivo preko service_role + server-side auth.
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

  // Ownership: vlasnik landinga (profile_id === auth.uid()).
  // Demo landingi sa null profile_id ostaju pristupačni svakom ulogovanom
  // (konzistentno sa canEditLanding) dok se RLS ownership ne dovrši.
  const isOwner = page.profile_id === null || page.profile_id === user.id
  if (!isOwner) {
    return Response.json({ error: 'forbidden' }, { status: 403 })
  }

  const { data: leads, error } = await supabaseAdminClient
    .from('leads')
    .select(
      'id, name, phone, email, message, status, bitrix_lead_id, created_at',
    )
    .eq('landing_page_id', page.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({
    slug,
    title: page.title,
    leads: leads ?? [],
  })
}
