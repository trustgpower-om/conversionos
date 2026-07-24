'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import { supabaseBrowserClient } from '@/lib/supabase/client'

type Metrics = {
  slug: string
  title: string
  views: number
  clicks: number
  leads: number
  conversionRate: number
}

type Lead = {
  id: string
  name: string | null
  phone: string | null
  email: string | null
  message: string | null
  status: string | null
  bitrix_lead_id: string | null
  created_at: string | null
}

function Stat({ label, value }: { label: string; value?: string | number }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl bg-zinc-50 p-5 dark:bg-zinc-900">
      <span className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        {value ?? '—'}
      </span>
      <span className="text-sm text-zinc-500">{label}</span>
    </div>
  )
}

function BitrixBadge({ lead }: { lead: Lead }) {
  if (lead.bitrix_lead_id) {
    return (
      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
        U Bitrixu ✓
      </span>
    )
  }
  return (
    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
      Lokalno
    </span>
  )
}

export default function PanelPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const router = useRouter()
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [leads, setLeads] = useState<Lead[]>([])
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  async function fetchMetrics() {
    try {
      const res = await fetch(`/api/metrics/${encodeURIComponent(slug)}`)
      if (res.status === 401) {
        router.push('/login')
        return null
      }
      if (!res.ok) throw new Error('fetch failed')
      const data = (await res.json()) as Metrics
      setMetrics(data)
      return data
    } catch {
      setError('Greška pri čitanju metrika')
      return null
    }
  }

  async function fetchLeads() {
    try {
      const res = await fetch(`/api/leads/list/${encodeURIComponent(slug)}`)
      if (res.status === 401) {
        router.push('/login')
        return
      }
      if (!res.ok) return
      const data = (await res.json()) as { leads: Lead[] }
      setLeads(data.leads ?? [])
      setError(null)
    } catch {
      // tiho — metrike su primarni prikaz
    }
  }

  // Inicijalno čitanje + Realtime pretplata na „novi lead" (broadcast, bez PII).
  useEffect(() => {
    let active = true

    fetchMetrics()
    fetchLeads()

    const channel = supabaseBrowserClient
      .channel(`leads:${slug}`)
      .on('broadcast', { event: 'new_lead' }, () => {
        if (!active) return
        setToast('Novi lead je stigao!')
        // Re-fetch: lead lista (PII preko auth+service_role rute) i metrike.
        fetchLeads()
        fetchMetrics()
      })
      .subscribe()

    return () => {
      active = false
      supabaseBrowserClient.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  // Auto-skrivanje toasta.
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  const conversionPct =
    metrics && metrics.views > 0
      ? `${(metrics.conversionRate * 100).toFixed(1)}%`
      : '0%'

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-6 py-16 dark:bg-black">
      <main className="flex w-full max-w-2xl flex-col gap-8 rounded-3xl bg-white p-8 shadow-sm dark:bg-zinc-950">
        <header className="flex flex-col gap-1">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
            Live metrike
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {metrics?.title ?? '—'}
          </h1>
          <p className="text-sm text-zinc-500">/l/{slug}</p>
        </header>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Pregleda" value={metrics?.views} />
          <Stat label="Klikova" value={metrics?.clicks} />
          <Stat label="Leadova" value={metrics?.leads} />
          <Stat label="Konverzija" value={conversionPct} />
        </div>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-zinc-500">
            Leadovi
          </h2>

          {leads.length === 0 ? (
            <p className="text-sm text-zinc-400">
              Još uvek nema leadova. Poseti <code>/l/{slug}</code> i pošalji upit.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {leads.map((lead) => (
                <li
                  key={lead.id}
                  className="flex flex-col gap-1 rounded-xl border border-zinc-200 p-3 dark:border-zinc-800"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-zinc-900 dark:text-zinc-50">
                      {lead.name ?? '(bez imena)'}
                    </span>
                    <BitrixBadge lead={lead} />
                  </div>
                  {lead.phone && (
                    <a
                      href={`tel:${lead.phone.replace(/\s+/g, '')}`}
                      className="text-sm text-teal-700 hover:underline dark:text-teal-400"
                    >
                      {lead.phone}
                    </a>
                  )}
                  {lead.message && (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {lead.message}
                    </p>
                  )}
                  <p className="text-xs text-zinc-400">
                    {lead.created_at
                      ? new Date(lead.created_at).toLocaleString('sr-RS')
                      : ''}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <p className="text-xs text-zinc-400">
          Realtime · podaci iz baze (visit_events / leads)
        </p>
      </main>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-zinc-900 px-5 py-3 text-sm font-medium text-white shadow-lg dark:bg-zinc-50 dark:text-zinc-900">
          {toast}
        </div>
      )}
    </div>
  )
}
