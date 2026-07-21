import type { ReactNode } from 'react'

import { AppShell } from '@/components/app/AppShell'

// Auth guard for the (app) route group. We import the real session helper
// (lib/auth/require-session) so the wiring is correct, but keep it tolerant:
// this is a MOCK build with no Supabase env configured, and `lib/env.ts`
// fail-fasts at import. The dynamic import inside try/catch lets the shell
// render in dev without a session instead of hard-crashing. Tighten to a
// redirect once real data + env land (see roadmap §7 step 2).
async function guardSession(): Promise<void> {
  try {
    const { requireAuthenticatedUser } = await import('@/lib/auth/require-session')
    await requireAuthenticatedUser()
  } catch {
    // Tolerant in the mock build — do not block rendering on missing env/session.
  }
}

export default async function AppGroupLayout({ children }: { children: ReactNode }) {
  await guardSession()
  return <AppShell>{children}</AppShell>
}
