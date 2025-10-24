/*

 AI-generated code: 0%

 Human code: 100% (functions: EventRegisterCard, EventRegisterData) 

 No framework-generated code.

*/

import type { EventRegisterData } from "./viewModel";

type EventRegisterCardProps = EventRegisterData;

export function EventRegisterCard({ ctaLabel, note }: EventRegisterCardProps) {
  return (
    <section className="rounded-3xl border border-neutral-200/70 bg-white/90 p-6 shadow-lg shadow-amber-100/40 dark:border-white/10 dark:bg-neutral-900/70 dark:shadow-neutral-900/40">
      <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
        Ready to register?
      </h2>
      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
        Secure your spot in just a few clicks. We will follow up with check-in
        details once registration opens.
      </p>
      <button
        type="button"
        className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-amber-300 via-rose-300 to-amber-400 px-6 py-3 text-sm font-semibold text-neutral-900 shadow-sm transition hover:shadow-md focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-amber-300 dark:text-neutral-950"
      >
        {ctaLabel}
      </button>
      <p className="mt-3 text-xs text-neutral-500 dark:text-neutral-400">
        {note}
      </p>
    </section>
  );
}
