// MOCK DATA — replace with Supabase queries per roadmap §6 (§6.2 Pages).
// These functions return hardcoded, realistically-shaped data so the Pages
// segment UI is fully functional without any Supabase / env dependency.
// Signatures mirror the roadmap so real query bodies drop in later:
//   getPagesList / getPageSummary / getPagesCountByStatus
// Swap-to-real: replace each function body with a `createServerSupabaseClient()`
// query (see roadmap §6.2) — the return shapes below are the contract.

export type PageStatus = 'published' | 'draft' | 'scheduled' | 'archived'

export type PageType = 'Property Page' | 'Landing' | 'Opt-in' | 'Booking'

export interface PageAgent {
  id: string
  name: string
  initials: string
  avatarColor: string
}

export interface PageListItem {
  id: string
  slug: string
  title: string
  price: string
  status: PageStatus
  type: PageType
  agent: PageAgent
  project: string
  campaignSource: string
  updatedAt: string
  thumbnailColor: string
  views: number
  conversions: number
}

export interface PagesListResult {
  pages: PageListItem[]
  total: number
}

export interface PagesListOptions {
  status?: string
  type?: string
  project?: string
  agent?: string
  campaign?: string
  owner?: string
  q?: string
  sort?: string
  page?: number
  pageSize?: number
}

export interface StatusCounts {
  total: number
  published: number
  draft: number
  scheduled: number
  archived: number
}

export interface PageSummary {
  id: string
  slug: string
  title: string
  price: string
  status: PageStatus
  type: PageType
  agent: PageAgent
  updatedAt: string
  createdAt: string
  thumbnailColor: string
  linkedProperty: {
    address: string
    price: string
    beds: number
    baths: number
    sqft: number
  }
  tracking: {
    enabled: boolean
    pixelId: string
  }
  activeSegment: string
  crmDestination: string
  views: number
  conversions: number
  sections: number
}

export interface PagesFilterOptions {
  statuses: { value: PageStatus; label: string }[]
  types: PageType[]
  projects: string[]
  agents: PageAgent[]
  campaignSources: string[]
  owners: string[]
}

const AGENTS: PageAgent[] = [
  { id: 'agent-alex', name: 'Alex Johnson', initials: 'AJ', avatarColor: 'bg-teal-600' },
  { id: 'agent-maria', name: 'Maria Chen', initials: 'MC', avatarColor: 'bg-indigo-600' },
  { id: 'agent-david', name: 'David Ruiz', initials: 'DR', avatarColor: 'bg-amber-600' },
  { id: 'agent-sarah', name: 'Sarah Blake', initials: 'SB', avatarColor: 'bg-rose-600' },
]

const THUMB_COLORS = [
  'from-teal-500 to-emerald-600',
  'from-indigo-500 to-blue-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
  'from-slate-500 to-slate-700',
  'from-cyan-500 to-sky-600',
]

const PAGES: PageListItem[] = [
  {
    id: 'pg-1',
    slug: '123-maple-drive',
    title: '123 Maple Drive',
    price: '$2.85M',
    status: 'published',
    type: 'Property Page',
    agent: AGENTS[0],
    project: 'Maple Estates',
    campaignSource: 'Google Ads',
    updatedAt: '2026-07-18',
    thumbnailColor: THUMB_COLORS[0],
    views: 4821,
    conversions: 96,
  },
  {
    id: 'pg-2',
    slug: '48-lakeshore-blvd',
    title: '48 Lakeshore Blvd',
    price: '$1.42M',
    status: 'published',
    type: 'Property Page',
    agent: AGENTS[1],
    project: 'Lakeshore Towers',
    campaignSource: 'Facebook',
    updatedAt: '2026-07-17',
    thumbnailColor: THUMB_COLORS[1],
    views: 3210,
    conversions: 58,
  },
  {
    id: 'pg-3',
    slug: 'summer-open-house',
    title: 'Summer Open House',
    price: '$0',
    status: 'published',
    type: 'Landing',
    agent: AGENTS[0],
    project: 'Maple Estates',
    campaignSource: 'Instagram',
    updatedAt: '2026-07-16',
    thumbnailColor: THUMB_COLORS[2],
    views: 2740,
    conversions: 141,
  },
  {
    id: 'pg-4',
    slug: '7-highland-court',
    title: '7 Highland Court',
    price: '$3.60M',
    status: 'draft',
    type: 'Property Page',
    agent: AGENTS[2],
    project: 'Highland Reserve',
    campaignSource: 'Direct',
    updatedAt: '2026-07-15',
    thumbnailColor: THUMB_COLORS[3],
    views: 0,
    conversions: 0,
  },
  {
    id: 'pg-5',
    slug: 'buyer-guide-optin',
    title: 'Buyer Guide Opt-in',
    price: '$0',
    status: 'published',
    type: 'Opt-in',
    agent: AGENTS[3],
    project: 'Lead Magnets',
    campaignSource: 'Google Ads',
    updatedAt: '2026-07-14',
    thumbnailColor: THUMB_COLORS[4],
    views: 5930,
    conversions: 612,
  },
  {
    id: 'pg-6',
    slug: 'book-a-viewing',
    title: 'Book a Viewing',
    price: '$0',
    status: 'scheduled',
    type: 'Booking',
    agent: AGENTS[1],
    project: 'Lakeshore Towers',
    campaignSource: 'Email',
    updatedAt: '2026-07-13',
    thumbnailColor: THUMB_COLORS[5],
    views: 1180,
    conversions: 74,
  },
  {
    id: 'pg-7',
    slug: '256-oak-terrace',
    title: '256 Oak Terrace',
    price: '$980K',
    status: 'draft',
    type: 'Property Page',
    agent: AGENTS[2],
    project: 'Oakview Homes',
    campaignSource: 'Facebook',
    updatedAt: '2026-07-11',
    thumbnailColor: THUMB_COLORS[0],
    views: 0,
    conversions: 0,
  },
  {
    id: 'pg-8',
    slug: '90-parkview-heights',
    title: '90 Parkview Heights',
    price: '$4.15M',
    status: 'archived',
    type: 'Property Page',
    agent: AGENTS[3],
    project: 'Parkview Heights',
    campaignSource: 'Referral',
    updatedAt: '2026-06-29',
    thumbnailColor: THUMB_COLORS[1],
    views: 8420,
    conversions: 133,
  },
  {
    id: 'pg-9',
    slug: 'fall-market-report',
    title: 'Fall Market Report',
    price: '$0',
    status: 'scheduled',
    type: 'Landing',
    agent: AGENTS[0],
    project: 'Lead Magnets',
    campaignSource: 'Instagram',
    updatedAt: '2026-07-10',
    thumbnailColor: THUMB_COLORS[2],
    views: 640,
    conversions: 22,
  },
  {
    id: 'pg-10',
    slug: '512-riverside-loft',
    title: '512 Riverside Loft',
    price: '$1.75M',
    status: 'published',
    type: 'Property Page',
    agent: AGENTS[1],
    project: 'Riverside Lofts',
    campaignSource: 'Google Ads',
    updatedAt: '2026-07-09',
    thumbnailColor: THUMB_COLORS[3],
    views: 2960,
    conversions: 71,
  },
]

function matchesFilters(page: PageListItem, opts: PagesListOptions): boolean {
  if (opts.status && opts.status !== 'total' && page.status !== opts.status) return false
  if (opts.type && page.type !== opts.type) return false
  if (opts.project && page.project !== opts.project) return false
  if (opts.agent && page.agent.id !== opts.agent) return false
  if (opts.campaign && page.campaignSource !== opts.campaign) return false
  if (opts.owner && page.agent.id !== opts.owner) return false
  if (opts.q && !page.title.toLowerCase().includes(opts.q.toLowerCase())) return false
  return true
}

export async function getPagesList(opts: PagesListOptions = {}): Promise<PagesListResult> {
  const filtered = PAGES.filter((page) => matchesFilters(page, opts))
  const sorted = [...filtered].sort((a, b) => {
    if (opts.sort === 'views') return b.views - a.views
    if (opts.sort === 'title') return a.title.localeCompare(b.title)
    return b.updatedAt.localeCompare(a.updatedAt)
  })
  return { pages: sorted, total: sorted.length }
}

export async function getPagesCountByStatus(): Promise<StatusCounts> {
  return { total: 56, published: 28, draft: 12, scheduled: 6, archived: 10 }
}

export async function getPageSummary(slug: string): Promise<PageSummary | null> {
  const page = PAGES.find((p) => p.slug === slug) ?? PAGES[0]
  if (!page) return null
  return {
    id: page.id,
    slug: page.slug,
    title: page.title,
    price: page.price,
    status: page.status,
    type: page.type,
    agent: page.agent,
    updatedAt: page.updatedAt,
    createdAt: '2026-05-02',
    thumbnailColor: page.thumbnailColor,
    linkedProperty: {
      address: `${page.title}, Lakeview, CA 94040`,
      price: page.price,
      beds: 4,
      baths: 3,
      sqft: 3250,
    },
    tracking: { enabled: page.status === 'published', pixelId: 'cos_px_8f21a4' },
    activeSegment: 'High-intent buyers',
    crmDestination: 'Follow Up Boss',
    views: page.views,
    conversions: page.conversions,
    sections: 6,
  }
}

export async function getPagesFilterOptions(): Promise<PagesFilterOptions> {
  return {
    statuses: [
      { value: 'published', label: 'Published' },
      { value: 'draft', label: 'Draft' },
      { value: 'scheduled', label: 'Scheduled' },
      { value: 'archived', label: 'Archived' },
    ],
    types: ['Property Page', 'Landing', 'Opt-in', 'Booking'],
    projects: [
      'Maple Estates',
      'Lakeshore Towers',
      'Highland Reserve',
      'Oakview Homes',
      'Parkview Heights',
      'Riverside Lofts',
      'Lead Magnets',
    ],
    agents: AGENTS,
    campaignSources: ['Google Ads', 'Facebook', 'Instagram', 'Email', 'Direct', 'Referral'],
    owners: AGENTS.map((a) => a.name),
  }
}
