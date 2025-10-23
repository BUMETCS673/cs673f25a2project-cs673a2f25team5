export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";

import { EventAboutSection } from "@/component/events/event-detail/EventAboutSection";
import { EventDetailHeader } from "@/component/events/event-detail/EventDetailHeader";
import { EventHostPanel } from "@/component/events/event-detail/EventHostPanel";
import { EventPreviewComingSoon } from "@/component/events/event-detail/EventPreviewComingSoon";
import { EventRegisterCard } from "@/component/events/event-detail/EventRegisterCard";
import { EventLocationMapCard } from "@/component/events/event-detail/EventLocationMapCard";
import { buildEventViewModel } from "@/component/events/event-detail/viewModel";
import { getEvents } from "@/services/events";
import { getUser } from "@/services/users";

export default async function EventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (process.env.NEXT_PUBLIC_E2E === "1") {
    // Minimal static model for E2E (no SSR network)
    const event = {
      event_id: id,
      event_name: "E2E Event",
      event_datetime: "2025-10-01T10:00:00Z",
      event_endtime: "2025-10-01T12:00:00Z",
      event_location: "Addis Ababa",
      description: "Stubbed description",
      picture_url: null,
      capacity: 10,
      price_field: 0,
      user_id: "00000000-0000-0000-0000-000000000000",
      category_id: "00000000-0000-0000-0000-000000000000",
      created_at: "2025-09-01T00:00:00Z",
      updated_at: "2025-09-01T00:00:00Z",
    };
    const viewModel = buildEventViewModel({
      event,
      host: null,
      hostEvents: [],
    });

    return (
      <main className="relative min-h-screen overflow-hidden bg-neutral-50/80 px-4 py-16 sm:px-6 lg:px-16 dark:bg-neutral-950">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-12">
          <nav>
            <Link
              href="/events"
              className="inline-flex items-center gap-2 text-sm font-medium"
            >
              Back to events
            </Link>
          </nav>
          <article className="grid gap-12 lg:grid-cols-[minmax(0,2fr),minmax(0,1fr)]">
            <section className="space-y-8">
              <EventDetailHeader {...viewModel.header} />
              <EventPreviewComingSoon />
              <EventAboutSection {...viewModel.about} />
              <EventLocationMapCard location={event.event_location} />
            </section>
            <aside className="space-y-6">
              <EventRegisterCard {...viewModel.register} />
              <EventHostPanel
                host={viewModel.hostCard}
                relatedEvents={viewModel.relatedEvents}
              />
            </aside>
          </article>
        </div>
      </main>
    );
  }

  let event;
  try {
    console.log(`event_id:eq:${id}`);
    event = await getEvents({
      filters: [`event_id:eq:${id}`],
      limit: 1,
    });
    if (event.items.length === 0) {
      notFound();
    }
    event = event.items[0];
    console.log(event);
  } catch (error) {
    if (error instanceof Error && error.message.includes("404")) {
      notFound();
    }
    throw error;
  }

  const [host, hostEventsResult] = await Promise.all([
    getUser(event.user_id).catch(() => null),
    getEvents({
      filters: [`user_id:eq:${event.user_id}`],
      limit: 6,
    }).catch(() => null),
  ]);

  const viewModel = buildEventViewModel({
    event,
    host,
    hostEvents: hostEventsResult?.items ?? [],
  });

  return (
    <main className="relative min-h-screen overflow-hidden bg-neutral-50/80 px-4 py-16 sm:px-6 lg:px-16 dark:bg-neutral-950">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-amber-200/40 via-transparent to-purple-200/35 blur-3xl dark:from-amber-400/10 dark:to-purple-500/15" />

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12">
        <nav>
          <Link
            href="/events"
            className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 transition hover:text-amber-600 focus-visible:text-amber-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 dark:text-neutral-400 dark:hover:text-amber-300"
          >
            <svg
              aria-hidden="true"
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back to events
          </Link>
        </nav>

        <article className="grid gap-12 lg:grid-cols-[minmax(0,2fr),minmax(0,1fr)]">
          <section className="space-y-8">
            <EventDetailHeader {...viewModel.header} />

            {!viewModel.heroMedia.pictureUrl ? (
              <EventPreviewComingSoon />
            ) : null}
            <EventAboutSection {...viewModel.about} />
            <EventLocationMapCard location={event.event_location ?? null} />
          </section>

          <aside className="space-y-6">
            <EventRegisterCard {...viewModel.register} />
            <EventHostPanel
              host={viewModel.hostCard}
              relatedEvents={viewModel.relatedEvents}
            />
          </aside>
        </article>
      </div>
    </main>
  );
}
