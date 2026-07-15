import 'server-only'

function required(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing env var: ${name}`)
  }
  return value
}

function optional(name: string): string | null {
  const value = process.env[name]
  return value && value.trim() !== '' ? value : null
}

/**
 * Server-only env. Includes secrets (service_role, IP salt).
 * Bitrix vars are optional until the Bitrix integration is built — requiring
 * them now would 500 every server route for projects that haven't configured
 * a Bitrix webhook yet.
 * Do not import from Client Components — use NEXT_PUBLIC_* via process.env there
 * (see `lib/supabase/client.ts`).
 */
export const env = {
  supabaseUrl: required('NEXT_PUBLIC_SUPABASE_URL'),
  supabaseAnonKey: required('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  supabaseServiceRoleKey: required('SUPABASE_SERVICE_ROLE_KEY'),
  ipSalt: required('IP_SALT'),
  bitrixWebhookUrl: optional('BITRIX_WEBHOOK_URL'),
  bitrixWebhookSecret: optional('BITRIX_WEBHOOK_SECRET'),
} as const
