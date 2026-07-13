import 'server-only'

import { createClient } from '@supabase/supabase-js'

import { env } from '@/lib/env'

/**
 * Admin Supabase client — `service_role` key, full DB access, **bypasses RLS**.
 *
 * Allowed: server context only (API routes, Edge/server jobs, payout engine).
 * Forbidden: Client Components, `'use client'` modules, any browser bundle.
 *
 * Importing this file into client code fails the build via `server-only`.
 */
export function createAdminSupabaseClient() {
  return createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
