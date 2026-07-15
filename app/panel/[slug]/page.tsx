'use client'

import { use, useEffect, useState } from 'react'

type Metrics = {
  slug: string
  title: string
  views: number
  clicks: number
  leads: number
}

function Stat({ label, value }: { label: string; value?: number }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl bg-zinc-50 p-5 dark:bg-zinc-900">
      <span className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        {value ?? '—'}
      </span>
      <span className="text-sm text-zinc-500">{label}</span>
    </div>
  )
}

export default function PanelPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    const fetchMetrics = async () => {
      try {
        const res = await fetch(`/api/metrics/${encodeURIComponent(slug)}`)
        if (!res.ok) throw new Error('fetch failed')
        const data = (await res.json()) as Metrics
        if (active) {
          setMetrics(data)
          setError(null)
        }
      } catch {
        if (active) setError('Greška pri čitanju metrika')
      }
    }

    fetchMetrics()
    const interval = setInterval(fetchMetrics, 5000)

    return () => {
      active = false
      clearInterval(interval)
    }
  }, [slug])

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

        <div className="grid grid-cols-3 gap-4">
          <Stat label="Pregleda" value={metrics?.views} />
          <Stat label="Klikova" value={metrics?.clicks} />
          <Stat label="Leadova" value={metrics?.leads} />
        </div>

        <p className="text-xs text-zinc-400">
          Osvežava se na 5s · podaci iz baze (visit_events / leads)
        </p>
      </main>
    </div>
  )
}
