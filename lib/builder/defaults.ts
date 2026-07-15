import type { FormFieldDef, LandingBlock, LandingPageEditor } from '@/lib/builder/types'

export const DEFAULT_FORM_FIELDS: FormFieldDef[] = [
  {
    name: 'name',
    label: 'Vaše ime',
    type: 'text',
    required: true,
    placeholder: 'Vaše ime',
  },
  {
    name: 'phone',
    label: 'Telefon',
    type: 'tel',
    required: true,
    placeholder: '+381 ...',
  },
  {
    name: 'email',
    label: 'Email',
    type: 'email',
    required: false,
    placeholder: 'ime@primer.rs',
  },
  {
    name: 'message',
    label: 'Poruka',
    type: 'textarea',
    required: false,
    placeholder: 'Poruka (opciono)',
  },
]

export function buildDraftBlocks(page: Pick<
  LandingPageEditor,
  'title' | 'headline' | 'subheadline' | 'cta_text' | 'color_primary' | 'hero_image_url'
>): LandingBlock[] {
  return [
    {
      id: 'hero-1',
      type: 'hero',
      trackId: 'cta-primary',
      props: {
        badge: 'Novo · Beograd',
        headline: page.headline ?? page.title,
        subheadline: page.subheadline ?? '',
        ctaText: page.cta_text ?? 'Saznaj više',
        ctaStyle: 'filled',
        ctaColor: page.color_primary ?? '#0f766e',
        bgImage: page.hero_image_url,
      },
    },
    {
      id: 'form-1',
      type: 'form',
      trackId: 'lead-form',
      props: {
        heading: 'Zakažite obilazak',
        subtext: 'Ostavite kontakt i agent vas zove u roku od 2 sata radnim danom.',
        submitLabel: 'Pošalji upit',
      },
    },
  ]
}

export function defaultPropsForBlockType(type: string): Record<string, unknown> {
  switch (type) {
    case 'hero':
      return {
        badge: 'Novo',
        headline: 'Naslov',
        subheadline: 'Podnaslov',
        ctaText: 'Saznaj više',
        ctaStyle: 'filled',
        ctaColor: '#0f766e',
        bgImage: null,
      }
    case 'stats':
      return {
        items: [
          { value: '120+', label: 'Stanova' },
          { value: '15', label: 'Godina iskustva' },
          { value: '98%', label: 'Zadovoljnih klijenata' },
        ],
      }
    case 'unit':
      return {
        heading: 'Izdvajamo',
        ctaText: null,
        items: [
          {
            price: '€185.000',
            location: 'Vračar',
            image: null,
            m2: '72',
            rooms: '3',
            floor: '4/6',
          },
        ],
      }
    case 'form':
      return {
        heading: 'Kontaktirajte nas',
        subtext: 'Popunite formu i javićemo vam se uskoro.',
        submitLabel: 'Pošalji upit',
      }
    case 'cta':
      return {
        text: 'Zatraži informacije',
        ctaStyle: 'filled',
        ctaColor: '#0f766e',
      }
    default:
      return {}
  }
}

export function defaultTrackIdForType(type: string): string | null {
  if (type === 'form') {
    return 'lead-form'
  }
  if (type === 'hero' || type === 'cta') {
    return 'cta-primary'
  }
  if (type === 'unit') {
    return 'unit-card'
  }
  return null
}
