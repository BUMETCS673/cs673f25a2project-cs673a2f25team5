/*

 AI-generated code: 100% (tool: Codex - GPT-5, Generated SVG icons, functions: EventAboutSection, EventMetadataGrid, InfoTile, renderIcon) 

 Human code: 0% (functions: EventAboutSection, EventMetadataGrid, InfoTile, renderIcon) 

 No framework-generated code.

*/

import {
  FaCalendar,
  FaLocationDot,
  FaRotate,
  FaTicket,
  FaUsers,
} from "react-icons/fa6";
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
      return <FaCalendar className="size-5" />;
    case "location":
      return <FaLocationDot className="size-5" />;
    case "ticket":
      return <FaTicket className="size-5" />;
    case "people":
      return <FaUsers className="size-5" />;
    case "refresh":
      return <FaRotate className="size-5" />;
    default:
      return null;
  }
}
