import { hashIp, insertPageview } from '@/lib/tracking/server'
import { inferDeviceType, isUuid } from '@/lib/tracking/validation'

type PageviewRequestBody = {
  session_id?: unknown
  profile_id?: unknown
  landing_page_id?: unknown
  referrer?: unknown
  device_type?: unknown
}

export async function POST(request: Request) {
  let body: PageviewRequestBody

  try {
    body = (await request.json()) as PageviewRequestBody
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (typeof body.session_id !== 'string' || body.session_id.trim() === '') {
    return Response.json({ error: 'session_id is required' }, { status: 400 })
  }

  if (!isUuid(body.session_id)) {
    return Response.json({ error: 'session_id must be a valid UUID' }, { status: 400 })
  }

  if (body.profile_id !== undefined) {
    if (typeof body.profile_id !== 'string' || !isUuid(body.profile_id)) {
      return Response.json({ error: 'profile_id must be a valid UUID' }, { status: 400 })
    }
  }

  if (body.landing_page_id !== undefined) {
    if (typeof body.landing_page_id !== 'string' || !isUuid(body.landing_page_id)) {
      return Response.json(
        { error: 'landing_page_id must be a valid UUID' },
        { status: 400 },
      )
    }
  }

  if (body.referrer !== undefined && typeof body.referrer !== 'string') {
    return Response.json({ error: 'referrer must be a string' }, { status: 400 })
  }

  if (body.device_type !== undefined && typeof body.device_type !== 'string') {
    return Response.json({ error: 'device_type must be a string' }, { status: 400 })
  }

  const deviceType =
    typeof body.device_type === 'string'
      ? body.device_type
      : inferDeviceType(request.headers.get('user-agent'))

  const { error } = await insertPageview({
    session_id: body.session_id,
    profile_id: typeof body.profile_id === 'string' ? body.profile_id : undefined,
    landing_page_id:
      typeof body.landing_page_id === 'string' ? body.landing_page_id : undefined,
    referrer: typeof body.referrer === 'string' ? body.referrer : undefined,
    device_type: deviceType,
    ip_hash: hashIp(request),
  })

  if (error) {
    return Response.json({ error }, { status: 500 })
  }

  return new Response(null, { status: 204 })
}
