import type { EventAboutData, EventMetadataItem } from "./viewModel";

type EventAboutSectionProps = EventAboutData;

export function EventAboutSection({
  paragraphs,
  metadataItems,
}: EventAboutSectionProps) {
  return (
    <section className="space-y-6 rounded-3xl border border-neutral-200/70 bg-white/85 p-8 shadow-lg shadow-amber-100/30 dark:border-white/10 dark:bg-neutral-900/60 dark:shadow-neutral-900/40">
      <div className="space-y-3">
        <h2 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
          About this experience
        </h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Explore the highlights, location, and schedule before you register.
        </p>
      </div>

      <div className="space-y-4">
        {paragraphs.map((paragraph, index) => (
          <p
            key={`${index}-${paragraph.slice(0, 16)}`}
            className="text-base leading-relaxed text-neutral-700 dark:text-neutral-300"
          >
            {paragraph}
          </p>
        ))}
      </div>

      <EventMetadataGrid items={metadataItems} />
    </section>
  );
}

type EventMetadataGridProps = {
  items: EventMetadataItem[];
};

function EventMetadataGrid({ items }: EventMetadataGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {items.map((item) => (
        <InfoTile key={item.id} item={item} />
      ))}
    </div>
  );
}

type InfoTileProps = {
  item: EventMetadataItem;
};

function InfoTile({ item }: InfoTileProps) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-neutral-200/70 bg-white/80 p-4 shadow-sm dark:border-white/10 dark:bg-neutral-900/50">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-200">
        {renderIcon(item.icon)}
      </span>
      <div>
        <span className="text-xs font-semibold uppercase tracking-[0.32em] text-neutral-500 dark:text-neutral-400">
          {item.label}
        </span>
        <div className="mt-1 text-sm font-medium text-neutral-900 dark:text-neutral-100">
          {item.value}
        </div>
      </div>
    </div>
  );
}

function renderIcon(icon: EventMetadataItem["icon"]) {
  switch (icon) {
    case "calendar":
    case "calendarEnd":
      return (
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      );
    case "location":
      return (
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      );
    case "ticket":
      return (
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          <path d="M3 9h18" />
          <path d="M3 15h18" />
          <path d="M5 5h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V7a2 2 0 0 1 2-2z" />
        </svg>
      );
    case "people":
      return (
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case "refresh":
      return (
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          <polyline points="23 4 23 10 17 10" />
          <polyline points="1 20 1 14 7 14" />
          <path d="M3.51 9a9 9 0 0 1 14.13-3.36L23 10" />
          <path d="M20.49 15a9 9 0 0 1-14.13 3.36L1 14" />
        </svg>
      );
    default:
      return null;
  }
}
