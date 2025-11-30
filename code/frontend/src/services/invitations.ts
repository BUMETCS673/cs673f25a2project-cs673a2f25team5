"use server";

/*

 AI-generated code: 0%

 Human code: 100% (functions: fetchPendingInvitations, formatEventDate, isEventUpcoming)

 Framework-generated code: 0%

*/

import { getAttendees } from "./attendees";
import { getEvents } from "./events";
import type { InvitationSummary } from "@/types/invitationTypes";
import { decodeEventLocation } from "@/helpers/locationCodec";

const MAX_PENDING_INVITATIONS_FETCH_LIMIT = 200;

function formatEventDate(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function isEventUpcoming(
  event_datetime: string | null | undefined,
  event_endtime: string | null | undefined,
) {
  const fallback = event_datetime ?? null;
  const end = event_endtime ?? fallback;
  if (!end) return false;
  const parsed = new Date(end);
  if (Number.isNaN(parsed.getTime())) {
    return false;
  }
  return parsed.getTime() > Date.now();
}

export async function fetchPendingInvitations(
  userId: string,
): Promise<InvitationSummary[]> {
  try {
    const attendeeResult = await getAttendees({
      filters: [`user_id:eq:${userId}`],
      limit: MAX_PENDING_INVITATIONS_FETCH_LIMIT,
    });

    const pending = attendeeResult.items.filter((item) => item.status === null);
    if (pending.length === 0) {
      return [];
    }

    const eventIds = Array.from(new Set(pending.map((item) => item.event_id)));
    const events = await Promise.all(
      eventIds.map(async (eventId) => {
        try {
          const result = await getEvents({
            filters: [`event_id:eq:${eventId}`],
            limit: 1,
          });
          return result.items[0] ?? null;
        } catch (error) {
          console.error("Failed to load event for invitation", error);
          return null;
        }
      }),
    );

    const eventMap = new Map(
      events
        .filter(
          (event) =>
            event && isEventUpcoming(event.event_datetime, event.event_endtime),
        )
        .map((event) => [event!.event_id, event!]),
    );

    return pending
      .map((invite) => {
        const event = eventMap.get(invite.event_id);
        if (!event) {
          return null;
        }
        const decodedLocation = decodeEventLocation(event.event_location);
        return {
          attendeeId: invite.attendee_id,
          eventId: invite.event_id,
          eventName: event.event_name,
          eventDateLabel: formatEventDate(event.event_datetime),
          eventLocation: decodedLocation?.address ?? null,
        } satisfies InvitationSummary;
      })
      .filter(Boolean) as InvitationSummary[];
  } catch (error) {
    console.error("Failed to fetch pending invitations", error);
    return [];
  }
}
