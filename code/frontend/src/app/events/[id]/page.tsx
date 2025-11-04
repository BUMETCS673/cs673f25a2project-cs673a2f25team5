/*

 AI-generated code: 77% (tool: Codex - GPT-5, modified and adapted, functions: EventPage) 

 Human code: 23% (functions: EventPage, setting up filters to get the event and passing params to the getEvents function) 

 No framework-generated code.

*/

export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";

import { EventAboutSection } from "@/component/events/event-detail/EventAboutSection";
import { EventDetailHeader } from "@/component/events/event-detail/EventDetailHeader";
import { EventHostPanel } from "@/component/events/event-detail/EventHostPanel";
import { EventRegisterCard } from "@/component/events/event-detail/EventRegisterCard";
import { EventLocationMapCard } from "@/component/events/event-detail/EventLocationMapCard";
import { buildEventViewModel } from "@/component/events/event-detail/viewModel";
import { getEvents } from "@/services/events";
import { createAttendee, getAttendees } from "@/services/attendees";
import { getUser } from "@/services/users";
import type { AttendeeCreatePayload } from "@/types/attendeeTypes";
import type { EventResponse } from "@/types/eventTypes";

type AttendeeStatus = AttendeeCreatePayload["status"];

type RegisterAttendeeResult =
  | {
      success: true;
      status: AttendeeStatus;
      message: string;
    }
  | {
      success: false;
      code: "unauthenticated" | "alreadyRegistered" | "host" | "unknown";
      message: string;
      status?: AttendeeStatus | null;
    };

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

    const disabledRegister = async (): Promise<RegisterAttendeeResult> => ({
      success: false,
      code: "unknown",
      message: "Registration is disabled in E2E mode.",
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
              <EventAboutSection {...viewModel.about} />
              <EventLocationMapCard location={event.event_location} />
            </section>
            <aside className="space-y-6">
              <EventRegisterCard
                {...viewModel.register}
                eventId={event.event_id}
                onRegister={disabledRegister}
                initialStatus={null}
                isAuthenticated={false}
                isHost={false}
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

  let event: EventResponse;
  try {
    const eventResult = await getEvents({
      filters: [`event_id:eq:${id}`],
      limit: 1,
    });
    if (eventResult.items.length === 0) {
      notFound();
    }
    event = eventResult.items[0];
  } catch (error) {
    if (error instanceof Error && error.message.includes("404")) {
      notFound();
    }
    throw error;
  }

  const viewerPromise = currentUser();

  const attendeeCountPromise = getAttendees({
    filters: [`event_id:eq:${event.event_id}`, `status:eq:RSVPed`],
    limit: 1,
  }).catch(() => null);

  const [host, hostEventsResult, viewer, attendeeCountResult] =
    await Promise.all([
      getUser(event.user_id).catch(() => null),
      getEvents({
        filters: [`user_id:eq:${event.user_id}`],
        limit: 6,
      }).catch(() => null),
      viewerPromise,
      attendeeCountPromise,
    ]);

  const attendeeExternalId = viewer?.externalId ?? null;
  const isHostUser = attendeeExternalId === event.user_id;

  let initialStatus: AttendeeStatus | null = null;

  if (attendeeExternalId && !isHostUser) {
    try {
      const attendeeResult = await getAttendees({
        filters: [
          `event_id:eq:${event.event_id}`,
          `user_id:eq:${attendeeExternalId}`,
        ],
        limit: 1,
      });
      initialStatus = attendeeResult.items[0]?.status ?? null;
    } catch (error) {
      console.error("Failed to load attendee registration", error);
      initialStatus = null;
    }
  }

  const attendeeCount =
    typeof attendeeCountResult?.total === "number"
      ? attendeeCountResult.total
      : null;

  const viewModel = buildEventViewModel({
    event,
    host,
    hostEvents: hostEventsResult?.items ?? [],
    attendeeCount,
  });

  const statusSuccessMessages: Record<AttendeeStatus, string> = {
    RSVPed: "You're all set—see you there!",
    Maybe: "We'll keep a seat warm if you can make it.",
    "Not Going": "Thanks for letting us know.",
  };

  async function onRegister(
    eventId: string,
    status: AttendeeStatus,
  ): Promise<RegisterAttendeeResult> {
    "use server";

    const viewerSession = await currentUser();
    const viewerExternalId = viewerSession?.externalId ?? null;

    try {
      await createAttendee({
        event_id: eventId,
        user_id: viewerExternalId,
        status,
      });

      return {
        success: true,
        status,
        message: statusSuccessMessages[status],
      };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "We couldn't save your registration.";

      if (message.includes("status 409")) {
        let existingStatus: AttendeeStatus | null = null;

        try {
          const attendeeResult = await getAttendees({
            filters: [
              `event_id:eq:${eventId}`,
              `user_id:eq:${viewerExternalId}`,
            ],
            limit: 1,
          });
          existingStatus = attendeeResult.items[0]?.status ?? null;
        } catch {
          existingStatus = null;
        }

        return {
          success: false,
          code: "alreadyRegistered",
          message:
            existingStatus !== null
              ? `You're already marked as "${existingStatus}".`
              : "You're already registered for this event.",
          status: existingStatus,
        };
      }

      return {
        success: false,
        code: "unknown",
        message:
          "We couldn't save your registration right now. Please try again later.",
      };
    }
  }

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
            <EventLocationMapCard location={event.event_location ?? null} />
          </section>

          <aside className="space-y-6">
            <EventRegisterCard
              {...viewModel.register}
              eventId={event.event_id}
              onRegister={onRegister}
              initialStatus={initialStatus}
              isAuthenticated={Boolean(attendeeExternalId)}
              isHost={isHostUser}
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
