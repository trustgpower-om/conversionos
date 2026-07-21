'use client'

import Link from 'next/link'
import { useState } from 'react'

import type { PageSummary } from '@/lib/queries/pages'

function Toggle({ enabled }: { enabled: boolean }) {
  const [on, setOn] = useState(enabled)
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => setOn((v) => !v)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
        on ? 'bg-teal-600' : 'bg-zinc-300'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          on ? 'translate-x-4' : 'translate-x-0.5'
        }`}
      />
    </button>
  )
}

export function PageDetailPane({ summary }: { summary: PageSummary | null }) {
  const [tab, setTab] = useState<'overview' | 'activity'>('overview')

  if (!summary) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-white p-6 text-center text-sm text-zinc-400">
        Select a page to see details
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col rounded-xl border border-zinc-200 bg-white">
      <div className={`h-24 rounded-t-xl bg-gradient-to-br ${summary.thumbnailColor}`} />

      <div className="flex flex-col gap-1 px-4 pt-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-zinc-900">{summary.title}</h2>
          {summary.price !== '$0' && (
            <span className="text-sm font-semibold text-teal-700">{summary.price}</span>
          )}
        </div>
        <p className="text-xs text-zinc-500">/{summary.slug}</p>
      </div>

      <div className="mt-3 flex gap-1 border-b border-zinc-200 px-4">
        {(['overview', 'activity'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`border-b-2 px-2 py-2 text-sm font-medium capitalize transition-colors ${
              tab === t ? 'border-teal-600 text-teal-700' : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {tab === 'overview' ? (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-zinc-50 p-3">
                <p className="text-lg font-semibold text-zinc-900">{summary.views.toLocaleString()}</p>
                <p className="text-xs text-zinc-500">Views</p>
              </div>
              <div className="rounded-lg bg-zinc-50 p-3">
                <p className="text-lg font-semibold text-zinc-900">{summary.conversions}</p>
                <p className="text-xs text-zinc-500">Conversions</p>
              </div>
            </div>

            <div className="rounded-lg border border-zinc-200 p-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                Linked Property
              </p>
              <p className="text-sm font-medium text-zinc-900">{summary.linkedProperty.address}</p>
              <p className="text-sm text-teal-700">{summary.linkedProperty.price}</p>
              <p className="mt-1 text-xs text-zinc-500">
                {summary.linkedProperty.beds} bd · {summary.linkedProperty.baths} ba ·{' '}
                {summary.linkedProperty.sqft.toLocaleString()} sqft
              </p>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-zinc-200 p-3">
              <div>
                <p className="text-sm font-medium text-zinc-900">Tracking</p>
                <p className="text-xs text-zinc-500">Pixel {summary.tracking.pixelId}</p>
              </div>
              <Toggle enabled={summary.tracking.enabled} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-zinc-200 p-3">
                <p className="text-xs text-zinc-500">Active Segment</p>
                <p className="text-sm font-medium text-zinc-900">{summary.activeSegment}</p>
              </div>
              <div className="rounded-lg border border-zinc-200 p-3">
                <p className="text-xs text-zinc-500">CRM Destination</p>
                <p className="text-sm font-medium text-zinc-900">{summary.crmDestination}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Link
                href={`/pages/${summary.slug}`}
                className="flex-1 rounded-lg bg-teal-700 py-2 text-center text-sm font-semibold text-white hover:bg-teal-800"
              >
                Edit
              </Link>
              <button
                type="button"
                className="flex-1 rounded-lg border border-zinc-300 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Duplicate
              </button>
              <button
                type="button"
                className="flex-1 rounded-lg border border-zinc-300 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Preview
              </button>
            </div>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {[
              { when: '2h ago', text: 'New lead captured via Google Ads' },
              { when: '5h ago', text: 'CTA "Book a Viewing" clicked 42 times' },
              { when: '1d ago', text: 'Page published by ' + summary.agent.name },
              { when: '2d ago', text: 'Tracking pixel verified' },
            ].map((row, i) => (
              <li key={i} className="flex gap-3">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-teal-500" />
                <div>
                  <p className="text-sm text-zinc-800">{row.text}</p>
                  <p className="text-xs text-zinc-400">{row.when}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
