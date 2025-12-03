"use client";

import { EventsBrowser } from "@/component/events/EventsBrowser";

import type { EventListResponse } from "@/types/eventTypes";
import type { CategoryResponse } from "@/types/categoryTypes";

type ClientEventsProps = {
  initialResult: EventListResponse;
  categories: CategoryResponse[];
};

export function ClientEvents({ initialResult, categories }: ClientEventsProps) {
  return (
    <main className="relative min-h-screen overflow-auto bg-neutral-50/80 px-4 py-16 sm:px-6 lg:px-16 dark:bg-neutral-950">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-amber-200/40 via-transparent to-rose-200/35 blur-3xl dark:from-amber-400/10 dark:to-rose-500/15" />

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12">
        <header className="max-w-3xl space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-500 dark:text-amber-300/80">
            Discover new experiences
          </p>
          <h1 className="text-4xl font-bold text-neutral-900 sm:text-5xl dark:text-neutral-50">
            Events that spark connection
          </h1>
          <p className="text-base text-neutral-600 dark:text-neutral-400">
            Browse curated gatherings hosted by the Kickaas community. Search by
            keywords or locations to find the perfect event, then dive into the
            details to RSVP.
          </p>
        </header>

        <EventsBrowser initialResult={initialResult} categories={categories} />
      </div>
    </main>
  );
}
