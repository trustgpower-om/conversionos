import 'server-only'

import { canEditLanding, requireAuthenticatedUser } from '@/lib/auth/require-session'
import { parseCustomSections, parseFormFields } from '@/lib/builder/validation'
import type { FormFieldDef, LandingBlock } from '@/lib/builder/types'
import { supabaseAdminClient } from '@/lib/supabase/admin'
import type { Database, Json } from '@/lib/supabase/types'

type LandingUpdate = Database['public']['Tables']['landing_pages']['Update']

const PAGE_SELECT =
  'id, slug, title, is_active, headline, subheadline, cta_text, color_primary, hero_image_url, custom_sections, form_fields, profile_id'

type LandingRow = {
  id: string
  slug: string
  title: string
  is_active: boolean | null
  headline: string | null
  subheadline: string | null
  cta_text: string | null
  color_primary: string | null
  hero_image_url: string | null
  custom_sections: unknown
  form_fields: unknown
  profile_id: string | null
}

export type PageResponse = {
  id: string
  slug: string
  title: string
  is_active: boolean | null
  headline: string | null
  subheadline: string | null
  cta_text: string | null
  color_primary: string | null
  hero_image_url: string | null
  custom_sections: LandingBlock[] | null
  form_fields: FormFieldDef[] | null
  profile_id: string | null
}

type PatchBody = {
  custom_sections?: unknown
  form_fields?: unknown
  headline?: unknown
  subheadline?: unknown
  cta_text?: unknown
  color_primary?: unknown
  hero_image_url?: unknown
  is_active?: unknown
}

async function resolveLandingBySlug(slug: string): Promise<LandingRow | null> {
  const { data } = await supabaseAdminClient
    .from('landing_pages')
    .select(PAGE_SELECT)
    .eq('slug', slug)
    .limit(1)

  return data?.[0] ?? null
}

function serializePage(row: LandingRow): PageResponse {
  const customSections = row.custom_sections
    ? parseCustomSections(row.custom_sections)
    : null
  const formFields = row.form_fields ? parseFormFields(row.form_fields) : null

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    is_active: row.is_active,
    headline: row.headline,
    subheadline: row.subheadline,
    cta_text: row.cta_text,
    color_primary: row.color_primary,
    hero_image_url: row.hero_image_url,
    custom_sections: customSections,
    form_fields: formFields,
    profile_id: row.profile_id,
  }
}

async function authorizeForLanding(row: LandingRow): Promise<Response | null> {
  const user = await requireAuthenticatedUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!canEditLanding(user.id, row.profile_id)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  return null
}

type RouteProps = {
  params: Promise<{ slug: string }>
}

export async function GET(_request: Request, { params }: RouteProps) {
  const { slug } = await params
  const row = await resolveLandingBySlug(slug)

  if (!row) {
    return Response.json({ error: 'landing not found' }, { status: 404 })
  }

  const authError = await authorizeForLanding(row)
  if (authError) {
    return authError
  }

  return Response.json(serializePage(row))
}

export async function PATCH(request: Request, { params }: RouteProps) {
  const { slug } = await params
  const row = await resolveLandingBySlug(slug)

  if (!row) {
    return Response.json({ error: 'landing not found' }, { status: 404 })
  }

  const authError = await authorizeForLanding(row)
  if (authError) {
    return authError
  }

  let body: PatchBody
  try {
    body = (await request.json()) as PatchBody
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const update: LandingUpdate = {}

  if (body.custom_sections !== undefined) {
    const blocks = parseCustomSections(body.custom_sections)
    if (!blocks) {
      return Response.json({ error: 'custom_sections must be a valid block array' }, { status: 400 })
    }
    update.custom_sections = blocks as unknown as Json
  }

  if (body.form_fields !== undefined) {
    const fields = parseFormFields(body.form_fields)
    if (!fields) {
      return Response.json({ error: 'form_fields must be a valid field array' }, { status: 400 })
    }
    update.form_fields = fields as unknown as Json
  }

  if (body.headline !== undefined) {
    if (body.headline !== null && typeof body.headline !== 'string') {
      return Response.json({ error: 'headline must be a string or null' }, { status: 400 })
    }
    update.headline = body.headline
  }

  if (body.subheadline !== undefined) {
    if (body.subheadline !== null && typeof body.subheadline !== 'string') {
      return Response.json({ error: 'subheadline must be a string or null' }, { status: 400 })
    }
    update.subheadline = body.subheadline
  }

  if (body.cta_text !== undefined) {
    if (body.cta_text !== null && typeof body.cta_text !== 'string') {
      return Response.json({ error: 'cta_text must be a string or null' }, { status: 400 })
    }
    update.cta_text = body.cta_text
  }

  if (body.color_primary !== undefined) {
    if (body.color_primary !== null && typeof body.color_primary !== 'string') {
      return Response.json({ error: 'color_primary must be a string or null' }, { status: 400 })
    }
    update.color_primary = body.color_primary
  }

  if (body.hero_image_url !== undefined) {
    if (body.hero_image_url !== null && typeof body.hero_image_url !== 'string') {
      return Response.json({ error: 'hero_image_url must be a string or null' }, { status: 400 })
    }
    update.hero_image_url = body.hero_image_url
  }

  if (body.is_active !== undefined) {
    if (typeof body.is_active !== 'boolean') {
      return Response.json({ error: 'is_active must be a boolean' }, { status: 400 })
    }
    update.is_active = body.is_active
  }

  if (Object.keys(update).length === 0) {
    return Response.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const { data, error } = await supabaseAdminClient
    .from('landing_pages')
    .update(update)
    .eq('id', row.id)
    .select(PAGE_SELECT)
    .limit(1)

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  const updated = data?.[0]
  if (!updated) {
    return Response.json({ error: 'Update failed' }, { status: 500 })
  }

  return Response.json(serializePage(updated))
}
