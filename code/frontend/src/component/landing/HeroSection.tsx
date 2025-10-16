"use client";
import Image from "next/image";

export default function HeroSection() {
  return (
    <section className="relative isolate flex h-[min(720px,100vh)] w-full items-center overflow-hidden rounded-2xl bg-[#1c0f2e]">
      <Image
        src="/Hero.jpg"
        alt="Kickaas attendees enjoying an event"
        fill
        priority
        className="absolute inset-0 -z-30 h-full w-full object-cover object-center"
      />
      <div className="absolute inset-0 -z-20 bg-gradient-to-r from-[#1a072d]/95 via-[#2b1246]/75 to-transparent" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/30 via-transparent to-black/40" />

      <div className="relative z-20 flex w-full justify-start">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-16 text-left text-[#f8f1e8] sm:px-12 lg:px-20">
          <span className="max-w-fit text-xs font-semibold uppercase tracking-[0.35em] text-amber-300">
            Kickaas Event Suite
          </span>
          <h1 className="font-sanchez text-4xl leading-tight sm:text-[52px] sm:leading-[1.1] lg:text-[64px]">
            Helping you plan life&apos;s best gatherings
          </h1>
          <p className="max-w-xl text-base text-[#f1e8da] sm:text-lg">
            Build unforgettable experiences with less stress. Kickaas keeps
            vendors, guests, and logistics in sync so you can focus on moments
            that matter.
          </p>
          <div className="flex flex-wrap items-center gap-5 pt-2">
            <a
              href="/events"
              className="inline-flex items-center justify-center rounded-full bg-[#5c1354] px-8 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#f8f1e8] shadow-lg shadow-[#5c1354]/40 transition duration-200 hover:-translate-y-0.5 hover:bg-[#6b1b62] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f8f1e8]/50"
            >
              Explore Events
              <span className="ml-3 text-base font-bold"></span>
            </a>
            <a
              href="/create-event"
              className="group inline-flex items-center gap-4 text-sm font-semibold uppercase tracking-[0.18em] text-[#f8f1e8] transition duration-200 hover:text-amber-200  focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f8f1e8]/50"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-300 text-lg font-bold text-[#2b1246] transition duration-200 group-hover:scale-105 group-hover:bg-amber-200"></span>
              CREATE EVENTS
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
