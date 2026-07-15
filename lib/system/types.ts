export type FlowContext = {
  landingId: string
  sessionId: string
  slug: string
}

export type FlowResult = {
  ok: boolean
  status?: number
  body?: string
  error?: string
}

export type Flow = {
  id: string
  title: string
  description: string
  doc: string
  files: string[]
  tables: string[]
  execute: (ctx: FlowContext) => Promise<FlowResult>
}

export type SchemaRowCount = { table: string; count: number }

export type SchemaOverview = {
  tables?: string[]
  row_counts?: Record<string, number> | SchemaRowCount[]
  fks?: unknown
  checks?: unknown
}

export type FlowDelta = {
  table: string
  before: number
  after: number
  delta: number
}

export const DEFAULT_LANDING_ID = '2f68ec4c-6029-4174-a37a-e776878cc24b'
export const DEFAULT_SLUG = 'apartmani-13'
