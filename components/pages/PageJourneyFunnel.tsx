import type { JourneyStep } from '@/lib/queries/page-analytics'

export function PageJourneyFunnel({ steps }: { steps: JourneyStep[] }) {
  const max = Math.max(1, ...steps.map((s) => s.value))

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <h2 className="mb-3 text-sm font-semibold text-zinc-900">Page Journey</h2>
      <div className="flex flex-col gap-2">
        {steps.map((step, i) => {
          const widthPct = (step.value / max) * 100
          return (
            <div key={step.step} className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-zinc-700">{step.step}</span>
                <span className="flex items-center gap-2 text-zinc-500">
                  <span className="font-semibold text-zinc-900">{step.value.toLocaleString()}</span>
                  {i > 0 && <span className="text-rose-600">−{step.dropOffPct}%</span>}
                </span>
              </div>
              <div className="h-6 w-full overflow-hidden rounded-md bg-zinc-100">
                <div
                  className="flex h-full items-center rounded-md bg-gradient-to-r from-teal-500 to-emerald-600"
                  style={{ width: `${widthPct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
