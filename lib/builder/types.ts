export type FormFieldName = 'name' | 'phone' | 'email' | 'message'

export type FormFieldType = 'text' | 'tel' | 'email' | 'textarea'

export type FormFieldDef = {
  name: FormFieldName
  label: string
  type: FormFieldType
  required?: boolean
  placeholder?: string
}

export type CtaStyle = 'filled' | 'outline' | 'text'

export type LandingBlock = {
  id: string
  type: string
  trackId?: string | null
  props?: Record<string, unknown>
}

export type LandingPageEditor = {
  id: string
  slug: string
  title: string
  is_active: boolean | null
  headline: string | null
  subheadline: string | null
  cta_text: string | null
  color_primary: string | null
  hero_image_url: string | null
  custom_sections: LandingBlock[] | null
  form_fields: FormFieldDef[] | null
  profile_id: string | null
}

export const IMPLEMENTED_BLOCK_TYPES = ['hero', 'stats', 'unit', 'form', 'cta'] as const

export type ImplementedBlockType = (typeof IMPLEMENTED_BLOCK_TYPES)[number]
