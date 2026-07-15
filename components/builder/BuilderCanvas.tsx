'use client'

import type { FormFieldDef, LandingBlock } from '@/lib/builder/types'

import { BlockRenderer } from '@/components/blocks/BlockRenderer'

type BuilderCanvasProps = {
  blocks: LandingBlock[]
  slug: string
  landingPageId: string
  colorPrimary?: string | null
  formFields?: FormFieldDef[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export function BuilderCanvas({
  blocks,
  slug,
  landingPageId,
  colorPrimary,
  formFields,
  selectedId,
  onSelect,
}: BuilderCanvasProps) {
  return (
    <div className="flex flex-1 flex-col overflow-y-auto bg-zinc-100 p-6">
      <div className="mx-auto w-full max-w-3xl overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        {blocks.length === 0 ? (
          <div className="flex min-h-[240px] items-center justify-center p-8 text-sm text-zinc-500">
            Dodajte blok iz biblioteke levo.
          </div>
        ) : (
          blocks.map((block) => {
            const isSelected = block.id === selectedId
            return (
              <div
                key={block.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelect(block.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    onSelect(block.id)
                  }
                }}
                className={`relative cursor-pointer outline-none ${isSelected ? 'ring-2 ring-teal-600 ring-inset' : ''}`}
              >
                {block.trackId && (
                  <span
                    className="absolute right-3 top-3 z-10 h-2.5 w-2.5 rounded-full bg-teal-500 shadow"
                    title={`trackId: ${block.trackId}`}
                  />
                )}
                <BlockRenderer
                  block={block}
                  slug={slug}
                  landingPageId={landingPageId}
                  colorPrimary={colorPrimary}
                  formFields={formFields}
                />
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
