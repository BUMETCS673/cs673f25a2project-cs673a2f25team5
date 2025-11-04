/*

 AI-generated code: 0%

 Human code: 100% (StatusOption, STATUS_OPTIONS, SUCCESS_MESSAGE_BY_STATUS, STATUS_LABEL_MAP, handleSelect) 

 No framework-generated code.

*/

"use client";

import { useEffect, useMemo, useState } from "react";

import type { AttendeeCreatePayload } from "@/types/attendeeTypes";
import type { EventRegisterData } from "./viewModel";
import { useToast } from "@/component/ui/toast/ToastProvider";

type AttendeeStatus = AttendeeCreatePayload["status"];

type RegisterResult =
  | {
      success: true;
      status: AttendeeStatus;
      message: string;
    }
  | {
      success: false;
      code: "unauthenticated" | "alreadyRegistered" | "unknown";
      message: string;
      status?: AttendeeStatus | null;
    };

type EventRegisterCardProps = EventRegisterData & {
  eventId: string;
  onRegister: (
    eventId: string,
    status: AttendeeStatus,
  ) => Promise<RegisterResult>;
  initialStatus: AttendeeStatus | null;
  isAuthenticated: boolean;
  note?: string;
};

type StatusOption = {
  value: AttendeeStatus;
  label: string;
  description: string;
};

const STATUS_OPTIONS: StatusOption[] = [
  {
    value: "RSVPed",
    label: "Going",
    description: "Reserve my spot — I'm planning to attend.",
  },
  {
    value: "Maybe",
    label: "Maybe",
    description: "I'm interested but need to confirm.",
  },
  {
    value: "Not Going",
    label: "Not going",
    description: "I can't make it this time.",
  },
];

const SUCCESS_MESSAGE_BY_STATUS: Record<AttendeeStatus, string> = {
  RSVPed: "You're all set—see you there!",
  Maybe: "We'll keep a seat warm if you can make it.",
  "Not Going": "Thanks for letting us know.",
};

const STATUS_LABEL_MAP: Record<AttendeeStatus, string> = {
  RSVPed: "Going",
  Maybe: "Maybe",
  "Not Going": "Not going",
};

export function EventRegisterCard({
  ctaLabel,
  note,
  eventId,
  onRegister,
  initialStatus,
  isAuthenticated,
}: EventRegisterCardProps) {
  const [selectedStatus, setSelectedStatus] = useState<AttendeeStatus | null>(
    initialStatus,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  const initialStatusMessage = useMemo(() => {
    if (!initialStatus) {
      return null;
    }
    return `You're currently marked as ${STATUS_LABEL_MAP[initialStatus]}.`;
  }, [initialStatus]);

  useEffect(() => {
    setSelectedStatus(initialStatus);
    setFeedback(initialStatusMessage);
  }, [initialStatus, initialStatusMessage]);

  const handleSelect = async (status: AttendeeStatus) => {
    if (isSubmitting) {
      return;
    }

    setError(null);
    setFeedback(null);

    if (!isAuthenticated) {
      setError("Sign in to register for this event.");
      showToast({
        type: "info",
        title: "Sign in required",
        description: "Sign in to RSVP and receive event updates.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await onRegister(eventId, status);

      if (result.success) {
        setSelectedStatus(result.status);
        const message =
          result.message ?? SUCCESS_MESSAGE_BY_STATUS[result.status];
        setFeedback(message);
        showToast({
          type: "success",
          title: "RSVP saved",
          description: message,
        });
        return;
      }

      if (result.status) {
        setSelectedStatus(result.status);
      }

      if (result.code === "alreadyRegistered") {
        setFeedback(result.message);
        showToast({
          type: "info",
          title: "Already registered",
          description: result.message,
        });
      } else {
        setError(result.message);
        showToast({
          type: "error",
          title: "Could not save RSVP",
          description: result.message,
        });
      }
    } catch (error) {
      console.error("Failed to update registration", error);
      setError("We couldn't update your registration. Please try again.");
      showToast({
        type: "error",
        title: "Something went wrong",
        description: "We couldn't update your RSVP. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="rounded-3xl border border-neutral-200/70 bg-white/90 p-6 shadow-lg shadow-amber-100/40 dark:border-white/10 dark:bg-neutral-900/70 dark:shadow-neutral-900/40">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            Ready to register?
          </h2>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            Secure your spot by letting the host know your plans.
          </p>
        </div>
        <span className="whitespace-nowrap rounded-full bg-amber-100/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-700 shadow-sm dark:bg-amber-400/15 dark:text-amber-200">
          {ctaLabel}
        </span>
      </div>

      <div className="mt-5 space-y-3">
        {STATUS_OPTIONS.map((option) => {
          const isActive = option.value === selectedStatus;
          return (
            <button
              key={option.value}
              type="button"
              className={`flex w-full items-start gap-3 rounded-2xl border px-4 py-3 text-left transition focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-amber-300 dark:focus-visible:outline-amber-300 ${isActive ? "border-amber-400 bg-amber-50 shadow-sm shadow-amber-100/40 dark:border-amber-300/60 dark:bg-amber-400/10 dark:shadow-amber-400/20" : "border-neutral-200/70 bg-white/80 hover:border-amber-300 hover:bg-amber-50/40 dark:border-white/10 dark:bg-neutral-900/60 dark:hover:border-amber-300/60 dark:hover:bg-amber-300/5"} ${isSubmitting ? "opacity-80" : ""}`}
              onClick={() => handleSelect(option.value)}
              disabled={isSubmitting}
              aria-pressed={isActive}
            >
              <span
                className={`mt-0.5 inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-medium ${isActive ? "bg-amber-400 text-neutral-900 dark:bg-amber-300 dark:text-neutral-900" : "bg-neutral-200/80 text-neutral-700 dark:bg-white/10 dark:text-neutral-300"}`}
              >
                {option.label.slice(0, 1)}
              </span>
              <span className="flex-1">
                <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                  {option.label}
                </span>
                <span className="mt-1 block text-sm text-neutral-600 dark:text-neutral-400">
                  {option.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {feedback ? (
        <p className="mt-4 rounded-2xl border border-emerald-200/70 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 shadow-sm dark:border-emerald-400/40 dark:bg-emerald-400/10 dark:text-emerald-200">
          {feedback}
        </p>
      ) : null}

      {error ? (
        <p className="mt-4 rounded-2xl border border-red-200/70 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm dark:border-red-400/40 dark:bg-red-400/10 dark:text-red-200">
          {error}
        </p>
      ) : null}

      {!isAuthenticated ? (
        <p className="mt-3 text-xs text-neutral-500 dark:text-neutral-400">
          Sign in to manage your RSVP and receive event updates.
        </p>
      ) : null}

      {note ? (
        <p className="mt-3 text-xs text-neutral-500 dark:text-neutral-400">
          {note}
        </p>
      ) : null}
    </section>
  );
}
