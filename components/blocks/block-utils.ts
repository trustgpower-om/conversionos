import type { CSSProperties } from 'react'

import type { CtaStyle } from '@/lib/builder/types'

export function getStringProp(
  props: Record<string, unknown> | undefined,
  key: string,
  fallback = '',
): string {
  const value = props?.[key]
  return typeof value === 'string' ? value : fallback
}

export function getNullableStringProp(
  props: Record<string, unknown> | undefined,
  key: string,
): string | null {
  const value = props?.[key]
  if (value === null) {
    return null
  }
  return typeof value === 'string' ? value : null
}

export function getCtaStyleProp(
  props: Record<string, unknown> | undefined,
): CtaStyle {
  const value = props?.ctaStyle
  if (value === 'outline' || value === 'text' || value === 'filled') {
    return value
  }
  return 'filled'
}

export function resolveCtaColor(
  props: Record<string, unknown> | undefined,
  colorPrimary?: string | null,
): string {
  return getNullableStringProp(props, 'ctaColor') ?? colorPrimary ?? '#0f766e'
}

export function ctaClassName(style: CtaStyle): string {
  const base =
    'inline-flex h-11 items-center justify-center rounded-full px-6 text-sm font-semibold transition-colors'

  switch (style) {
    case 'outline':
      return `${base} border-2 bg-transparent`
    case 'text':
      return `${base} bg-transparent underline-offset-4 hover:underline`
    default:
      return `${base} text-white`
  }
}

export function ctaInlineStyle(style: CtaStyle, color: string): CSSProperties {
  if (style === 'filled') {
    return { backgroundColor: color }
  }
  if (style === 'outline') {
    return { borderColor: color, color }
  }
  return { color }
}
