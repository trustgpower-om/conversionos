function required(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing env var: ${name}`)
  }
  return value
}

export const env = {
  supabaseUrl: required('NEXT_PUBLIC_SUPABASE_URL'),
  supabaseAnonKey: required('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  supabaseServiceRoleKey: required('SUPABASE_SERVICE_ROLE_KEY'),
  bitrixWebhookUrl: required('BITRIX_WEBHOOK_URL'),
  bitrixWebhookSecret: required('BITRIX_WEBHOOK_SECRET'),
  ipSalt: required('IP_SALT'),
} as const
