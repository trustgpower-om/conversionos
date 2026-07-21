// MOCK DATA — replace with Supabase queries per roadmap §6 (§6.3 Page detail).
// Hardcoded, realistically-shaped analytics for the Page detail UI. No Supabase
// / env dependency. Signatures mirror the roadmap so real bodies drop in later:
//   getPageAnalytics / getPageTimeseries / getPageJourney / getPageSources /
//   getHeatmap / getPageInsights
// Swap-to-real: replace each body with the aggregation query from roadmap §6.3
// (visits / visit_events / leads). The return shapes below are the contract.

export interface DateRangeOptions {
  from?: string
  to?: string
}

export interface KpiMetric {
  key: string
  label: string
  value: number
  display: string
  deltaPct: number
  unit: 'count' | 'percent' | 'seconds'
}

export interface PageAnalytics {
  slug: string
  title: string
  kpis: KpiMetric[]
}

export interface TimeseriesPoint {
  date: string
  views: number
  conversions: number
}

export interface JourneyStep {
  step: string
  value: number
  dropOffPct: number
}

export interface SourceRow {
  source: string
  pageViews: number
  uniqueVisitors: number
  ctaClickRate: number
  conversions: number
  convRate: number
  deltaPct: number
}

export interface HeatmapPoint {
  xPct: number
  yPct: number
  weight: number
}

export interface HeatmapData {
  slug: string
  points: HeatmapPoint[]
  totalClicks: number
}

export interface InsightItem {
  id: string
  kind: 'trend' | 'engagement' | 'anomaly'
  title: string
  detail: string
  tone: 'positive' | 'neutral' | 'warning'
}

export async function getPageAnalytics(slug: string, _opts: DateRangeOptions = {}): Promise<PageAnalytics> {
  void _opts
  return {
    slug,
    title: slug
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' '),
    kpis: [
      { key: 'page_views', label: 'Page Views', value: 4821, display: '4,821', deltaPct: 12.4, unit: 'count' },
      { key: 'unique_visitors', label: 'Unique Visitors', value: 3612, display: '3,612', deltaPct: 8.1, unit: 'count' },
      { key: 'scroll_depth', label: 'Scroll Depth', value: 68, display: '68%', deltaPct: 3.2, unit: 'percent' },
      { key: 'cta_click_rate', label: 'CTA Click Rate', value: 9.4, display: '9.4%', deltaPct: -1.6, unit: 'percent' },
      { key: 'form_starts', label: 'Form Starts', value: 284, display: '284', deltaPct: 15.7, unit: 'count' },
      { key: 'conversions', label: 'Conversions', value: 96, display: '96', deltaPct: 6.9, unit: 'count' },
    ],
  }
}

export async function getPageTimeseries(slug: string, _opts: DateRangeOptions = {}): Promise<TimeseriesPoint[]> {
  void slug
  void _opts
  const base = [
    { date: '2026-07-01', views: 320, conversions: 6 },
    { date: '2026-07-02', views: 412, conversions: 8 },
    { date: '2026-07-03', views: 388, conversions: 7 },
    { date: '2026-07-04', views: 460, conversions: 11 },
    { date: '2026-07-05', views: 521, conversions: 9 },
    { date: '2026-07-06', views: 498, conversions: 12 },
    { date: '2026-07-07', views: 610, conversions: 14 },
    { date: '2026-07-08', views: 575, conversions: 13 },
    { date: '2026-07-09', views: 642, conversions: 16 },
    { date: '2026-07-10', views: 701, conversions: 18 },
    { date: '2026-07-11', views: 688, conversions: 15 },
    { date: '2026-07-12', views: 733, conversions: 19 },
    { date: '2026-07-13', views: 690, conversions: 17 },
    { date: '2026-07-14', views: 812, conversions: 22 },
  ]
  return base
}

export async function getPageJourney(slug: string, _opts: DateRangeOptions = {}): Promise<JourneyStep[]> {
  void slug
  void _opts
  const steps = [
    { step: 'Page View', value: 4821 },
    { step: 'CTA Click', value: 1842 },
    { step: 'Form Start', value: 284 },
    { step: 'Form Submit', value: 142 },
    { step: 'Conversion', value: 96 },
  ]
  return steps.map((s, i) => ({
    ...s,
    dropOffPct: i === 0 ? 0 : Number((((steps[i - 1].value - s.value) / steps[i - 1].value) * 100).toFixed(1)),
  }))
}

export async function getPageSources(slug: string, _opts: DateRangeOptions = {}): Promise<SourceRow[]> {
  void slug
  void _opts
  return [
    { source: 'Google Ads', pageViews: 1920, uniqueVisitors: 1480, ctaClickRate: 10.2, conversions: 44, convRate: 2.3, deltaPct: 8.5 },
    { source: 'Facebook', pageViews: 1140, uniqueVisitors: 902, ctaClickRate: 8.7, conversions: 21, convRate: 1.8, deltaPct: -2.1 },
    { source: 'Instagram', pageViews: 760, uniqueVisitors: 611, ctaClickRate: 9.1, conversions: 15, convRate: 2.0, deltaPct: 4.4 },
    { source: 'Direct', pageViews: 540, uniqueVisitors: 430, ctaClickRate: 7.4, conversions: 9, convRate: 1.7, deltaPct: 1.2 },
    { source: 'Email', pageViews: 461, uniqueVisitors: 389, ctaClickRate: 12.9, conversions: 7, convRate: 1.5, deltaPct: 11.0 },
  ]
}

export async function getHeatmap(slug: string): Promise<HeatmapData> {
  return {
    slug,
    totalClicks: 1842,
    points: [
      { xPct: 50, yPct: 18, weight: 1.0 },
      { xPct: 32, yPct: 34, weight: 0.7 },
      { xPct: 68, yPct: 40, weight: 0.55 },
      { xPct: 50, yPct: 62, weight: 0.85 },
      { xPct: 24, yPct: 72, weight: 0.4 },
      { xPct: 76, yPct: 70, weight: 0.45 },
      { xPct: 50, yPct: 88, weight: 0.9 },
    ],
  }
}

export async function getPageInsights(slug: string): Promise<InsightItem[]> {
  void slug
  return [
    {
      id: 'ins-trend',
      kind: 'trend',
      title: 'Conversion rate trending up',
      detail: 'Conversion rate rose 6.9% vs the previous 14 days, driven by paid search traffic.',
      tone: 'positive',
    },
    {
      id: 'ins-engagement',
      kind: 'engagement',
      title: 'Engagement level: High',
      detail: 'Average scroll depth of 68% and 9.4% CTA click rate place this page in the top quartile.',
      tone: 'neutral',
    },
    {
      id: 'ins-anomaly',
      kind: 'anomaly',
      title: 'CTA click rate dip detected',
      detail: 'CTA click rate fell 1.6% — Facebook traffic underperformed on Jul 12–13.',
      tone: 'warning',
    },
  ]
}
