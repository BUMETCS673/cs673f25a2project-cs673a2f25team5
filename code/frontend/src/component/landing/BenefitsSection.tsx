"use client";

import type { Benefit } from "./landingData";

type Props = {
  benefits: Benefit[];
};

export function BenefitsSection({ benefits }: Props) {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 sm:px-6">
      <h1 className="font-atkinson-hyperlegible-next text-4xl font-bold text-neutral-900 dark:text-neutral-100 md:text-5xl">
        Built to delight every audience
      </h1>
      <p className="max-w-3xl text-lg text-neutral-700 dark:text-neutral-300 md:text-xl">
        Whether you’re searching for your next night out, running a sold-out
        conference, or growing a local community, Kickaas keeps the experience
        fluid from discovery through follow-up.
      </p>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {benefits.map((benefit) => (
          <article
            key={benefit.title}
            className="group relative overflow-hidden rounded-3xl border border-neutral-200/70 bg-white/90 p-6 shadow-lg shadow-amber-500/5 backdrop-blur dark:border-white/5 dark:bg-neutral-900/60"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-0 transition duration-500 group-hover:opacity-100"
              style={{
                backgroundImage:
                  "radial-gradient(circle at top, rgba(124,58,237,0.18), transparent 60%)",
              }}
            />
            <div className="flex items-center gap-3 text-2xl">
              <span aria-hidden>{benefit.icon}</span>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                {benefit.title}
              </h3>
            </div>
            <ul className="mt-5 space-y-2 text-sm text-neutral-600 dark:text-neutral-300">
              {benefit.points.map((point) => (
                <li key={point} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-400" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
