import type { DeviceType, VisitEventType } from '@/lib/tracking/types'

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const VISIT_EVENT_TYPES = new Set<VisitEventType>([
  'click',
  'form_submit',
  'time_on_page',
])

export function isUuid(value: string): boolean {
  return UUID_RE.test(value)
}

export function isVisitEventType(value: string): value is VisitEventType {
  return VISIT_EVENT_TYPES.has(value as VisitEventType)
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function inferDeviceType(userAgent: string | null): DeviceType {
  if (!userAgent) {
    return 'desktop'
  }

  if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
    return 'tablet'
  }

  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(userAgent)) {
    return 'mobile'
  }

  return 'desktop'
}
