"use client";

import type { WorkflowStep } from "./landingData";
import Image from "next/image";
type Props = {
  steps: WorkflowStep[];
};

export function WorkflowStepsSection({ steps }: Props) {
  return (
    <section className="group relative mx-auto w-full max-w-6xl overflow-hidden rounded-[40px] border border-white/10 bg-[#1c0f2e] shadow-2xl shadow-amber-500/10">
      <Image
        src="/workflow.jpg"
        alt="Kickaas attendees enjoying an event"
        fill
        priority
        className="absolute inset-0 h-full w-full scale-110 object-cover object-center brightness-95 saturate-125 transition duration-[4000ms] group-hover:scale-[1.15]"
      />
      <div className="absolute inset-0 -z-20 bg-gradient-to-r from-[#1a072d]/80 via-[#2b1246]/55 to-amber-500/25" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/30 via-black/10 to-black/60" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-80 mix-blend-screen"
        style={{
          background:
            "radial-gradient(120% 120% at 90% -10%, rgba(252,211,77,0.25) 0%, rgba(79,70,229,0.08) 45%, transparent 70%)",
        }}
      />
      <div className="relative z-20 flex flex-col gap-10 px-6 py-16 text-[#f8f1e8] sm:px-10 md:px-16 md:py-24">
        <span className="max-w-fit text-xs font-semibold uppercase tracking-[0.35em] text-amber-300/90">
          Seamless workflow
        </span>
        <h1 className="font-atkinson-hyperlegible-next text-4xl font-bold text-black md:text-5xl">
          How Kickaas works in four steps
        </h1>
        <p className="max-w-2xl text-base text-black sm:text-lg">
          From the first idea to post-event insights, Kickaas keeps every stage
          organized so you and your team can stay focused on the experience.
        </p>
        <ol className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {steps.map((step, idx) => (
            <li
              key={step.title}
              className="group relative text-black flex h-full flex-col gap-4 overflow-hidden rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur-lg transition duration-300 hover:-translate-y-1 hover:border-amber-200/40 hover:bg-white/15"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition duration-500 group-hover:opacity-100"
                style={{
                  backgroundImage:
                    "radial-gradient(80% 120% at 50% -10%, rgba(251,191,36,0.25) 0%, transparent 55%)",
                }}
              />
              <span className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-amber-200/90">
                <span className="flex h-11 w-11 items-center justify-center rounded-full border border-amber-200/40 bg-white/10 text-sm text-amber-200">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                Step
              </span>
              <h3 className="text-2xl font-semibold text-white">
                {step.title}
              </h3>
              <p className="text-sm text-[#f1e8da]/80">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
