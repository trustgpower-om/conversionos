import Link from 'next/link'

import type { PageListItem, PageStatus } from '@/lib/queries/pages'

const STATUS_STYLES: Record<PageStatus, string> = {
  published: 'bg-emerald-50 text-emerald-700',
  draft: 'bg-zinc-100 text-zinc-600',
  scheduled: 'bg-amber-50 text-amber-700',
  archived: 'bg-rose-50 text-rose-700',
}

const STATUS_LABELS: Record<PageStatus, string> = {
  published: 'Published',
  draft: 'Draft',
  scheduled: 'Scheduled',
  archived: 'Archived',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function PageCard({
  page,
  selected,
  onSelect,
}: {
  page: PageListItem
  selected: boolean
  onSelect: (slug: string) => void
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(page.slug)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect(page.slug)
        }
      }}
      aria-pressed={selected}
      className={`group flex cursor-pointer flex-col overflow-hidden rounded-xl border bg-white text-left transition-shadow hover:shadow-md ${
        selected ? 'border-teal-500 ring-2 ring-teal-500/30' : 'border-zinc-200'
      }`}
    >
      <div className={`relative h-32 bg-gradient-to-br ${page.thumbnailColor}`}>
        <span
          className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLES[page.status]}`}
        >
          {STATUS_LABELS[page.status]}
        </span>
        <span className="absolute bottom-2 left-2 rounded-md bg-black/40 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur">
          {page.type}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-zinc-900">{page.title}</h3>
          {page.price !== '$0' && (
            <span className="shrink-0 text-sm font-semibold text-teal-700">{page.price}</span>
          )}
        </div>
        <Link
          href={`/pages/${page.slug}`}
          onClick={(e) => e.stopPropagation()}
          className="w-fit text-xs text-zinc-500 hover:text-teal-700 hover:underline"
        >
          /{page.slug}
        </Link>

        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold text-white ${page.agent.avatarColor}`}
            >
              {page.agent.initials}
            </span>
            <span className="text-xs text-zinc-600">{page.agent.name}</span>
          </div>
          <span className="text-[11px] text-zinc-400">Updated {formatDate(page.updatedAt)}</span>
        </div>
      </div>
    </div>
  )
}
