import { createClient } from '@supabase/supabase-js'

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

/** Browser client — anon key only. Safe to import from Client Components. */
export const supabaseBrowserClient = createClient<Database>(
  publicRequired('NEXT_PUBLIC_SUPABASE_URL'),
  publicRequired('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
)
