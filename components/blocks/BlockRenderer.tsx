import type { FormFieldDef, LandingBlock } from '@/lib/builder/types'

import { CtaBlock } from '@/components/blocks/CtaBlock'
import { FormBlock } from '@/components/blocks/FormBlock'
import { HeroBlock } from '@/components/blocks/HeroBlock'
import { StatsBlock } from '@/components/blocks/StatsBlock'
import { UnitBlock } from '@/components/blocks/UnitBlock'

type BlockRendererProps = {
  block: LandingBlock
  slug: string
  landingPageId: string
  colorPrimary?: string | null
  formFields?: FormFieldDef[] | null
}

export function BlockRenderer({
  block,
  slug,
  landingPageId,
  colorPrimary,
  formFields,
}: BlockRendererProps) {
  switch (block.type) {
    case 'hero':
      return <HeroBlock block={block} colorPrimary={colorPrimary} />
    case 'stats':
      return <StatsBlock block={block} />
    case 'unit':
      return <UnitBlock block={block} />
    case 'form':
      return (
        <FormBlock
          block={block}
          slug={slug}
          landingPageId={landingPageId}
          formFields={formFields}
        />
      )
    case 'cta':
      return <CtaBlock block={block} colorPrimary={colorPrimary} />
    default:
      return null
  }
}
