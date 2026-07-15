import { ensureVisitSession, insertVisitEvent } from '@/lib/tracking/server'
import { isPlainObject, isUuid, isVisitEventType } from '@/lib/tracking/validation'

type EventRequestBody = {
  session_id?: unknown
  event_type?: unknown
  event_payload?: unknown
}

export async function POST(request: Request) {
  let body: EventRequestBody

  try {
    body = (await request.json()) as EventRequestBody
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (typeof body.session_id !== 'string' || body.session_id.trim() === '') {
    return Response.json({ error: 'session_id is required' }, { status: 400 })
  }

  if (!isUuid(body.session_id)) {
    return Response.json({ error: 'session_id must be a valid UUID' }, { status: 400 })
  }

  if (typeof body.event_type !== 'string' || !isVisitEventType(body.event_type)) {
    return Response.json({ error: 'event_type is invalid' }, { status: 400 })
  }

  if (body.event_payload !== undefined && !isPlainObject(body.event_payload)) {
    return Response.json({ error: 'event_payload must be a plain object' }, { status: 400 })
  }

  // Events can race ahead of pageview (fire-and-forget). visit_events FK requires a visits row.
  const { error: visitError } = await ensureVisitSession(body.session_id)
  if (visitError) {
    return Response.json({ error: visitError }, { status: 500 })
  }

  const { error } = await insertVisitEvent({
    visit_session_id: body.session_id,
    event_type: body.event_type,
    event_payload: body.event_payload,
  })

  if (error) {
    return Response.json({ error }, { status: 500 })
  }

  return new Response(null, { status: 204 })
}
