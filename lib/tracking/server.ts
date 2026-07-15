import 'server-only'

import { createHash } from 'node:crypto'

import { createClient } from '@supabase/supabase-js'

import { env } from '@/lib/env'

import type { VisitEventType } from '@/lib/tracking/types'

// types.ts regen pending (Issue #7); using a narrow typed client until `supabase gen types` is run locally.

type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

type VisitsRow = {
  id: string
  session_id: string
  profile_id: string | null
  landing_page_id: string | null
  referrer: string | null
  device_type: string | null
  ip_hash: string | null
  created_at: string | null
  updated_at: string
}

type VisitsInsert = {
  id?: string
  session_id: string
  profile_id?: string | null
  landing_page_id?: string | null
  referrer?: string | null
  device_type?: string | null
  ip_hash?: string | null
  created_at?: string | null
  updated_at?: string
}

type VisitEventsRow = {
  id: string
  visit_session_id: string
  event_type: VisitEventType
  event_payload: Json | null
  created_at: string
}

type VisitEventsInsert = {
  id?: string
  visit_session_id: string
  event_type: VisitEventType
  event_payload?: Json | null
  created_at?: string
}

export type TrackingDatabase = {
  public: {
    Tables: {
      visits: {
        Row: VisitsRow
        Insert: VisitsInsert
        Update: Partial<VisitsInsert>
        Relationships: []
      }
      visit_events: {
        Row: VisitEventsRow
        Insert: VisitEventsInsert
        Update: Partial<VisitEventsInsert>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export const trackingClient = createClient<TrackingDatabase>(
  env.supabaseUrl,
  env.supabaseServiceRoleKey,
  { auth: { persistSession: false } },
)

export function hashIp(request: Request): string | null {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded
    ? forwarded.split(',')[0]?.trim()
    : request.headers.get('x-real-ip')?.trim()

  if (!ip) {
    return null
  }

  return createHash('sha256').update(ip + env.ipSalt).digest('hex')
}

export async function insertPageview(input: {
  session_id: string
  profile_id?: string
  landing_page_id?: string
  referrer?: string
  device_type?: string
  ip_hash?: string | null
}): Promise<{ error: string | null }> {
  // Build the row so optional FK fields (landing_page_id, profile_id) are written
  // ONLY when provided. Otherwise a later pageview without them would null-out
  // attribution that an earlier pageview set on the same session.
  const row: VisitsInsert = {
    session_id: input.session_id,
    referrer: input.referrer ?? null,
    device_type: input.device_type ?? null,
    ip_hash: input.ip_hash ?? null,
  }
  if (input.profile_id) {
    row.profile_id = input.profile_id
  }
  if (input.landing_page_id) {
    row.landing_page_id = input.landing_page_id
  }

  // Merge on conflict (no ignoreDuplicates) so an existing session picks up the
  // landing_page_id from a later pageview. Without this, metrics-by-landing stay empty.
  const { error } = await trackingClient.from('visits').upsert(row, {
    onConflict: 'session_id',
  })

  return { error: error?.message ?? null }
}

/** Ensures a visits row exists before visit_events insert (FK: visit_session_id → session_id). */
export async function ensureVisitSession(
  session_id: string,
): Promise<{ error: string | null }> {
  const { error } = await trackingClient.from('visits').upsert(
    { session_id },
    { onConflict: 'session_id', ignoreDuplicates: true },
  )

  return { error: error?.message ?? null }
}

export async function insertVisitEvent(input: {
  visit_session_id: string
  event_type: VisitEventType
  event_payload?: Record<string, unknown>
}): Promise<{ error: string | null }> {
  const { error } = await trackingClient.from('visit_events').insert({
    visit_session_id: input.visit_session_id,
    event_type: input.event_type,
    event_payload: (input.event_payload ?? null) as Json | null,
  })

  return { error: error?.message ?? null }
}
