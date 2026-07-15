import { requireAuthenticatedUser } from '@/lib/auth/require-session'
import { supabaseAdminClient } from '@/lib/supabase/admin'

import type { SchemaOverview } from '@/lib/system/types'

export async function GET() {
  const user = await requireAuthenticatedUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // types.ts lacks get_schema_overview RPC until regen — function exists in DB.
  const { data, error } = await (
    supabaseAdminClient as {
      rpc: (fn: string) => ReturnType<typeof supabaseAdminClient.rpc>
    }
  ).rpc('get_schema_overview')

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  const schema: SchemaOverview =
    typeof data === 'string' ? (JSON.parse(data) as SchemaOverview) : (data as SchemaOverview)

  return Response.json(schema)
}
