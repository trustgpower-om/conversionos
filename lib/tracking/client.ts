import type { DeviceType, PageviewBody, VisitEventType } from '@/lib/tracking/types'

const SESSION_KEY = 'cos_session_id'

export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') {
    return ''
  }

  let sessionId = sessionStorage.getItem(SESSION_KEY)
  if (!sessionId) {
    sessionId = crypto.randomUUID()
    sessionStorage.setItem(SESSION_KEY, sessionId)
  }

  return sessionId
}

export function getDeviceType(): DeviceType {
  if (typeof navigator === 'undefined') {
    return 'desktop'
  }

  const ua = navigator.userAgent
  if (/tablet|ipad|playbook|silk/i.test(ua)) {
    return 'tablet'
  }

  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) {
    return 'mobile'
  }

  if (
    typeof window !== 'undefined' &&
    window.matchMedia('(pointer:coarse)').matches &&
    !/ipad|tablet/i.test(ua)
  ) {
    return 'mobile'
  }

  return 'desktop'
}

function postJson(
  url: string,
  body: unknown,
  options?: { keepalive?: boolean; preferBeacon?: boolean },
): void {
  const payload = JSON.stringify(body)

  if (
    options?.preferBeacon &&
    typeof navigator !== 'undefined' &&
    typeof navigator.sendBeacon === 'function'
  ) {
    const blob = new Blob([payload], { type: 'application/json' })
    navigator.sendBeacon(url, blob)
    return
  }

  void fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
    keepalive: options?.keepalive ?? true,
  }).catch(() => {
    // fire-and-forget
  })
}

export function trackPageview(ctx: PageviewBody): void {
  postJson('/api/track/pageview', ctx, { keepalive: true })
}

export function trackEvent(
  event_type: VisitEventType,
  payload?: Record<string, unknown>,
  sessionId?: string,
): void {
  const session_id = sessionId ?? getOrCreateSessionId()
  if (!session_id) {
    return
  }

  postJson(
    '/api/track/event',
    { session_id, event_type, event_payload: payload },
    { preferBeacon: true, keepalive: true },
  )
}

export function trackTimeOnPage(durationSeconds: number, sessionId?: string): void {
  const session_id = sessionId ?? getOrCreateSessionId()
  if (!session_id) {
    return
  }

  postJson(
    '/api/track/event',
    {
      session_id,
      event_type: 'time_on_page',
      event_payload: { duration_seconds: durationSeconds },
    },
    { preferBeacon: true },
  )
}
