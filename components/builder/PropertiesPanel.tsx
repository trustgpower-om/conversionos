'use client'

import type { LandingBlock } from '@/lib/builder/types'

import { getStringProp } from '@/components/blocks/block-utils'

type PropertiesPanelProps = {
  block: LandingBlock | null
  onChange: (block: LandingBlock) => void
}

function updateProp(
  block: LandingBlock,
  key: string,
  value: string | null,
): LandingBlock {
  return {
    ...block,
    props: {
      ...(block.props ?? {}),
      [key]: value,
    },
  }
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-zinc-600">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 rounded-md border border-zinc-300 px-2 text-sm outline-none focus:border-teal-700"
      />
    </label>
  )
}

export function PropertiesPanel({ block, onChange }: PropertiesPanelProps) {
  if (!block) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 p-4 text-sm text-zinc-500">
        Izaberite blok na canvasu da biste editovali svojstva.
      </div>
    )
  }

  const props = block.props ?? {}

  return (
    <div className="flex flex-col gap-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {block.type} · {block.id}
      </div>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-zinc-600">trackId</span>
        <input
          value={block.trackId ?? ''}
          onChange={(e) =>
            onChange({
              ...block,
              trackId: e.target.value.trim() === '' ? null : e.target.value,
            })
          }
          placeholder="npr. cta-primary"
          className="h-9 rounded-md border border-zinc-300 px-2 text-sm outline-none focus:border-teal-700"
        />
      </label>

      {block.type === 'hero' && (
        <>
          <Field
            label="Headline"
            value={getStringProp(props, 'headline')}
            onChange={(v) => onChange(updateProp(block, 'headline', v))}
          />
          <Field
            label="Subheadline"
            value={getStringProp(props, 'subheadline')}
            onChange={(v) => onChange(updateProp(block, 'subheadline', v))}
          />
          <Field
            label="CTA tekst"
            value={getStringProp(props, 'ctaText')}
            onChange={(v) => onChange(updateProp(block, 'ctaText', v))}
          />
          <Field
            label="Badge"
            value={getStringProp(props, 'badge')}
            onChange={(v) => onChange(updateProp(block, 'badge', v))}
          />
          <Field
            label="Pozadinska slika (URL)"
            value={getStringProp(props, 'bgImage')}
            onChange={(v) => onChange(updateProp(block, 'bgImage', v))}
          />
        </>
      )}

      {block.type === 'form' && (
        <>
          <Field
            label="Naslov"
            value={getStringProp(props, 'heading')}
            onChange={(v) => onChange(updateProp(block, 'heading', v))}
          />
          <Field
            label="Podtekst"
            value={getStringProp(props, 'subtext')}
            onChange={(v) => onChange(updateProp(block, 'subtext', v))}
          />
          <Field
            label="Dugme"
            value={getStringProp(props, 'submitLabel')}
            onChange={(v) => onChange(updateProp(block, 'submitLabel', v))}
          />
        </>
      )}

      {block.type === 'cta' && (
        <Field
          label="Tekst"
          value={getStringProp(props, 'text')}
          onChange={(v) => onChange(updateProp(block, 'text', v))}
        />
      )}

      {block.type === 'stats' && (
        <p className="text-xs text-zinc-500">
          Stat kartice se edituju kroz JSON u narednoj iteraciji. Za sada dodajte blok sa
          podrazumevanim vrednostima.
        </p>
      )}

      {block.type === 'unit' && (
        <Field
          label="Naslov"
          value={getStringProp(props, 'heading')}
          onChange={(v) => onChange(updateProp(block, 'heading', v))}
        />
      )}
    </div>
  )
}
