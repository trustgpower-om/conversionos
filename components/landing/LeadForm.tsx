'use client'

import { useState, type FormEvent } from 'react'

import type { FormFieldDef } from '@/lib/builder/types'
import { getOrCreateSessionId } from '@/lib/tracking/client'

type LeadFormProps = {
  slug: string
  landingPageId: string
  fields?: FormFieldDef[]
  trackId?: string
  submitLabel?: string
}

const DEFAULT_FIELDS: FormFieldDef[] = [
  { name: 'name', label: 'Ime', type: 'text', required: true, placeholder: 'Vaše ime' },
  { name: 'phone', label: 'Telefon', type: 'tel', required: true, placeholder: '+381 …' },
  { name: 'email', label: 'Email', type: 'email', placeholder: 'ime@primer.rs' },
  { name: 'message', label: 'Poruka', type: 'textarea', placeholder: 'Opciono' },
]

export function LeadForm({
  slug,
  landingPageId,
  fields = DEFAULT_FIELDS,
  trackId = 'lead-form',
  submitLabel = 'Pošalji upit',
}: LeadFormProps) {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>(
    'idle',
  )

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus('submitting')

    const form = event.currentTarget
    const data = new FormData(form)
    const sessionId = getOrCreateSessionId()

    try {
      const res = await fetch('/api/leads/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          slug,
          landing_page_id: landingPageId,
          name: data.get('name'),
          phone: data.get('phone'),
          email: data.get('email'),
          message: data.get('message'),
        }),
        keepalive: true,
      })

      if (!res.ok) {
        setStatus('error')
        return
      }

      setStatus('success')
      form.reset()
    } catch {
      setStatus('error')
    }
  }

  const inputClass =
    'h-11 rounded-lg border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-100'

  return (
    <form
      data-track-id={trackId}
      onSubmit={handleSubmit}
      className="flex w-full max-w-md flex-col gap-3"
    >
      {fields.map((field) => (
        <label key={field.name} className="flex flex-col gap-1">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {field.label}
          </span>
          {field.type === 'textarea' ? (
            <textarea
              name={field.name}
              required={field.required}
              placeholder={field.placeholder}
              rows={2}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-100"
            />
          ) : (
            <input
              name={field.name}
              type={field.type}
              required={field.required}
              placeholder={field.placeholder}
              className={inputClass}
            />
          )}
        </label>
      ))}
      <button
        type="submit"
        disabled={status === 'submitting'}
        className="mt-2 h-11 rounded-lg bg-zinc-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {status === 'submitting' ? 'Slanje…' : submitLabel}
      </button>
      {status === 'success' && (
        <p className="text-sm text-emerald-600">
          Hvala! Agent vas kontaktira uskoro.
        </p>
      )}
      {status === 'error' && (
        <p className="text-sm text-red-600">Greška pri slanju. Pokušajte ponovo.</p>
      )}
    </form>
  )
}
