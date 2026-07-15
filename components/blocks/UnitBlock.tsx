import type { LandingBlock } from '@/lib/builder/types'

import { getStringProp } from '@/components/blocks/block-utils'

type UnitBlockProps = {
  block: LandingBlock
}

type UnitItem = {
  price: string
  location: string
  image: string | null
  m2: string
  rooms: string
  floor: string
}

function parseItems(props: Record<string, unknown> | undefined): UnitItem[] {
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
      if (
        typeof record.price !== 'string' ||
        typeof record.location !== 'string' ||
        typeof record.m2 !== 'string' ||
        typeof record.rooms !== 'string' ||
        typeof record.floor !== 'string'
      ) {
        return null
      }
      return {
        price: record.price,
        location: record.location,
        image: typeof record.image === 'string' ? record.image : null,
        m2: record.m2,
        rooms: record.rooms,
        floor: record.floor,
      }
    })
    .filter((item): item is UnitItem => item !== null)
}

export function UnitBlock({ block }: UnitBlockProps) {
  const props = block.props ?? {}
  const items = parseItems(props)
  const heading = getStringProp(props, 'heading')

  return (
    <section className="w-full bg-zinc-50 px-8 py-12">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        {heading && <h2 className="text-2xl font-semibold text-zinc-900">{heading}</h2>}
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <article
              key={`${item.location}-${item.price}`}
              data-track-id={block.trackId ?? undefined}
              className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm"
            >
              <div
                className="h-40 bg-zinc-200"
                style={
                  item.image
                    ? {
                        backgroundImage: `url(${item.image})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }
                    : undefined
                }
              />
              <div className="flex flex-col gap-2 p-4">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-lg font-semibold text-zinc-900">{item.price}</span>
                  <span className="text-sm text-zinc-500">{item.location}</span>
                </div>
                <p className="text-sm text-zinc-600">
                  {item.m2} m² · {item.rooms} sobe · sprat {item.floor}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
