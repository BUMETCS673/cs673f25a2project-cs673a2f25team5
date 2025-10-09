"use client";

import type { FeatureHighlight } from "./landingData";

type Props = {
  features: FeatureHighlight[];
};

export function FeatureHighlightsSection({ features }: Props) {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 pb-16 pt-32 sm:px-6 md:pt-40">
      <h1 className="font-atkinson-hyperlegible-next text-5xl font-bold text-neutral-900 dark:text-neutral-100 md:text-6xl">
        Everything you need to launch events
      </h1>
      <p className="max-w-2xl text-lg text-neutral-700 dark:text-neutral-300 md:text-xl">
        Kickaas brings the organizer and attendee experience into one command
        center—no cobbled-together tools, just streamlined planning, selling,
        and engagement.
      </p>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <article
            key={feature.heading}
            className="group relative overflow-hidden rounded-3xl border border-neutral-200/70 bg-white/90 p-6 shadow-lg shadow-amber-500/5 backdrop-blur transition dark:border-white/5 dark:bg-neutral-900/60"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-0 transition duration-500 group-hover:opacity-100"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, rgba(251,191,36,0.18), transparent 55%, rgba(139,92,246,0.18))",
              }}
            />
            <h3 className="text-2xl font-semibold text-neutral-900 dark:text-white">
              {feature.heading}
            </h3>
            <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-300">
              {feature.description}
            </p>
            {feature.bullets && feature.bullets.length > 0 ? (
              <ul className="mt-6 space-y-2 text-sm text-neutral-600 dark:text-neutral-300">
                {feature.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-amber-400" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
