import type { LandingBlock } from '@/lib/builder/types'

type StatsBlockProps = {
  block: LandingBlock
}

type StatItem = {
  value: string
  label: string
}

function parseItems(props: Record<string, unknown> | undefined): StatItem[] {
  const raw = props?.items
  if (!Array.isArray(raw)) {
    return []
  }

  return raw
    .map((item) => {
      if (typeof item !== 'object' || item === null) {
        return null
      }
      const record = item as Record<string, unknown>
      if (typeof record.value !== 'string' || typeof record.label !== 'string') {
        return null
      }
      return { value: record.value, label: record.label }
    })
    .filter((item): item is StatItem => item !== null)
}

export function StatsBlock({ block }: StatsBlockProps) {
  const items = parseItems(block.props)

  return (
    <section className="w-full bg-white px-8 py-12">
      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-3">
        {items.map((item) => (
          <div
            key={`${item.label}-${item.value}`}
            className="flex flex-col gap-1 rounded-2xl bg-zinc-50 p-5"
          >
            <span className="text-3xl font-semibold text-zinc-900">{item.value}</span>
            <span className="text-sm text-zinc-500">{item.label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
