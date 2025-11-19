/*

 AI-generated code: 20% (tool: Codex - GPT-5, HostCardData, RelatedEventItem, EventHostPanel, HostDetailsCard, hasRelatedEvents, relatedEvents, map, Link) 

 Human code: 72% (functions: EventHostPanel, HostDetailsCard, hasRelatedEvents, relatedEvents, map, Link) 

 Framework-generated code: 8% (tool: Next.js, framework: Next.js) 

*/

import Link from "next/link";

import type { HostCardData, RelatedEventItem } from "./viewModel";
import Image from "next/image";

type EventHostPanelProps = {
  host: HostCardData;
  relatedEvents: RelatedEventItem[];
};

export function EventHostPanel({ host, relatedEvents }: EventHostPanelProps) {
  const hasRelatedEvents = relatedEvents.length > 0;

  return (
    <section className="space-y-6 rounded-3xl border border-neutral-200/70 bg-white/90 p-6 shadow-lg shadow-amber-100/40 dark:border-white/10 dark:bg-neutral-900/70 dark:shadow-neutral-900/40">
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          Hosted by
        </h2>
        {host.hasHost ? (
          <HostDetailsCard host={host} />
        ) : (
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {host.emptyStateMessage}
          </p>
        )}
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500 dark:text-neutral-400">
          More from this host
        </h3>

        {hasRelatedEvents ? (
          <ul className="space-y-3">
            {relatedEvents.map((event) => (
              <li key={event.id}>
                <Link
                  href={event.href}
                  className="group flex items-start justify-between rounded-2xl border border-neutral-200/70 bg-white/80 px-4 py-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md focus-visible:-translate-y-0.5 focus-visible:border-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 dark:border-white/10 dark:bg-neutral-900/60 dark:hover:border-amber-400"
                >
                  <div>
                    <p className="text-sm font-semibold text-neutral-800 transition group-hover:text-amber-600 dark:text-neutral-100 dark:group-hover:text-amber-300">
                      {event.name}
                    </p>
                    <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                      {event.dateLabel ?? "Date coming soon"}
                    </p>
                  </div>
                  <span
                    aria-hidden="true"
                    className="mt-1 text-neutral-400 transition group-hover:text-amber-500 dark:text-neutral-500 dark:group-hover:text-amber-300"
                  >
                    &rarr;
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            This is the only event from this host right now. Check back soon!
          </p>
        )}
      </div>
    </section>
  );
}

type HostDetailsCardProps = {
  host: HostCardData;
};

function HostDetailsCard({ host }: HostDetailsCardProps) {
  return (
    <div
      className={`flex items-center gap-4 rounded-2xl border border-neutral-200/70 bg-neutral-100/60 p-4 shadow-sm dark:border-white/10 dark:bg-neutral-900/40`}
    >
      <div
        className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-semibold uppercase text-amber-700 dark:text-amber-200 overflow-hidden"
        style={host.theme?.avatarStyle}
      >
        {host.hostProfilePictureUrl ? (
          <Image
            src={host.hostProfilePictureUrl}
            alt={host.hostName ?? "Host profile picture"}
            width={48}
            height={48}
            className="rounded-full overflow-hidden object-cover"
          />
        ) : (
          host.hostInitials
        )}
      </div>
      <div>
        <p className="text-sm font-semibold dark:text-neutral-500 text-neutral-900">
          {host.hostName}
        </p>
        {host.hostEmail ? (
          <p className="text-xs dark:text-neutral-500 text-neutral-900">
            {host.hostEmail}
          </p>
        ) : null}
      </div>
    </div>
  );
}
