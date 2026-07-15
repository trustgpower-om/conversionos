import type { FormFieldDef, LandingBlock } from '@/lib/builder/types'

import { LeadForm } from '@/components/landing/LeadForm'
import { getStringProp } from '@/components/blocks/block-utils'

type FormBlockProps = {
  block: LandingBlock
  slug: string
  landingPageId: string
  formFields?: FormFieldDef[] | null
}

export function FormBlock({ block, slug, landingPageId, formFields }: FormBlockProps) {
  const props = block.props ?? {}
  const heading = getStringProp(props, 'heading')
  const subtext = getStringProp(props, 'subtext')

  return (
    <section id="lead-form" className="w-full scroll-mt-6 bg-white px-8 py-12">
      <div className="mx-auto flex max-w-4xl flex-col gap-4">
        {heading && (
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">{heading}</h2>
        )}
        {subtext && <p className="text-zinc-600">{subtext}</p>}
        <LeadForm
          slug={slug}
          landingPageId={landingPageId}
          fields={formFields ?? undefined}
          trackId={block.trackId ?? 'lead-form'}
          submitLabel={getStringProp(props, 'submitLabel', 'Pošalji upit')}
        />
      </div>
    </section>
  )
}
