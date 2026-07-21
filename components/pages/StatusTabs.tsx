import Link from 'next/link'

import type { StatusCounts } from '@/lib/queries/pages'

type Tab = { key: string; label: string; count: number }

export function StatusTabs({
  counts,
  active,
}: {
  counts: StatusCounts
  active: string
}) {
  const tabs: Tab[] = [
    { key: 'total', label: 'Total', count: counts.total },
    { key: 'published', label: 'Published', count: counts.published },
    { key: 'draft', label: 'Draft', count: counts.draft },
    { key: 'scheduled', label: 'Scheduled', count: counts.scheduled },
    { key: 'archived', label: 'Archived', count: counts.archived },
  ]

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-zinc-200">
      {tabs.map((tab) => {
        const isActive = active === tab.key
        const href = tab.key === 'total' ? '/pages' : `/pages?status=${tab.key}`
        return (
          <Link
            key={tab.key}
            href={href}
            className={`flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            {tab.label}
            <span
              className={`rounded-full px-1.5 py-0.5 text-xs ${
                isActive ? 'bg-teal-50 text-teal-700' : 'bg-zinc-100 text-zinc-500'
              }`}
            >
              {tab.count}
            </span>
          </Link>
        )
      })}
    </div>
  )
}
