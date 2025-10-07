"use client";

import type { WorkflowStep } from "./landingData";

type Props = {
  steps: WorkflowStep[];
};

export function WorkflowStepsSection({ steps }: Props) {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 sm:px-6">
      <h1 className="font-atkinson-hyperlegible-next text-4xl font-bold text-neutral-900 dark:text-neutral-100 md:text-5xl">
        How Kickaas works in four steps
      </h1>
      <ol className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, idx) => (
          <li
            key={step.title}
            className="group relative overflow-hidden rounded-3xl border border-neutral-200/70 bg-white/90 p-6 shadow-md shadow-amber-500/5 transition dark:border-white/5 dark:bg-neutral-900/60"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute -top-24 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-amber-200/40 blur-3xl opacity-0 transition duration-500 group-hover:opacity-100 dark:bg-amber-500/25"
            />
            <span className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-500 dark:text-amber-300">
              Step {idx + 1}
            </span>
            <h3 className="mt-4 text-2xl font-semibold text-neutral-900 dark:text-white">
              {step.title}
            </h3>
            <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-300">
              {step.body}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
