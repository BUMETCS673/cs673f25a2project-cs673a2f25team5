import type { EventHeaderData, EventStatusTone } from "./viewModel";

const STATUS_TONE_CLASSES: Record<EventStatusTone, string> = {
  past: "bg-neutral-200/80 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
  live: "bg-amber-200/80 text-amber-900 dark:bg-amber-500/15 dark:text-amber-200",
  upcoming:
    "bg-emerald-200/80 text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-200",
};

type EventDetailHeaderProps = EventHeaderData;

export function EventDetailHeader({
  title,
  statusLabel,
  statusTone,
  startBadgeLabel,
  metaSummary,
}: EventDetailHeaderProps) {
  return (
    <header className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] ${STATUS_TONE_CLASSES[statusTone]}`}
        >
          {statusLabel}
        </span>
        {startBadgeLabel ? (
          <span className="inline-flex items-center rounded-full border border-amber-300/60 bg-amber-100/70 px-3 py-1 text-xs font-medium text-amber-900 dark:border-amber-400/40 dark:bg-amber-500/10 dark:text-amber-200">
            {startBadgeLabel}
          </span>
        ) : null}
      </div>
      <div className="space-y-3">
        <h1 className="text-4xl font-bold text-neutral-900 sm:text-5xl dark:text-neutral-50">
          {title}
        </h1>
        <p className="text-base text-neutral-600 dark:text-neutral-400">
          {metaSummary}
        </p>
      </div>
    </header>
  );
}
