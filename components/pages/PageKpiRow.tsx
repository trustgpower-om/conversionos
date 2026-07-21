import type { KpiMetric } from '@/lib/queries/page-analytics'

function DeltaBadge({ deltaPct }: { deltaPct: number }) {
  const positive = deltaPct >= 0
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium ${
        positive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
      }`}
    >
      {positive ? '▲' : '▼'} {Math.abs(deltaPct).toFixed(1)}%
    </span>
  )
}

export function PageKpiRow({ kpis }: { kpis: KpiMetric[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      {kpis.map((kpi) => (
        <div key={kpi.key} className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-xs font-medium text-zinc-500">{kpi.label}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">{kpi.display}</p>
          <div className="mt-2 flex items-center gap-1">
            <DeltaBadge deltaPct={kpi.deltaPct} />
            <span className="text-[11px] text-zinc-400">vs prev</span>
          </div>
        </div>
      ))}
    </div>
  )
}
