import Heading from "./Heading";

export function HeroSection() {
  return (
    <div className="relative min-h-[200vh] w-full overflow-x-hidden">
      {/* spacer for first screen */}
      <div className="absolute inset-0 -z-10 w-full bg-transparent backdrop-blur-sm bg-opacity-50" />

      {/* Overlay that *moves and rotates* toward the dock card */}
      <Heading />

      {/* CONTENT SECTION */}
      <div className="absolute bottom-0 left-0 flex min-h-screen w-full flex-col gap-10 px-4 pb-20 pt-24 sm:px-6 md:flex-row md:items-center md:justify-between md:gap-14 md:px-12 lg:px-20">
        {/* Left panel */}
        <div
          style={{ pointerEvents: "auto" }}
          className="relative flex max-w-xl flex-col gap-5 overflow-hidden rounded-3xl border border-neutral-200/60 bg-white/85 p-6 text-neutral-900 shadow-2xl backdrop-blur dark:border-white/5 dark:bg-black/60 dark:text-neutral-100"
        >
          <span
            aria-hidden
            className="pointer-events-none absolute animate-spin -top-24 -right-16 h-48 w-48 rounded-full bg-amber-300/50 blur-3xl dark:bg-amber-400/30"
          />
          <h1 className="font-atkinson-hyperlegible-next text-4xl font-bold text-neutral-900 dark:text-neutral-100 md:text-5xl">
            Join us
          </h1>
          <p className="font-atkinson-hyperlegible-next w-full text-md font-semibold text-neutral-700 dark:text-neutral-200 wrap-break-word">
            From private parties to large conferences, Kickaas helps you create,
            manage, and enjoy events effortlessly.
          </p>

          <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-200 md:text-base">
            Launch a beautiful event page, sell out with built-in ticketing,
            keep guests in the loop, and analyze the results without hopping
            between tools.
          </p>
          <ul className="space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
            <li className="flex items-start gap-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-amber-400" />
              Create events in minutes with guided templates
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-amber-400" />
              Sell and scan tickets instantly with built-in QR codes
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-amber-400" />
              Secure payments powered by Stripe and Chapa
            </li>
          </ul>
          <div className="flex flex-wrap gap-3 pt-2">
            <a
              href="/create-events"
              className="group relative overflow-hidden rounded-full bg-amber-400 px-5 py-2 text-sm font-semibold text-black shadow-lg shadow-amber-400/40"
            >
              <span className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-white/70 via-transparent to-white/70 opacity-0 transition duration-500 group-hover:opacity-100" />
              Create an Event
            </a>
            <a
              href="/discover"
              className="rounded-full border border-neutral-400/60 px-5 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-100 dark:border-white/30 dark:text-neutral-200 dark:hover:bg-white/10"
            >
              Find Events Near You
            </a>
          </div>
        </div>

        {/* Right grid (dock target) */}
        <div className="flex h-full flex-1 items-center justify-center">
          <div className="grid h-full w-full grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-5 lg:grid-rows-5">
            <div className="col-span-1 overflow-hidden rounded-3xl border border-neutral-200/60 bg-white/85 p-6 shadow-lg shadow-amber-500/10 backdrop-blur dark:border-white/5 dark:bg-neutral-950/80 sm:col-span-2 lg:col-span-3 lg:row-span-3">
              <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">
                Live run of show
              </p>
              <div className="mt-5 space-y-4">
                {[
                  { time: "08:30", label: "Doors open & welcome" },
                  { time: "09:15", label: "Keynote: Designing hybrid joy" },
                  { time: "11:00", label: "Breakout labs (4 tracks)" },
                  { time: "13:30", label: "Partner showcases" },
                ].map(({ time, label }, index) => (
                  <div
                    key={`${time}-${label}`}
                    className="flex items-start gap-4"
                  >
                    <div className="rounded-xl bg-neutral-900 px-3 py-2 text-xs font-semibold text-amber-300">
                      {time}
                    </div>
                    <div className="text-sm text-neutral-700 dark:text-neutral-200">
                      <p className="font-semibold">{label}</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        {index === 1
                          ? "Streamed to 12k virtual attendees"
                          : index === 2
                            ? "Capacity synced across venues"
                            : "Automated host briefing"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="col-span-1 sm:col-span-2 lg:col-span-2 lg:row-span-2">
              <div className="h-full rounded-3xl border border-amber-500/40 bg-amber-500/10 p-5 text-amber-700 shadow-lg shadow-amber-400/10 dark:text-amber-200">
                <p className="text-xs uppercase tracking-[0.3em]">
                  Fun modern Invites
                </p>
                <div className="mt-6 space-y-4 text-sm">
                  <p className="flex items-center justify-between">
                    Cost
                    <span className="rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-black">
                      100% free
                    </span>
                  </p>
                  <p className="flex items-center justify-between text-neutral-800 dark:text-neutral-100">
                    Customizable
                    <span>Yes</span>
                  </p>
                  <p className="flex items-center justify-between text-neutral-800 dark:text-neutral-100">
                    Easy to use
                    <span>Yes</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="col-span-1 sm:col-span-2 lg:col-span-2 lg:row-span-3">
              <div className="flex h-full flex-col justify-between rounded-3xl border border-neutral-200/60 bg-white/90 p-5 text-neutral-900 shadow-lg shadow-amber-500/10 backdrop-blur dark:border-white/5 dark:bg-white/5 dark:text-neutral-100">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-neutral-500 dark:text-neutral-200">
                    Real-time updates
                  </p>
                  <h3 className="mt-6 text-xl font-semibold text-neutral-900 dark:text-white">
                    See who has RSVPed
                  </h3>
                  <p className="mt-4 text-sm text-neutral-600 dark:text-neutral-300">
                    Send SMS, email, and app notifications without creating
                    duplicate content. Kickaas distributes and tracks
                    engagement.
                  </p>
                </div>
                <button className="self-start rounded-full border border-neutral-400/60 px-4 py-2 text-xs font-semibold text-neutral-700 transition dark:border-white/30 dark:text-white">
                  See who has RSVPed
                </button>
              </div>
            </div>

            <div className="col-span-1 sm:col-span-2 lg:col-span-3 lg:row-span-2">
              <div className="h-full rounded-3xl bg-gradient-to-r from-amber-300/25 via-amber-200/20 to-violet-400/25 p-5 text-neutral-800 shadow-lg shadow-violet-400/10 dark:from-amber-500/15 dark:via-amber-400/10 dark:to-violet-500/10 dark:text-neutral-100"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
