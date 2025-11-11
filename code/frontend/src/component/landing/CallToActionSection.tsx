"use client";

type Props = {
  title?: string;
  description?: string;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
};

const defaultCopy = {
  title: "Ready to host your next big event?",
  description:
    "Create an event space that attendees love and organizers trust. Start planning today or explore what’s happening around you.",
  primaryCta: { label: "Create My Event", href: "/create-events" },
  secondaryCta: { label: "Join an Event", href: "/events" },
};

export function CallToActionSection({
  title = defaultCopy.title,
  description = defaultCopy.description,
  primaryCta = defaultCopy.primaryCta,
  secondaryCta = defaultCopy.secondaryCta,
}: Props) {
  return (
    <section className="relative mx-auto w-full max-w-5xl px-4 pb-32 sm:px-6">
      <div>
        <div className="relative overflow-hidden rounded-[40px] border border-amber-500/30 bg-gradient-to-br from-amber-200/50 via-rose-200/40 to-violet-300/40 p-10 text-neutral-900 shadow-xl shadow-amber-500/10 dark:from-amber-500/20 dark:via-rose-500/15 dark:to-violet-600/20 sm:p-12">
          <span
            aria-hidden
            className="pointer-events-none absolute -top-24 right-10 h-44 w-44 rounded-full bg-amber-300/40 blur-3xl dark:bg-amber-400/30"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute -bottom-28 left-12 h-52 w-52 rounded-full bg-violet-300/40 blur-3xl dark:bg-violet-500/30"
          />
          <div className="relative z-10 flex flex-col gap-6 text-neutral-900 dark:text-white">
            <h1 className="font-atkinson-hyperlegible-next text-4xl font-bold text-neutral-900 dark:text-white md:text-5xl">
              {title}
            </h1>
            <p className="max-w-2xl text-lg text-neutral-800 dark:text-neutral-100">
              {description}
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href={primaryCta.href}
                className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-black"
              >
                {primaryCta.label}
              </a>
              <a
                href={secondaryCta.href}
                className="rounded-full border border-neutral-900 px-6 py-3 text-sm font-semibold text-neutral-900 transition hover:border-neutral-700 hover:bg-neutral-100 dark:border-white/60 dark:text-white dark:hover:bg-white/10"
              >
                {secondaryCta.label}
              </a>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-700 dark:text-neutral-200">
              <span className="rounded-full border border-neutral-400/60 px-3 py-1 dark:border-white/30">
                Secure payments powered by Stripe
              </span>
              <span className="rounded-full border border-neutral-400/60 px-3 py-1 dark:border-white/30">
                GDPR-ready privacy controls
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
