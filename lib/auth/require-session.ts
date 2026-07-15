import 'server-only'

import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function requireAuthenticatedUser() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
}

export function canEditLanding(userId: string, profileId: string | null): boolean {
  // Demo landings with null profile_id are editable by any authenticated user until RLS lands.
  return profileId === null || profileId === userId
}
