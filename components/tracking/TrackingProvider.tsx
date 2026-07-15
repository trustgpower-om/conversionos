'use client'

import { useEffect } from 'react'

import {
  getDeviceType,
  getOrCreateSessionId,
  trackEvent,
  trackPageview,
  trackTimeOnPage,
} from '@/lib/tracking/client'

type TrackingProviderProps = {
  profileId?: string
  landingPageId?: string
}

function getTrackedElement(target: EventTarget | null): HTMLElement | null {
  if (!(target instanceof Element)) {
    return null
  }

  const tracked = target.closest('[data-track-id]')
  return tracked instanceof HTMLElement ? tracked : null
}

export function TrackingProvider({ profileId, landingPageId }: TrackingProviderProps) {
  useEffect(() => {
    const sessionId = getOrCreateSessionId()
    if (!sessionId) {
      return
    }

    const pageEnter = Date.now()
    let timeOnPageSent = false

    trackPageview({
      session_id: sessionId,
      profile_id: profileId,
      landing_page_id: landingPageId,
      referrer: document.referrer || undefined,
      device_type: getDeviceType(),
    })

    const sendTimeOnPage = () => {
      if (timeOnPageSent) {
        return
      }

      timeOnPageSent = true
      const durationSeconds = Math.round((Date.now() - pageEnter) / 1000)
      trackTimeOnPage(durationSeconds, sessionId)
    }

    const handleClick = (event: MouseEvent) => {
      const tracked = getTrackedElement(event.target)
      if (!tracked) {
        return
      }

      const trackId = tracked.dataset.trackId
      if (!trackId) {
        return
      }

      const anchor = tracked.closest('a')
      const href = anchor?.getAttribute('href') ?? undefined

      trackEvent(
        'click',
        {
          track_id: trackId,
          label: tracked.dataset.trackLabel,
          href,
        },
        sessionId,
      )
    }

    const handleSubmit = (event: SubmitEvent) => {
      const form = event.target
      if (!(form instanceof HTMLFormElement)) {
        return
      }

      const trackId = form.dataset.trackId
      if (!trackId) {
        return
      }

      trackEvent(
        'form_submit',
        {
          track_id: trackId,
          form_id: form.id || undefined,
        },
        sessionId,
      )
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        sendTimeOnPage()
      }
    }

    document.addEventListener('click', handleClick)
    document.addEventListener('submit', handleSubmit)
    window.addEventListener('pagehide', sendTimeOnPage)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('click', handleClick)
      document.removeEventListener('submit', handleSubmit)
      window.removeEventListener('pagehide', sendTimeOnPage)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [profileId, landingPageId])

  return null
}
