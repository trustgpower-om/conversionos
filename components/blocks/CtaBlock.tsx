import type { LandingBlock } from '@/lib/builder/types'

import {
  ctaClassName,
  ctaInlineStyle,
  getCtaStyleProp,
  getStringProp,
  resolveCtaColor,
} from '@/components/blocks/block-utils'

type CtaBlockProps = {
  block: LandingBlock
  colorPrimary?: string | null
}

export function CtaBlock({ block, colorPrimary }: CtaBlockProps) {
  const props = block.props ?? {}
  const ctaStyle = getCtaStyleProp(props)
  const ctaColor = resolveCtaColor(props, colorPrimary)

  return (
    <section className="flex w-full justify-center bg-white px-8 py-10">
      <a
        href="#lead-form"
        data-track-id={block.trackId ?? undefined}
        data-track-label={getStringProp(props, 'text', 'CTA')}
        className={ctaClassName(ctaStyle)}
        style={ctaInlineStyle(ctaStyle, ctaColor)}
      >
        {getStringProp(props, 'text', 'Zatraži informacije')}
      </a>
    </section>
  )
}
