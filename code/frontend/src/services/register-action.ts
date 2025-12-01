/*
 AI-generated code: 100%
*/

import { currentUser } from "@clerk/nextjs/server";

import {
  createAttendee,
  getAttendees,
  patchAttendees,
} from "@/services/attendees";
import { createCheckoutSession } from "./payments";
import type {
  AttendeeStatus,
  RegisterAttendeeResult,
} from "@/types/registerTypes";
import { REGISTRATION_CLOSED_MESSAGE } from "@/types/registerTypes";
import { hasEventEnded } from "@/helpers/eventTime";

type RegisterActionOptions = {
  hostMessage: string;
  hostUserId: string;
  eventStartTime?: string | null;
  eventEndTime?: string | null;
  priceCents?: number | null;
  successMessages: Record<AttendeeStatus, string>;
};

export const HOST_REGISTRATION_MESSAGE =
  "You created this event, so there's no need to register as an attendee.";

export function createRegisterAction({
  hostMessage,
  hostUserId,
  eventStartTime = null,
  eventEndTime = null,
  priceCents = null,
  successMessages,
}: RegisterActionOptions) {
  // Prevent concurrent payment attempts for the same user/event within this server runtime.
  // This keeps rapid double-submits from creating multiple checkout sessions.
  const inFlightPaidRegistrations = new Set<string>();

  return async function onRegister(
    eventId: string,
    status: AttendeeStatus,
  ): Promise<RegisterAttendeeResult> {
    "use server";

    const viewerSession = await currentUser();
    const viewerExternalId = viewerSession?.externalId ?? null;
    const viewerEmail =
      viewerSession?.primaryEmailAddress?.emailAddress ??
      viewerSession?.emailAddresses?.[0]?.emailAddress ??
      null;
    const isPaidEvent =
      typeof priceCents === "number" &&
      Number.isFinite(priceCents) &&
      priceCents > 0;
    const amountUsd = isPaidEvent
      ? Number((Math.round(priceCents) / 100).toFixed(2))
      : null;

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

    if (hasEventEnded({ eventStart: eventStartTime, eventEnd: eventEndTime })) {
      return {
        success: false,
        code: "eventClosed",
        message: REGISTRATION_CLOSED_MESSAGE,
      };
    }

    const registrationResult =
      await (async (): Promise<RegisterAttendeeResult> => {
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

            if (
              hasEventEnded({
                eventStart: eventStartTime,
                eventEnd: eventEndTime,
              })
            ) {
              return {
                success: false,
                code: "eventClosed",
                message: REGISTRATION_CLOSED_MESSAGE,
                status: existingStatus,
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
              console.error(
                "Failed to patch attendee registration",
                patchError,
              );

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
      })();

    if (registrationResult.success && status === "RSVPed" && isPaidEvent) {
      const inflightKey = `${eventId}:${viewerExternalId}`;

      if (inFlightPaidRegistrations.has(inflightKey)) {
        return {
          success: true,
          status: registrationResult.status ?? status,
          message:
            "Your payment is already in progress. If you aren’t redirected, refresh and try again.",
          toast: "info",
        };
      }

      inFlightPaidRegistrations.add(inflightKey);
      try {
        const checkout = await createCheckoutSession({
          event_id: eventId,
          user_id: viewerExternalId,
          amount_usd: amountUsd ?? 0,
          email: viewerEmail,
        });

        if (checkout.already_paid) {
          return {
            ...registrationResult,
            message:
              "You're already paid up for this event. We'll keep your spot confirmed.",
            toast: "info",
          };
        }

        if (!checkout.checkout_url) {
          throw new Error("Missing checkout_url from backend");
        }

        return {
          ...registrationResult,
          message: "Redirecting to secure checkout to confirm your spot.",
          toast: "info",
          redirectUrl: checkout.checkout_url,
        };
      } catch (error) {
        console.error("Failed to start Stripe checkout", error);
        return {
          success: false,
          code: "paymentFailed",
          message:
            "We couldn't start checkout for this event. Please try again.",
          status: registrationResult.status ?? null,
        };
      } finally {
        inFlightPaidRegistrations.delete(inflightKey);
      }
    }

    return registrationResult;
  };
}
