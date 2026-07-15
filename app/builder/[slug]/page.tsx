'use client'

import type { CSSProperties } from 'react'
import Link from 'next/link'
import { use, useCallback, useEffect, useRef, useState } from 'react'

import { BuilderCanvas } from '@/components/builder/BuilderCanvas'
import { PropertiesPanel } from '@/components/builder/PropertiesPanel'
import {
  buildDraftBlocks,
  defaultPropsForBlockType,
  defaultTrackIdForType,
  DEFAULT_FORM_FIELDS,
} from '@/lib/builder/defaults'
import type { FormFieldDef, LandingBlock } from '@/lib/builder/types'

type Metrics = {
  slug: string
  title: string
  views: number
  clicks: number
  leads: number
}

type PageData = {
  id: string
  slug: string
  title: string
  is_active: boolean | null
  headline: string | null
  subheadline: string | null
  cta_text: string | null
  color_primary: string | null
  hero_image_url: string | null
  custom_sections: LandingBlock[] | null
  form_fields: FormFieldDef[] | null
}

const LIBRARY = [
  { type: 'hero', label: 'Hero sekcija', enabled: true },
  { type: 'stats', label: 'Statistika', enabled: true },
  { type: 'unit', label: 'Stan / Nekretnine', enabled: true },
  { type: 'form', label: 'Forma', enabled: true },
  { type: 'cta', label: 'CTA dugme', enabled: true },
  { type: 'banner', label: 'Baner', enabled: false },
  { type: 'list', label: 'Lista', enabled: false },
  { type: 'text', label: 'Tekst', enabled: false },
  { type: 'gallery', label: 'Galerija', enabled: false },
  { type: 'map', label: 'Mapa', enabled: false },
] as const

function MetricCard({ label, value }: { label: string; value?: number }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
      <div className="text-xl font-semibold text-zinc-900">{value ?? '—'}</div>
      <div className="text-xs text-zinc-500">{label}</div>
    </div>
  )
}

export default function BuilderPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [page, setPage] = useState<PageData | null>(null)
  const [blocks, setBlocks] = useState<LandingBlock[]>([])
  const [formFields, setFormFields] = useState<FormFieldDef[]>(DEFAULT_FORM_FIELDS)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const patchPage = useCallback(
    async (body: Record<string, unknown>) => {
      setSaveState('saving')
      const res = await fetch(`/api/pages/${encodeURIComponent(slug)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        setSaveState('error')
        return null
      }

      const data = (await res.json()) as PageData
      setPage(data)
      setSaveState('saved')
      return data
    },
    [slug],
  )

  const scheduleSave = useCallback(
    (nextBlocks: LandingBlock[]) => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current)
      }
      saveTimer.current = setTimeout(() => {
        void patchPage({ custom_sections: nextBlocks })
      }, 800)
    },
    [patchPage],
  )

  useEffect(() => {
    let active = true

    async function load() {
      const res = await fetch(`/api/pages/${encodeURIComponent(slug)}`)
      if (!res.ok) {
        if (active) {
          setLoadError(res.status === 401 ? 'auth' : 'load')
        }
        return
      }

      const data = (await res.json()) as PageData
      if (!active) {
        return
      }

      setPage(data)

      const sections =
        data.custom_sections && data.custom_sections.length > 0
          ? data.custom_sections
          : buildDraftBlocks(data)

      setBlocks(sections)
      setFormFields(data.form_fields ?? DEFAULT_FORM_FIELDS)
      setSelectedId(sections[0]?.id ?? null)
      setLoadError(null)
    }

    void load()

    return () => {
      active = false
    }
  }, [slug])

  useEffect(() => {
    let active = true

    const fetchMetrics = async () => {
      try {
        const res = await fetch(`/api/metrics/${encodeURIComponent(slug)}`)
        if (!res.ok) {
          return
        }
        const data = (await res.json()) as Metrics
        if (active) {
          setMetrics(data)
        }
      } catch {
        // ignore
      }
    }

    void fetchMetrics()
    const interval = setInterval(fetchMetrics, 5000)

    return () => {
      active = false
      clearInterval(interval)
    }
  }, [slug])

  useEffect(() => {
    return () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current)
      }
    }
  }, [])

  function updateBlock(next: LandingBlock) {
    setBlocks((prev) => {
      const updated = prev.map((b) => (b.id === next.id ? next : b))
      scheduleSave(updated)
      return updated
    })
  }

  function addBlock(type: string) {
    const block: LandingBlock = {
      id: `${type}-${crypto.randomUUID()}`,
      type,
      trackId: defaultTrackIdForType(type),
      props: defaultPropsForBlockType(type),
    }
    setBlocks((prev) => {
      const updated = [...prev, block]
      scheduleSave(updated)
      return updated
    })
    setSelectedId(block.id)
  }

  async function togglePublish() {
    if (!page) {
      return
    }
    const next = !(page.is_active ?? false)
    await patchPage({ is_active: next })
  }

  const selectedBlock = blocks.find((b) => b.id === selectedId) ?? null

  if (loadError === 'auth') {
    return (
      <div className="flex min-h-full flex-1 flex-col items-center justify-center gap-4 bg-zinc-50 p-8">
        <p className="text-sm text-zinc-600">Builder zahteva prijavu.</p>
        <Link href="/login" className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white">
          Prijavi se
        </Link>
      </div>
    )
  }

  if (loadError || !page) {
    return (
      <div className="flex min-h-full flex-1 items-center justify-center bg-zinc-50 p-8 text-sm text-red-600">
        {loadError === 'load' ? 'Landing nije pronađen.' : 'Učitavanje…'}
      </div>
    )
  }

  return (
    <div
      className="flex min-h-full flex-1 flex-col bg-[var(--surface,#f8fafc)] text-[var(--text,#0f172a)]"
      style={
        {
          '--primary': '#0f766e',
          '--surface': '#f8fafc',
          '--border': '#e2e8f0',
          '--text': '#0f172a',
        } as CSSProperties
      }
    >
      <header className="flex items-center justify-between border-b border-[var(--border)] bg-white px-4 py-3">
        <div className="flex flex-col">
          <span className="text-xs text-zinc-500">Builder</span>
          <span className="font-semibold text-zinc-900">{page.title}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-500">
            {saveState === 'saving' && 'Čuvanje…'}
            {saveState === 'saved' && 'Sačuvano'}
            {saveState === 'error' && 'Greška pri čuvanju'}
          </span>
          <Link
            href={`/l/${slug}`}
            target="_blank"
            className="text-sm text-teal-700 hover:underline"
          >
            Pregledaj live
          </Link>
          <button
            type="button"
            onClick={() => void togglePublish()}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
              page.is_active
                ? 'bg-teal-700 text-white'
                : 'border border-zinc-300 bg-white text-zinc-700'
            }`}
          >
            {page.is_active ? 'Objavljeno' : 'Objavi'}
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="w-52 shrink-0 border-r border-[var(--border)] bg-white p-4">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Blokovi
          </h2>
          <div className="flex flex-col gap-2">
            {LIBRARY.map((item) => (
              <button
                key={item.type}
                type="button"
                disabled={!item.enabled}
                onClick={() => item.enabled && addBlock(item.type)}
                className={`rounded-lg border px-3 py-2 text-left text-sm ${
                  item.enabled
                    ? 'border-zinc-200 bg-white hover:border-teal-600 hover:text-teal-800'
                    : 'cursor-not-allowed border-zinc-100 bg-zinc-50 text-zinc-400'
                }`}
              >
                {item.label}
                {!item.enabled && (
                  <span className="mt-0.5 block text-[10px] uppercase">Uskoro</span>
                )}
              </button>
            ))}
          </div>
        </aside>

        <BuilderCanvas
          blocks={blocks}
          slug={page.slug}
          landingPageId={page.id}
          colorPrimary={page.color_primary}
          formFields={formFields}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />

        <aside className="flex w-80 shrink-0 flex-col gap-6 border-l border-[var(--border)] bg-white p-4">
          <div>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Svojstva
            </h2>
            <PropertiesPanel block={selectedBlock} onChange={updateBlock} />
          </div>

          <div>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Live metrika
            </h2>
            <div className="grid grid-cols-3 gap-2">
              <MetricCard label="Pregleda" value={metrics?.views} />
              <MetricCard label="Klikova" value={metrics?.clicks} />
              <MetricCard label="Leadova" value={metrics?.leads} />
            </div>
            <p className="mt-2 text-[10px] text-zinc-400">Osvežava se na 5s · /api/metrics</p>
          </div>
        </aside>
      </div>
    </div>
  )
}
