import { notFound } from 'next/navigation'

import { LeadForm } from '@/components/landing/LeadForm'
import { TrackingProvider } from '@/components/tracking/TrackingProvider'
import { supabaseAdminClient } from '@/lib/supabase/admin'

type Props = {
  params: Promise<{ slug: string }>
}

export default async function LandingPage({ params }: Props) {
  const { slug } = await params

  const { data } = await supabaseAdminClient
    .from('landing_pages')
    .select(
      'id, profile_id, slug, title, headline, subheadline, hero_image_url, cta_text, color_primary',
    )
    .eq('slug', slug)
    .eq('is_active', true)
    .limit(1)

  const page = data?.[0]
  if (!page) {
    notFound()
  }

  return (
    <>
      <TrackingProvider
        profileId={page.profile_id ?? undefined}
        landingPageId={page.id}
      />
      <div className="flex flex-1 flex-col items-center bg-zinc-50 dark:bg-black">
        {/* Hero */}
        <section
          className="flex w-full max-w-4xl flex-col items-start justify-end gap-6 px-8 py-24"
          style={{
            backgroundImage: `linear-gradient(rgba(8,12,18,.25), rgba(8,12,18,.82)), url(${page.hero_image_url ?? ''})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            minHeight: '60vh',
          }}
        >
          <span className="inline-flex items-center rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur">
            Novo · Beograd
          </span>
          <h1 className="max-w-2xl text-4xl font-semibold leading-tight tracking-tight text-white">
            {page.headline ?? page.title}
          </h1>
          {page.subheadline && (
            <p className="max-w-xl text-lg text-white/90">{page.subheadline}</p>
          )}
          <a
            href="#lead-form"
            data-track-id="cta-primary"
            data-track-label={page.cta_text ?? 'CTA'}
            className="inline-flex h-12 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-zinc-900 transition-colors hover:bg-zinc-200"
          >
            {page.cta_text ?? 'Saznaj više'}
          </a>
        </section>

        {/* Lead form */}
        <section
          id="lead-form"
          className="flex w-full max-w-4xl scroll-mt-6 flex-col gap-6 px-8 py-16"
        >
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Zakažite obilazak
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400">
              Ostavite kontakt i agent vas zove u roku od 2 sata radnim danom.
            </p>
          </div>
          <LeadForm slug={page.slug} landingPageId={page.id} />
        </section>
      </div>
    </>
  )
}
