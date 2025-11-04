/*

 AI-generated code: 0%

 Human code: 100% (StatusOption, STATUS_OPTIONS, SUCCESS_MESSAGE_BY_STATUS, STATUS_LABEL_MAP, handleSelect) 

 No framework-generated code.

*/

"use client";

import { useEffect, useMemo, useState } from "react";

import type { AttendeeCreatePayload } from "@/types/attendeeTypes";
import type { EventRegisterData } from "./viewModel";
import { toast } from "sonner";
import { Toaster } from "sonner";

type AttendeeStatus = AttendeeCreatePayload["status"];

type RegisterResult =
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

type EventRegisterCardProps = EventRegisterData & {
  eventId: string;
  onRegister: (
    eventId: string,
    status: AttendeeStatus,
  ) => Promise<RegisterResult>;
  initialStatus: AttendeeStatus | null;
  isAuthenticated: boolean;
  isHost: boolean;
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
  attendeeCount,
  capacity,
  eventId,
  onRegister,
  initialStatus,
  isAuthenticated,
  isHost,
}: EventRegisterCardProps) {
  const [selectedStatus, setSelectedStatus] = useState<AttendeeStatus | null>(
    initialStatus,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentAttendeeCount, setCurrentAttendeeCount] = useState<number>(
    attendeeCount ?? 0,
  );
  const hostMessage =
    "You created this event, so there's no need to register as an attendee.";

  const initialStatusMessage = useMemo(() => {
    if (!initialStatus) {
      return null;
    }
    return `You're currently marked as ${STATUS_LABEL_MAP[initialStatus]}.`;
  }, [initialStatus]);

  useEffect(() => {
    if (isHost) {
      setSelectedStatus(null);
      setFeedback(hostMessage);
      return;
    }

    setSelectedStatus(initialStatus);
    setFeedback(initialStatusMessage);
  }, [hostMessage, initialStatus, initialStatusMessage, isHost]);

  useEffect(() => {
    if (typeof attendeeCount === "number" && attendeeCount >= 0) {
      setCurrentAttendeeCount(attendeeCount);
    }
  }, [attendeeCount]);

  const normalizedCapacity =
    typeof capacity === "number" && capacity > 0 ? capacity : null;
  const hasCapacityLimit = normalizedCapacity !== null;
  const isAtCapacity =
    hasCapacityLimit && currentAttendeeCount >= normalizedCapacity;
  const remainingSeats = hasCapacityLimit
    ? Math.max(normalizedCapacity - currentAttendeeCount, 0)
    : null;

  const handleSelect = async (status: AttendeeStatus) => {
    if (isSubmitting) {
      return;
    }

    setError(null);
    setFeedback(null);

    if (isHost) {
      setSelectedStatus(null);
      setFeedback(hostMessage);
      toast.info(hostMessage);
      return;
    }

    if (!isAuthenticated) {
      setError("Sign in to register for this event.");
      toast.info("Sign in to register for this event.");
      return;
    }

    const priorStatus = selectedStatus;
    const capacityReachedMessage =
      "This event has reached its capacity. Registration is currently closed.";

    if (isAtCapacity && status === "RSVPed" && priorStatus !== "RSVPed") {
      setError(capacityReachedMessage);
      toast.info(capacityReachedMessage);
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await onRegister(eventId, status);

      if (result.success) {
        setSelectedStatus(result.status);
        if (priorStatus !== "RSVPed" && result.status === "RSVPed") {
          setCurrentAttendeeCount((count) => count + 1);
        } else if (priorStatus === "RSVPed" && result.status !== "RSVPed") {
          setCurrentAttendeeCount((count) => Math.max(0, count - 1));
        }
        const message =
          result.message ?? SUCCESS_MESSAGE_BY_STATUS[result.status];
        setFeedback(message);
        toast.success(message);
        return;
      }

      if (result.status) {
        setSelectedStatus(result.status);
      }

      if (result.code === "alreadyRegistered") {
        setFeedback(result.message);
        toast.info(result.message);
      } else if (result.code === "host") {
        setSelectedStatus(null);
        setFeedback(result.message ?? hostMessage);
        toast.info(result.message ?? hostMessage);
      } else if (
        hasCapacityLimit &&
        result.message.toLowerCase().includes("capacity")
      ) {
        setError(result.message);
        toast.info(result.message);
      } else {
        setError(result.message);
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Failed to update registration", error);
      setError("We couldn't update your registration. Please try again.");
      toast.error("We couldn't update your registration. Please try again.");
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

      <div className="mt-5 rounded-2xl border border-amber-200/60 bg-amber-50/60 px-4 py-3 text-sm text-amber-800 dark:border-amber-400/30 dark:bg-amber-300/10 dark:text-amber-200">
        <div className="flex items-center justify-between">
          <span className="font-semibold">Registrations</span>
          <span className="font-medium">
            {currentAttendeeCount.toLocaleString()}
            {hasCapacityLimit
              ? ` / ${normalizedCapacity?.toLocaleString()}`
              : ""}
          </span>
        </div>
        {hasCapacityLimit && remainingSeats !== null ? (
          <p className="mt-1 text-xs text-amber-700/80 dark:text-amber-200/70">
            {isAtCapacity
              ? "Capacity reached — new registrations are closed."
              : `${remainingSeats.toLocaleString()} seat${
                  remainingSeats === 1 ? "" : "s"
                } available`}
          </p>
        ) : (
          <p className="mt-1 text-xs text-amber-700/80 dark:text-amber-200/70">
            Open event — no attendee limit.
          </p>
        )}
      </div>

      <div className="mt-5 space-y-3">
        {STATUS_OPTIONS.map((option) => {
          const isActive = option.value === selectedStatus;
          const shouldDisableOption =
            isSubmitting ||
            (isAtCapacity &&
              option.value === "RSVPed" &&
              selectedStatus !== "RSVPed");
          return (
            <button
              key={option.value}
              type="button"
              className={`flex w-full items-start gap-3 rounded-2xl border px-4 py-3 text-left transition focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-amber-300 dark:focus-visible:outline-amber-300 ${isActive ? "border-amber-400 bg-amber-50 shadow-sm shadow-amber-100/40 dark:border-amber-300/60 dark:bg-amber-400/10 dark:shadow-amber-400/20" : "border-neutral-200/70 bg-white/80 hover:border-amber-300 hover:bg-amber-50/40 dark:border-white/10 dark:bg-neutral-900/60 dark:hover:border-amber-300/60 dark:hover:bg-amber-300/5"} ${isSubmitting ? "opacity-80" : ""}`}
              onClick={() => handleSelect(option.value)}
              disabled={shouldDisableOption}
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
