import type { SourceRow } from '@/lib/queries/page-analytics'

function Delta({ value }: { value: number }) {
  const positive = value >= 0
  return (
    <span className={positive ? 'text-emerald-600' : 'text-rose-600'}>
      {positive ? '▲' : '▼'} {Math.abs(value).toFixed(1)}%
    </span>
  )
}

export function SourcesTable({ rows }: { rows: SourceRow[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
      <div className="border-b border-zinc-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-zinc-900">Sources</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left text-xs uppercase tracking-wide text-zinc-400">
              <th className="px-4 py-2 font-medium">Source</th>
              <th className="px-4 py-2 text-right font-medium">Page Views</th>
              <th className="px-4 py-2 text-right font-medium">Unique Visitors</th>
              <th className="px-4 py-2 text-right font-medium">CTA Click Rate</th>
              <th className="px-4 py-2 text-right font-medium">Conversions</th>
              <th className="px-4 py-2 text-right font-medium">Conv Rate</th>
              <th className="px-4 py-2 text-right font-medium">Δ</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.source} className="border-b border-zinc-100 last:border-0">
                <td className="px-4 py-2.5 font-medium text-zinc-800">{row.source}</td>
                <td className="px-4 py-2.5 text-right text-zinc-700">{row.pageViews.toLocaleString()}</td>
                <td className="px-4 py-2.5 text-right text-zinc-700">{row.uniqueVisitors.toLocaleString()}</td>
                <td className="px-4 py-2.5 text-right text-zinc-700">{row.ctaClickRate.toFixed(1)}%</td>
                <td className="px-4 py-2.5 text-right text-zinc-700">{row.conversions}</td>
                <td className="px-4 py-2.5 text-right text-zinc-700">{row.convRate.toFixed(1)}%</td>
                <td className="px-4 py-2.5 text-right">
                  <Delta value={row.deltaPct} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
