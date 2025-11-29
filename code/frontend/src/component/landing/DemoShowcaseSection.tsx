"use client";

import type { DemoScreen } from "./landingData";

type Props = {
  screens: DemoScreen[];
};

export function DemoShowcaseSection({ screens }: Props) {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 sm:px-6">
      <h1
        title="A quick tour of the product"
        className="font-atkinson-hyperlegible-next text-4xl font-bold text-neutral-900 dark:text-neutral-100 md:text-5xl"
      >
        A quick tour of the product
      </h1>
      <p className="max-w-3xl text-lg text-neutral-700 dark:text-neutral-300 md:text-xl">
        Showcase Kickaas to stakeholders with branded dashboards, streamlined
        ticket flows, and maps that make navigation second nature.
      </p>
      <div className="grid gap-6 md:grid-cols-2">
        {screens.map((screen, index) => (
          <article
            key={screen.title}
            className="group relative overflow-hidden rounded-3xl border border-neutral-200/70 bg-white/95 p-6 shadow-lg shadow-amber-500/5 backdrop-blur dark:border-white/5 dark:bg-neutral-900/60"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-0 transition duration-500 group-hover:opacity-100"
              style={{
                backgroundImage:
                  "linear-gradient(120deg, rgba(79,70,229,0.16), transparent 45%, rgba(251,191,36,0.18))",
              }}
            />
            <div className="flex items-center justify-between text-sm uppercase tracking-[0.3em] text-neutral-400">
              <span>Screen</span>
              <span>{index + 1}</span>
            </div>
            <h3 className="mt-6 text-2xl font-semibold text-neutral-900 dark:text-white">
              {screen.title}
            </h3>
            <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-300">
              {screen.description}
            </p>
            <div
              className="mt-6 h-48 rounded-2xl border border-dashed border-neutral-300/40 bg-neutral-100/60 dark:border-white/20 dark:bg-neutral-950/60"
              style={{
                backgroundImage:
                  "linear-gradient(120deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.55) 45%, rgba(255,255,255,0) 100%)",
                backgroundSize: "220% 100%",
                backgroundRepeat: "no-repeat",
              }}
            />
          </article>
        ))}
      </div>
    </section>
  );
}
