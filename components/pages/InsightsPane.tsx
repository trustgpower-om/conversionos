import type { InsightItem } from '@/lib/queries/page-analytics'

const TONE_STYLES: Record<InsightItem['tone'], string> = {
  positive: 'border-emerald-200 bg-emerald-50',
  neutral: 'border-zinc-200 bg-zinc-50',
  warning: 'border-amber-200 bg-amber-50',
}

const KIND_ICON: Record<InsightItem['kind'], string> = {
  trend: '📈',
  engagement: '◎',
  anomaly: '⚠',
}

export function InsightsPane({ insights }: { insights: InsightItem[] }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <h2 className="mb-3 text-sm font-semibold text-zinc-900">Insights</h2>
      <div className="flex flex-col gap-3">
        {insights.map((insight) => (
          <div key={insight.id} className={`rounded-lg border p-3 ${TONE_STYLES[insight.tone]}`}>
            <p className="flex items-center gap-2 text-sm font-medium text-zinc-900">
              <span aria-hidden>{KIND_ICON[insight.kind]}</span>
              {insight.title}
            </p>
            <p className="mt-1 text-xs text-zinc-600">{insight.detail}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
