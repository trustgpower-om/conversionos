'use client'

import { useState } from 'react'

import type { HeatmapData } from '@/lib/queries/page-analytics'

export function HeatmapPreview({ heatmap }: { heatmap: HeatmapData }) {
  const [showClicks, setShowClicks] = useState(true)

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900">Heatmap</h2>
        <label className="flex items-center gap-2 text-xs text-zinc-600">
          Show clicks
          <button
            type="button"
            role="switch"
            aria-checked={showClicks}
            onClick={() => setShowClicks((v) => !v)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              showClicks ? 'bg-teal-600' : 'bg-zinc-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                showClicks ? 'translate-x-4' : 'translate-x-0.5'
              }`}
            />
          </button>
        </label>
      </div>

      <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-dashed border-zinc-300 bg-zinc-50">
        <div className="absolute inset-0 flex items-center justify-center text-xs text-zinc-400">
          Page preview
        </div>
        {showClicks &&
          heatmap.points.map((pt, i) => (
            <span
              key={i}
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-rose-500 mix-blend-multiply"
              style={{
                left: `${pt.xPct}%`,
                top: `${pt.yPct}%`,
                width: `${24 + pt.weight * 48}px`,
                height: `${24 + pt.weight * 48}px`,
                opacity: 0.25 + pt.weight * 0.4,
                filter: 'blur(6px)',
              }}
            />
          ))}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-zinc-500">{heatmap.totalClicks.toLocaleString()} clicks tracked</span>
        <button
          type="button"
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
        >
          View Full Heatmap
        </button>
      </div>
    </div>
  )
}
