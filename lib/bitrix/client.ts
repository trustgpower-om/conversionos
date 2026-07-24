import 'server-only'

import { env } from '@/lib/env'

/**
 * Bitrix24 adapter — JEDINO mesto koje sme da zove Bitrix REST
 * (vidi .cursor/rules/02-bitrix.mdc). Sve Bitrix metode idu kroz ovde.
 *
 * Izolovano tako da deprecated `crm.lead.add` (zamenjuje ga `crm.item.add`)
 * može kasnije da se zameni bez diranja /api/leads/submit ugovora.
 */

export type BitrixLeadInput = {
  name: string
  phone: string
  email?: string | null
  message?: string | null
}

export type BitrixLeadResult =
  | { ok: true; bitrixLeadId: string }
  | {
      ok: false
      reason: 'not_configured' | 'http_error' | 'api_error'
      message: string
    }

/**
 * Pravi Lead u Bitrix24 preko inbound webhook-a (crm.lead.add).
 * Očekuje da BITRIX_WEBHOOK_URL pokazuje na metod-specific endpoint
 * (npr. .../rest/1/<token>/crm.lead.add.json) — standardni inbound webhook.
 *
 * Povratna vrednost nosi status, nikada ne baca — pozivalac odlučuje
 * kako da izvesti korisnika („nema lažnog uspeha").
 */
export async function createBitrixLead(
  input: BitrixLeadInput,
): Promise<BitrixLeadResult> {
  if (!env.bitrixWebhookUrl) {
    return {
      ok: false,
      reason: 'not_configured',
      message: 'BITRIX_WEBHOOK_URL nije podešen',
    }
  }

  const fields: Record<string, unknown> = {
    TITLE: `Upit sa landinga — ${input.name}`,
    NAME: input.name,
    SOURCE_ID: 'WEB',
    COMMENTS: input.message ?? undefined,
  }
  if (input.phone) {
    fields.PHONE = [{ VALUE: input.phone, VALUE_TYPE: 'OTHER' }]
  }
  if (input.email) {
    fields.EMAIL = [{ VALUE: input.email, VALUE_TYPE: 'OTHER' }]
  }

  try {
    const res = await fetch(env.bitrixWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(env.bitrixWebhookSecret
          ? { 'X-Webhook-Secret': env.bitrixWebhookSecret }
          : {}),
      },
      body: JSON.stringify({ fields }),
    })

    if (!res.ok) {
      return {
        ok: false,
        reason: 'http_error',
        message: `Bitrix HTTP ${res.status}`,
      }
    }

    const json = (await res.json()) as {
      result?: number | string
      error?: string
      error_description?: string
    }

    if (json.error || json.result === undefined || json.result === null) {
      return {
        ok: false,
        reason: 'api_error',
        message: json.error_description ?? json.error ?? 'Bitrix vratio bez rezultata',
      }
    }

    return { ok: true, bitrixLeadId: String(json.result) }
  } catch (e) {
    return {
      ok: false,
      reason: 'http_error',
      message: e instanceof Error ? e.message : String(e),
    }
  }
}
