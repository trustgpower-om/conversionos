import { LeadFormDemo } from '@/components/tracking/LeadFormDemo'
import { TrackingProvider } from '@/components/tracking/TrackingProvider'

export default function Home() {
  return (
    <>
      <TrackingProvider />

      <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 py-16 font-sans dark:bg-black">
        <main className="flex w-full max-w-3xl flex-col items-center gap-12 rounded-3xl bg-white px-8 py-16 shadow-sm dark:bg-zinc-950 sm:items-start">
          <div className="flex flex-col items-center gap-4 text-center sm:items-start sm:text-left">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
              ConversionOS demo
            </p>
            <h1 className="max-w-xl text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
              Pratite klikove, forme i vreme na stranici
            </h1>
            <p className="max-w-xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
              Ova demo landing stranica šalje pageview, click, form_submit i time_on_page
              događaje kroz Layer 1 API rute — bez blokiranja rendera.
            </p>
          </div>

          <a
            href="#lead-form"
            data-track-id="hero-cta"
            data-track-label="Zatraži informacije"
            className="inline-flex h-12 items-center justify-center rounded-full bg-zinc-900 px-6 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
          >
            Zatraži informacije
          </a>

          <div id="lead-form" className="w-full">
            <LeadFormDemo />
          </div>
        </main>
      </div>
    </>
  )
}
