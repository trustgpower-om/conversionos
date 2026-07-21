import type { TimeseriesPoint } from '@/lib/queries/page-analytics'

const WIDTH = 720
const HEIGHT = 220
const PAD = { top: 16, right: 16, bottom: 28, left: 16 }

function buildPath(values: number[], max: number): string {
  const innerW = WIDTH - PAD.left - PAD.right
  const innerH = HEIGHT - PAD.top - PAD.bottom
  const stepX = values.length > 1 ? innerW / (values.length - 1) : 0
  return values
    .map((v, i) => {
      const x = PAD.left + stepX * i
      const y = PAD.top + innerH - (max > 0 ? (v / max) * innerH : 0)
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
}

export function PageTimeseriesChart({ data }: { data: TimeseriesPoint[] }) {
  const views = data.map((d) => d.views)
  const conversions = data.map((d) => d.conversions)
  const viewsMax = Math.max(1, ...views)
  const convMax = Math.max(1, ...conversions)

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900">Page Performance Over Time</h2>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5 text-zinc-600">
            <span className="h-2 w-2 rounded-full bg-teal-500" /> Page Views
          </span>
          <span className="flex items-center gap-1.5 text-zinc-600">
            <span className="h-2 w-2 rounded-full bg-indigo-500" /> Conversions
          </span>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-56 w-full"
        role="img"
        aria-label="Page views and conversions over time"
      >
        {[0.25, 0.5, 0.75, 1].map((frac) => {
          const y = PAD.top + (HEIGHT - PAD.top - PAD.bottom) * frac
          return (
            <line
              key={frac}
              x1={PAD.left}
              x2={WIDTH - PAD.right}
              y1={y}
              y2={y}
              stroke="#f1f5f9"
              strokeWidth={1}
            />
          )
        })}

        <path d={buildPath(views, viewsMax)} fill="none" stroke="#14b8a6" strokeWidth={2.5} />
        <path d={buildPath(conversions, convMax)} fill="none" stroke="#6366f1" strokeWidth={2.5} />

        {data.map((d, i) => {
          const innerW = WIDTH - PAD.left - PAD.right
          const stepX = data.length > 1 ? innerW / (data.length - 1) : 0
          const x = PAD.left + stepX * i
          if (i % 2 !== 0) return null
          return (
            <text key={d.date} x={x} y={HEIGHT - 8} textAnchor="middle" fontSize={10} fill="#a1a1aa">
              {d.date.slice(5)}
            </text>
          )
        })}
      </svg>
    </div>
  )
}
