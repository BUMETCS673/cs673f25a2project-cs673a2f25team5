import { currentUser } from "@clerk/nextjs/server";

import {
  createAttendee,
  getAttendees,
  patchAttendees,
} from "@/services/attendees";
import type {
  AttendeeStatus,
  RegisterAttendeeResult,
} from "@/types/registerTypes";

type RegisterActionOptions = {
  hostMessage: string;
  hostUserId: string;
  successMessages: Record<AttendeeStatus, string>;
};

export const HOST_REGISTRATION_MESSAGE =
  "You created this event, so there's no need to register as an attendee.";

export function createRegisterAction({
  hostMessage,
  hostUserId,
  successMessages,
}: RegisterActionOptions) {
  return async function onRegister(
    eventId: string,
    status: AttendeeStatus,
  ): Promise<RegisterAttendeeResult> {
    "use server";

    const viewerSession = await currentUser();
    const viewerExternalId = viewerSession?.externalId ?? null;

    if (!viewerExternalId) {
      return {
        success: false,
        code: "unauthenticated",
        message: "Sign in to register for this event.",
      };
    }

    if (viewerExternalId === hostUserId) {
      return {
        success: false,
        code: "host",
        message: hostMessage,
      };
    }

    try {
      await createAttendee({
        event_id: eventId,
        user_id: viewerExternalId,
        status,
      });

      return {
        success: true,
        status,
        message: successMessages[status],
        toast: "success",
      };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "We couldn't save your registration.";

      if (message.includes("status 409")) {
        let existingStatus: AttendeeStatus | null = null;
        let attendeeId: string | null = null;

        try {
          const attendeeResult = await getAttendees({
            filters: [
              `event_id:eq:${eventId}`,
              `user_id:eq:${viewerExternalId}`,
            ],
            limit: 1,
          });
          const attendee = attendeeResult.items[0];
          existingStatus = attendee?.status ?? null;
          attendeeId = attendee?.attendee_id ?? null;
        } catch {
          existingStatus = null;
          attendeeId = null;
        }

        if (!attendeeId || existingStatus === null) {
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

        if (existingStatus === status) {
          return {
            success: true,
            status: existingStatus,
            message:
              "You're already registered with this status. No changes needed.",
            toast: "info",
          };
        }

        try {
          const patched = await patchAttendees({
            [attendeeId]: {
              op: "replace",
              path: "/status",
              value: status,
            },
          });
          const updatedStatus = (patched[attendeeId]?.status ??
            existingStatus ??
            status) as AttendeeStatus;

          return {
            success: true,
            status: updatedStatus,
            message: successMessages[updatedStatus],
            toast: "success",
          };
        } catch (patchError) {
          console.error("Failed to patch attendee registration", patchError);

          return {
            success: false,
            code: "unknown",
            message:
              "We couldn't update your registration right now. Please try again later.",
            status: existingStatus,
          };
        }
      }

      return {
        success: false,
        code: "unknown",
        message:
          "We couldn't save your registration right now. Please try again later.",
      };
    }
  };
}
