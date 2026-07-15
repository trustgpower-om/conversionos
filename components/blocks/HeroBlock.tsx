import type { LandingBlock } from '@/lib/builder/types'

import {
  ctaClassName,
  ctaInlineStyle,
  getCtaStyleProp,
  getNullableStringProp,
  getStringProp,
  resolveCtaColor,
} from '@/components/blocks/block-utils'

type HeroBlockProps = {
  block: LandingBlock
  colorPrimary?: string | null
}

export function HeroBlock({ block, colorPrimary }: HeroBlockProps) {
  const props = block.props ?? {}
  const ctaStyle = getCtaStyleProp(props)
  const ctaColor = resolveCtaColor(props, colorPrimary)
  const bgImage = getNullableStringProp(props, 'bgImage')
  const badge = getNullableStringProp(props, 'badge')

  return (
    <section
      className="relative flex min-h-[50vh] w-full flex-col items-start justify-end gap-4 px-8 py-16"
      style={{
        backgroundImage: bgImage
          ? `linear-gradient(rgba(8,12,18,.25), rgba(8,12,18,.82)), url(${bgImage})`
          : 'linear-gradient(135deg, #0f766e 0%, #134e4a 100%)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {badge && (
        <span className="inline-flex items-center rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur">
          {badge}
        </span>
      )}
      <h1 className="max-w-2xl text-3xl font-semibold leading-tight text-white">
        {getStringProp(props, 'headline', 'Naslov')}
      </h1>
      {getStringProp(props, 'subheadline') && (
        <p className="max-w-xl text-lg text-white/90">{getStringProp(props, 'subheadline')}</p>
      )}
      <a
        href="#lead-form"
        data-track-id={block.trackId ?? undefined}
        data-track-label={getStringProp(props, 'ctaText', 'CTA')}
        className={ctaClassName(ctaStyle)}
        style={ctaInlineStyle(ctaStyle, ctaColor)}
      >
        {getStringProp(props, 'ctaText', 'Saznaj više')}
      </a>
    </section>
  )
}
