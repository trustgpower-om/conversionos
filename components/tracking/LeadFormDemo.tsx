'use client'

type LeadFormDemoProps = {
  trackId?: string
}

export function LeadFormDemo({ trackId = 'lead-form' }: LeadFormDemoProps) {
  return (
    <form
      data-track-id={trackId}
      className="flex w-full max-w-md flex-col gap-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-950"
      onSubmit={(event) => {
        event.preventDefault()
      }}
    >
      <div className="flex flex-col gap-2 text-left">
        <label htmlFor="demo-name" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Ime
        </label>
        <input
          id="demo-name"
          name="name"
          type="text"
          placeholder="Vaše ime"
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
      </div>

      <div className="flex flex-col gap-2 text-left">
        <label
          htmlFor="demo-phone"
          className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Telefon
        </label>
        <input
          id="demo-phone"
          name="phone"
          type="tel"
          placeholder="+381 ..."
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
      </div>

      <button
        type="submit"
        className="rounded-full bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
      >
        Pošalji upit
      </button>
    </form>
  )
}
