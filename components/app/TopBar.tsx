export function TopBar() {
  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-zinc-200 bg-white px-6">
      <div className="relative flex-1 max-w-md">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
          ⌕
        </span>
        <input
          type="search"
          placeholder="Search pages, leads, funnels…"
          className="h-9 w-full rounded-lg border border-zinc-300 bg-zinc-50 pl-9 pr-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-teal-600 focus:bg-white"
        />
      </div>

      <div className="ml-auto flex items-center gap-4">
        <div className="hidden items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 md:flex">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          All systems operational
        </div>

        <button
          type="button"
          aria-label="Notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100"
        >
          <span className="text-lg leading-none">◔</span>
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
            3
          </span>
        </button>

        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-600 text-sm font-semibold text-white">
            AJ
          </span>
          <div className="hidden leading-tight sm:block">
            <p className="text-sm font-medium text-zinc-900">Alex Johnson</p>
            <p className="text-xs text-zinc-500">Admin</p>
          </div>
        </div>
      </div>
    </header>
  )
}
