import Link from 'next/link'

import { HeatmapPreview } from '@/components/pages/HeatmapPreview'
import { InsightsPane } from '@/components/pages/InsightsPane'
import { PageJourneyFunnel } from '@/components/pages/PageJourneyFunnel'
import { PageKpiRow } from '@/components/pages/PageKpiRow'
import { PageTimeseriesChart } from '@/components/pages/PageTimeseriesChart'
import { SourcesTable } from '@/components/pages/SourcesTable'
import {
  getHeatmap,
  getPageAnalytics,
  getPageInsights,
  getPageJourney,
  getPageSources,
  getPageTimeseries,
} from '@/lib/queries/page-analytics'

export default async function PageDetailAnalytics({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const [analytics, timeseries, journey, sources, heatmap, insights] = await Promise.all([
    getPageAnalytics(slug),
    getPageTimeseries(slug),
    getPageJourney(slug),
    getPageSources(slug),
    getHeatmap(slug),
    getPageInsights(slug),
  ])

  return (
    <div className="flex flex-col gap-5 p-6">
      <div className="flex items-center gap-2 text-sm text-zinc-500">
        <Link href="/pages" className="hover:text-teal-700">
          Pages
        </Link>
        <span>/</span>
        <span className="text-zinc-800">{analytics.title}</span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900">{analytics.title}</h1>
          <p className="text-sm text-zinc-500">/{slug}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/l/${slug}`}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Preview
          </Link>
          <Link
            href={`/builder/${slug}`}
            className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800"
          >
            Edit
          </Link>
        </div>
      </div>

      <PageKpiRow kpis={analytics.kpis} />

      <PageTimeseriesChart data={timeseries} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <PageJourneyFunnel steps={journey} />
        <HeatmapPreview heatmap={heatmap} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_20rem]">
        <SourcesTable rows={sources} />
        <InsightsPane insights={insights} />
      </div>
    </div>
  )
}
