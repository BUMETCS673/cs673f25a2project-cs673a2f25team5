/*

 AI-generated code: 0%

 Human code: 100% (functions: fetchEventDetailData, fetchInitialAttendeeStatus)

 framework-generated code: 0%

*/

import { notFound } from "next/navigation";
import { getAttendees } from "@/services/attendees";
import { getEvents } from "@/services/events";
import { getUser } from "@/services/users";
import type { EventResponse } from "@/types/eventTypes";
import type { AttendeeStatus } from "@/types/registerTypes";
import type { UserResponse } from "@/types/userTypes";

type EventDetailData = {
  attendeeCount: number | null;
  event: EventResponse;
  host: UserResponse | null;
  hostEvents: EventResponse[];
};

type FetchInitialStatusParams = {
  attendeeExternalId: string | null;
  eventId: string;
  isHostUser: boolean;
};

export async function fetchEventDetailData(
  eventId: string,
): Promise<EventDetailData> {
  let event: EventResponse;

  try {
    const eventResult = await getEvents({
      filters: [`event_id:eq:${eventId}`],
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

  const attendeeCountPromise = getAttendees({
    filters: [`event_id:eq:${event.event_id}`, `status:eq:RSVPed`],
    limit: 1,
  }).catch(() => null);

  const [host, hostEventsResult, attendeeCountResult] = await Promise.all([
    getUser(event.user_id).catch(() => null),
    getEvents({
      filters: [`user_id:eq:${event.user_id}`],
      limit: 6,
    }).catch(() => null),
    attendeeCountPromise,
  ]);

  const attendeeCount =
    typeof attendeeCountResult?.total === "number"
      ? attendeeCountResult.total
      : null;

  return {
    attendeeCount,
    event,
    host,
    hostEvents: hostEventsResult?.items ?? [],
  };
}

export async function fetchInitialAttendeeStatus({
  attendeeExternalId,
  eventId,
  isHostUser,
}: FetchInitialStatusParams): Promise<AttendeeStatus | null> {
  if (!attendeeExternalId || isHostUser) {
    return null;
  }

  try {
    const attendeeResult = await getAttendees({
      filters: [`event_id:eq:${eventId}`, `user_id:eq:${attendeeExternalId}`],
      limit: 1,
    });

    return attendeeResult.items[0]?.status ?? null;
  } catch (error) {
    console.error("Failed to load attendee registration", error);
    return null;
  }
}
