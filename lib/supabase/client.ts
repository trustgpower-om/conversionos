import { createBrowserClient } from '@supabase/ssr'

import type { Database } from '@/lib/supabase/types'

function publicRequired(
  name: 'NEXT_PUBLIC_SUPABASE_URL' | 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing env var: ${name}`)
  }
  return value
}

/** Browser client — anon key only. Uses cookie-based auth via @supabase/ssr. */
export const supabaseBrowserClient = createBrowserClient<Database>(
  publicRequired('NEXT_PUBLIC_SUPABASE_URL'),
  publicRequired('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
)
