'use client'

import { useMemo, useState } from 'react'

import { PageCard } from '@/components/pages/PageCard'
import { PageDetailPane } from '@/components/pages/PageDetailPane'
import type { PageListItem, PageSummary } from '@/lib/queries/pages'

export function PagesGallery({
  pages,
  summaries,
}: {
  pages: PageListItem[]
  summaries: Record<string, PageSummary>
}) {
  const [selected, setSelected] = useState<string | null>(pages[0]?.slug ?? null)

  const selectedSummary = useMemo(
    () => (selected ? summaries[selected] ?? null : null),
    [selected, summaries],
  )

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_20rem]">
      <div>
        {pages.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center text-sm text-zinc-400">
            No pages match the current filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {pages.map((page) => (
              <PageCard
                key={page.id}
                page={page}
                selected={selected === page.slug}
                onSelect={setSelected}
              />
            ))}
          </div>
        )}
      </div>

      <div className="lg:sticky lg:top-4 lg:h-[calc(100vh-8rem)]">
        <PageDetailPane summary={selectedSummary} />
      </div>
    </div>
  )
}
