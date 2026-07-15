'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

import {
  SYSTEM_FLOWS,
  computeDeltas,
  fetchRowCounts,
  resolveFlowContext,
} from '@/lib/system/flows'
import type { Flow, FlowContext, FlowDelta, FlowResult } from '@/lib/system/types'

type FlowRunState = {
  loading: boolean
  result: FlowResult | null
  deltas: FlowDelta[]
}

function FlowCard({
  flow,
  runState,
  onExecute,
}: {
  flow: Flow
  runState: FlowRunState
  onExecute: (flow: Flow) => void
}) {
  const { loading, result, deltas } = runState

  return (
    <article className="flex flex-col gap-4 rounded-[10px] border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-zinc-900">{flow.title}</h2>
          <p className="mt-1 text-sm text-zinc-500">{flow.description}</p>
        </div>
        {result && (
          <span
            className={`shrink-0 text-lg ${result.ok ? 'text-emerald-600' : 'text-red-600'}`}
            title={result.ok ? 'OK' : 'Greška'}
          >
            {result.ok ? '✓' : '✗'}
          </span>
        )}
      </div>

      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-400">Fajlovi</p>
        <ul className="space-y-0.5 font-mono text-xs text-zinc-700">
          {flow.files.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      </div>

      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-400">Tabele</p>
        <div className="flex flex-wrap gap-1.5">
          {flow.tables.map((t) => (
            <span
              key={t}
              className="rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-800"
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      {flow.doc !== '—' && (
        <p className="text-xs text-zinc-500">
          Doc: <span className="font-mono">{flow.doc}</span>
        </p>
      )}

      <button
        type="button"
        disabled={loading}
        onClick={() => onExecute(flow)}
        className="mt-auto h-9 rounded-lg bg-[#0f766e] px-4 text-sm font-semibold text-white transition-colors hover:bg-teal-800 disabled:opacity-60"
      >
        {loading ? 'Izvršavam…' : 'Execute'}
      </button>

      {result && (
        <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-3 text-xs">
          <p className="font-medium text-zinc-700">
            HTTP {result.status ?? '—'}
            {result.error && <span className="ml-2 text-red-600">{result.error}</span>}
          </p>
          {result.body && (
            <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-all font-mono text-zinc-600">
              {result.body}
            </pre>
          )}
          {deltas.length > 0 && (
            <table className="mt-3 w-full text-left">
              <thead>
                <tr className="text-zinc-500">
                  <th className="pb-1 pr-2">Tabela</th>
                  <th className="pb-1 pr-2">Pre</th>
                  <th className="pb-1 pr-2">Posle</th>
                  <th className="pb-1">Δ</th>
                </tr>
              </thead>
              <tbody>
                {deltas.map((d) => (
                  <tr key={d.table} className="font-mono">
                    <td className="py-0.5 pr-2">{d.table}</td>
                    <td className="py-0.5 pr-2">{d.before}</td>
                    <td className="py-0.5 pr-2">{d.after}</td>
                    <td
                      className={`py-0.5 font-semibold ${
                        d.delta > 0 ? 'text-emerald-600' : d.delta < 0 ? 'text-red-600' : 'text-zinc-500'
                      }`}
                    >
                      {d.delta > 0 ? `+${d.delta}` : d.delta}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </article>
  )
}

export default function SystemAdminPage() {
  const [authError, setAuthError] = useState(false)
  const [ctx, setCtx] = useState<FlowContext | null>(null)
  const [rowCounts, setRowCounts] = useState<Record<string, number>>({})
  const [runs, setRuns] = useState<Record<string, FlowRunState>>({})
  const [refreshing, setRefreshing] = useState(false)

  const refreshSchema = useCallback(async () => {
    setRefreshing(true)
    const counts = await fetchRowCounts()
    if (Object.keys(counts).length === 0) {
      setAuthError(true)
    } else {
      setAuthError(false)
      setRowCounts(counts)
    }
    setRefreshing(false)
  }, [])

  useEffect(() => {
    void (async () => {
      const context = await resolveFlowContext()
      setCtx(context)
      await refreshSchema()
    })()
  }, [refreshSchema])

  async function handleExecute(flow: Flow) {
    if (!ctx) {
      return
    }

    setRuns((prev) => ({
      ...prev,
      [flow.id]: { loading: true, result: null, deltas: [] },
    }))

    const before = await fetchRowCounts()
    const result = await flow.execute(ctx)
    const after = await fetchRowCounts()
    const deltas = computeDeltas(flow.tables, before, after)

    setRowCounts(after)
    setRuns((prev) => ({
      ...prev,
      [flow.id]: { loading: false, result, deltas },
    }))
  }

  if (authError) {
    return (
      <div className="flex min-h-full flex-1 flex-col items-center justify-center gap-4 bg-zinc-50 p-8">
        <p className="text-sm text-zinc-600">
          /admin/system zahteva prijavu (isti auth kao builder).
        </p>
        <Link
          href="/login"
          className="rounded-lg bg-[#0f766e] px-4 py-2 text-sm font-semibold text-white"
        >
          Prijavi se
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-full flex-1 bg-zinc-50 px-6 py-8 text-zinc-900">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              ConversionOS — Operativni tok
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Use-case → fajlovi → tabele → live execute + DB delta
            </p>
            {ctx && (
              <p className="mt-2 font-mono text-xs text-zinc-400">
                slug={ctx.slug} · landingId={ctx.landingId.slice(0, 8)}… · session=
                {ctx.sessionId.slice(0, 8)}…
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => void refreshSchema()}
            disabled={refreshing}
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium hover:border-teal-600"
          >
            {refreshing ? 'Osvežavam…' : 'Osveži DB stanje'}
          </button>
        </header>

        <div className="mb-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SYSTEM_FLOWS.map((flow) => (
            <FlowCard
              key={flow.id}
              flow={flow}
              runState={runs[flow.id] ?? { loading: false, result: null, deltas: [] }}
              onExecute={handleExecute}
            />
          ))}
        </div>

        <section className="rounded-[10px] border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500">
            DB stanje (row_counts)
          </h2>
          {Object.keys(rowCounts).length === 0 ? (
            <p className="text-sm text-zinc-500">Učitavanje…</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-zinc-500">
                  <th className="pb-2 pr-4">Tabela</th>
                  <th className="pb-2">Redova</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(rowCounts)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([table, count]) => (
                    <tr key={table} className="border-b border-zinc-50 font-mono">
                      <td className="py-2 pr-4">{table}</td>
                      <td className="py-2">{count}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  )
}
