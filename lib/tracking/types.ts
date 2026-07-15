export type VisitEventType = 'click' | 'form_submit' | 'time_on_page'

export type DeviceType = 'mobile' | 'tablet' | 'desktop'

export type PageviewBody = {
  session_id: string
  profile_id?: string
  landing_page_id?: string
  referrer?: string
  device_type?: DeviceType
}

export type EventBody = {
  session_id: string
  event_type: VisitEventType
  event_payload?: Record<string, unknown>
}
