'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type NavItem = {
  label: string
  href: string
  icon: string
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: '▦' },
  { label: 'Leads', href: '/leads', icon: '◑' },
  { label: 'Funnels', href: '/funnels', icon: '⌁' },
  { label: 'Tracking', href: '/tracking', icon: '◎' },
  { label: 'Pages', href: '/pages', icon: '▤' },
  { label: 'Integrations', href: '/integrations', icon: '⧉' },
  { label: 'Docs', href: '/docs', icon: '❒' },
  { label: 'Settings', href: '/settings', icon: '⚙' },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-zinc-200 bg-white">
      <div className="flex h-16 items-center gap-2 px-6">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-700 text-sm font-bold text-white">
          C
        </span>
        <span className="text-base font-semibold tracking-tight text-zinc-900">ConversionOS</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 py-2">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? 'bg-teal-50 text-teal-800'
                  : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
              }`}
            >
              <span className="w-4 text-center text-base leading-none">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="m-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
        <p className="text-xs font-semibold text-zinc-900">Pro Plan</p>
        <p className="mt-0.5 text-xs text-zinc-500">25k/100k events</p>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-200">
          <div className="h-full w-1/4 rounded-full bg-teal-600" />
        </div>
        <button
          type="button"
          className="mt-3 h-8 w-full rounded-lg bg-teal-700 text-xs font-semibold text-white transition-colors hover:bg-teal-800"
        >
          Upgrade
        </button>
      </div>
    </aside>
  )
}
