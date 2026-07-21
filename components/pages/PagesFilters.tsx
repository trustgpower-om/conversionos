'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

import type { PagesFilterOptions } from '@/lib/queries/pages'

const selectClass =
  'h-9 rounded-lg border border-zinc-300 bg-white px-2 text-sm text-zinc-800 outline-none focus:border-teal-600'

export function PagesFilters({ options }: { options: PagesFilterOptions }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const setParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) params.set(key, value)
      else params.delete(key)
      router.replace(`/pages?${params.toString()}`)
    },
    [router, searchParams],
  )

  const value = (key: string) => searchParams.get(key) ?? ''
  const hasFilters = Array.from(searchParams.keys()).length > 0

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative">
        <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400">
          ⌕
        </span>
        <input
          type="search"
          defaultValue={value('q')}
          onChange={(e) => setParam('q', e.target.value)}
          placeholder="Search pages"
          className="h-9 w-48 rounded-lg border border-zinc-300 bg-white pl-8 pr-3 text-sm outline-none focus:border-teal-600"
        />
      </div>

      <select className={selectClass} value={value('status')} onChange={(e) => setParam('status', e.target.value)}>
        <option value="">Status</option>
        {options.statuses.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>

      <select className={selectClass} value={value('type')} onChange={(e) => setParam('type', e.target.value)}>
        <option value="">Property Type</option>
        {options.types.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>

      <select className={selectClass} value={value('project')} onChange={(e) => setParam('project', e.target.value)}>
        <option value="">Project</option>
        {options.projects.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>

      <select className={selectClass} value={value('agent')} onChange={(e) => setParam('agent', e.target.value)}>
        <option value="">Agent</option>
        {options.agents.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </select>

      <select className={selectClass} value={value('campaign')} onChange={(e) => setParam('campaign', e.target.value)}>
        <option value="">Campaign Source</option>
        {options.campaignSources.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <select className={selectClass} value={value('owner')} onChange={(e) => setParam('owner', e.target.value)}>
        <option value="">Owner</option>
        {options.agents.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </select>

      {hasFilters && (
        <button
          type="button"
          onClick={() => router.replace('/pages')}
          className="h-9 rounded-lg px-3 text-sm font-medium text-zinc-500 hover:text-zinc-800"
        >
          Clear filters
        </button>
      )}
    </div>
  )
}
