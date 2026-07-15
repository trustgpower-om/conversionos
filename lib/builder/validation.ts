import type { FormFieldDef, FormFieldName, LandingBlock } from '@/lib/builder/types'

const FORM_FIELD_NAMES = new Set<FormFieldName>(['name', 'phone', 'email', 'message'])
const FORM_FIELD_TYPES = new Set(['text', 'tel', 'email', 'textarea'])

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function parseCustomSections(value: unknown): LandingBlock[] | null {
  if (!Array.isArray(value)) {
    return null
  }

  const blocks: LandingBlock[] = []

  for (const item of value) {
    if (!isPlainObject(item)) {
      return null
    }

    if (typeof item.id !== 'string' || item.id.trim() === '') {
      return null
    }

    if (typeof item.type !== 'string' || item.type.trim() === '') {
      return null
    }

    const block: LandingBlock = {
      id: item.id,
      type: item.type,
    }

    if (item.trackId !== undefined && item.trackId !== null) {
      if (typeof item.trackId !== 'string') {
        return null
      }
      block.trackId = item.trackId
    } else if (item.trackId === null) {
      block.trackId = null
    }

    if (item.props !== undefined) {
      if (!isPlainObject(item.props)) {
        return null
      }
      block.props = item.props
    }

    blocks.push(block)
  }

  return blocks
}

export function parseFormFields(value: unknown): FormFieldDef[] | null {
  if (!Array.isArray(value)) {
    return null
  }

  const fields: FormFieldDef[] = []

  for (const item of value) {
    if (!isPlainObject(item)) {
      return null
    }

    if (typeof item.name !== 'string' || !FORM_FIELD_NAMES.has(item.name as FormFieldName)) {
      continue
    }

    if (typeof item.label !== 'string') {
      return null
    }

    if (typeof item.type !== 'string' || !FORM_FIELD_TYPES.has(item.type)) {
      return null
    }

    const field: FormFieldDef = {
      name: item.name as FormFieldName,
      label: item.label,
      type: item.type as FormFieldDef['type'],
    }

    if (item.required !== undefined) {
      if (typeof item.required !== 'boolean') {
        return null
      }
      field.required = item.required
    }

    if (item.placeholder !== undefined) {
      if (typeof item.placeholder !== 'string') {
        return null
      }
      field.placeholder = item.placeholder
    }

    fields.push(field)
  }

  return fields
}
