import Link from "next/link";

import { EventAboutSection } from "@/component/events/event-detail/EventAboutSection";
import { EventDetailHeader } from "@/component/events/event-detail/EventDetailHeader";
import { EventHostPanel } from "@/component/events/event-detail/EventHostPanel";
import { EventLocationMapCard } from "@/component/events/event-detail/EventLocationMapCard";
import { EventRegisterCard } from "@/component/events/event-detail/EventRegisterCard";
import type { EventViewModel } from "@/component/events/event-detail/viewModel";
import type {
  AttendeeStatusType,
  RegisterAttendeeResult,
} from "@/types/registerTypes";

type EventPageLayoutProps = {
  eventId: string;
  eventLocation: string | null;
  initialStatus: AttendeeStatusType | null;
  isAuthenticated: boolean;
  isHost: boolean;
  onRegister: (
    eventId: string,
    status: AttendeeStatusType,
  ) => Promise<RegisterAttendeeResult>;
  viewModel: EventViewModel;
};

export function EventPageLayout({
  eventId,
  eventLocation,
  initialStatus,
  isAuthenticated,
  isHost,
  onRegister,
  viewModel,
}: EventPageLayoutProps) {
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
            <EventAboutSection {...viewModel.about} />
            <EventLocationMapCard location={eventLocation} />
          </section>

          <aside className="space-y-6">
            <EventRegisterCard
              {...viewModel.register}
              eventId={eventId}
              onRegister={onRegister}
              initialStatus={initialStatus}
              isAuthenticated={isAuthenticated}
              isHost={isHost}
            />
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
