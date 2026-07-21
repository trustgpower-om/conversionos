import Link from 'next/link'

import { PagesFilters } from '@/components/pages/PagesFilters'
import { PagesGallery } from '@/components/pages/PagesGallery'
import { StatusTabs } from '@/components/pages/StatusTabs'
import {
  getPagesCountByStatus,
  getPagesFilterOptions,
  getPagesList,
  getPageSummary,
  type PageSummary,
  type PagesListOptions,
} from '@/lib/queries/pages'

type SearchParams = Record<string, string | string[] | undefined>

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

export default async function PagesGalleryPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams
  const opts: PagesListOptions = {
    status: first(sp.status),
    type: first(sp.type),
    project: first(sp.project),
    agent: first(sp.agent),
    campaign: first(sp.campaign),
    owner: first(sp.owner),
    q: first(sp.q),
    sort: first(sp.sort),
  }

  const [{ pages, total }, counts, filterOptions] = await Promise.all([
    getPagesList(opts),
    getPagesCountByStatus(),
    getPagesFilterOptions(),
  ])

  const summaryEntries = await Promise.all(
    pages.map(async (p) => [p.slug, await getPageSummary(p.slug)] as const),
  )
  const summaries: Record<string, PageSummary> = {}
  for (const [slug, summary] of summaryEntries) {
    if (summary) summaries[slug] = summary
  }

  return (
    <div className="flex flex-col gap-5 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Pages</h1>
          <p className="text-sm text-zinc-500">{total} pages match your view</p>
        </div>
        <Link
          href="/builder/new-page"
          className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800"
        >
          + New Page
        </Link>
      </div>

      <StatusTabs counts={counts} active={opts.status ?? 'total'} />
      <PagesFilters options={filterOptions} />
      <PagesGallery pages={pages} summaries={summaries} />
    </div>
  )
}
