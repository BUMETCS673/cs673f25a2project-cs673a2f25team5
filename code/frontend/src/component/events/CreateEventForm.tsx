"use client";

import { FormEvent, useState } from "react";

import {
  EventFormSchema,
  buildEventCreatePayload,
  type EventFormInput,
} from "./createEventSchema";
import { createEvent } from "@/services/events";
import { useUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";

type SubmissionState = "idle" | "submitting" | "success";

const createEmptyFormValues = (): EventFormInput => ({
  eventName: "",
  startDate: "",
  startTime: "",
  endDate: "",
  endTime: "",
  location: "",
  description: "",
  pictureUrl: "",
  capacity: "",
  price: "",
});

const inputClass =
  "w-full rounded-2xl border border-neutral-200 bg-white/90 px-4 py-3 text-sm text-neutral-800 shadow-sm transition focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200 dark:border-white/10 dark:bg-white/5 dark:text-neutral-100";

const labelClass = "text-sm font-medium text-neutral-700 dark:text-neutral-200";

export function CreateEventForm() {
  const [formValues, setFormValues] = useState<EventFormInput>(
    createEmptyFormValues,
  );
  const [status, setStatus] = useState<SubmissionState>("idle");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);
  const { user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress;
  const userId = user?.externalId;

  const updateField = (field: keyof EventFormInput, value: string) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
    setValidationErrors([]);
    setServerError(null);
    if (status === "success") {
      setStatus("idle");
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userId) {
      setValidationErrors(["You must be logged in to create an event"]);
      setStatus("idle");
      return;
    }
    setStatus("submitting");
    setValidationErrors([]);
    setServerError(null);

    const result = EventFormSchema.safeParse(formValues);
    if (!result.success) {
      const issues = result.error.issues.map((issue) => issue.message);
      setValidationErrors(Array.from(new Set(issues)));
      setStatus("idle");
      return;
    }

    try {
      const valuesWithCategory = {
        ...result.data,
        categoryId: "2db3d8ac-257c-4ff9-ad97-ba96bfbf9bc5",
      };
      await createEvent(buildEventCreatePayload(valuesWithCategory, userId));
      setStatus("success");
      setFormValues(createEmptyFormValues());
      setTimeout(() => {
        redirect(`/events`);
      }, 3000);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "We could not save the event. Please try again.";
      setServerError(message);
      setStatus("idle");
    }
  };

  return (
    <div className="grid gap-10 lg:grid-cols-[1.6fr,1fr]">
      <form
        onSubmit={handleSubmit}
        className="rounded-3xl border border-neutral-200/70 bg-white/85 p-8 shadow-xl shadow-amber-500/10 backdrop-blur-md dark:border-white/10 dark:bg-neutral-900/60"
      >
        <div className="flex items-start justify-between gap-6">
          <div>
            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
              Event details
            </h2>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              Share the essentials your guests need before you publish.
            </p>
          </div>
          {email ? (
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
              Signed in as {email}
            </span>
          ) : null}
        </div>

        {validationErrors.length > 0 ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-200">
            <p className="font-medium">Please fix the following:</p>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              {validationErrors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {serverError ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-200">
            {serverError}
          </div>
        ) : null}

        {status === "success" ? (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-200">
            New Event Created Successfully!
          </div>
        ) : null}

        <div className="mt-8 grid gap-6">
          <label className="grid gap-2">
            <span className={labelClass}>Event name</span>
            <input
              value={formValues.eventName}
              onChange={(event) => updateField("eventName", event.target.value)}
              placeholder="Moonlight Rooftop Concert"
              className={inputClass}
            />
          </label>

          <label className="grid gap-2">
            <span className={labelClass}>Event image URL</span>
            <input
              value={formValues.pictureUrl}
              onChange={(event) =>
                updateField("pictureUrl", event.target.value)
              }
              placeholder="https://example.com/event-image.jpg"
              className={inputClass}
            />
          </label>

          <div className="grid gap-6 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className={labelClass}>Start date</span>
              <input
                type="date"
                value={formValues.startDate}
                onChange={(event) =>
                  updateField("startDate", event.target.value)
                }
                className={inputClass}
              />
            </label>
            <label className="grid gap-2">
              <span className={labelClass}>Start time</span>
              <input
                type="time"
                value={formValues.startTime}
                onChange={(event) =>
                  updateField("startTime", event.target.value)
                }
                className={inputClass}
              />
            </label>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className={labelClass}>End date</span>
              <input
                type="date"
                value={formValues.endDate}
                onChange={(event) => updateField("endDate", event.target.value)}
                className={inputClass}
              />
            </label>
            <label className="grid gap-2">
              <span className={labelClass}>End time</span>
              <input
                type="time"
                value={formValues.endTime}
                onChange={(event) => updateField("endTime", event.target.value)}
                className={inputClass}
              />
            </label>
          </div>

          <label className="grid gap-2">
            <span className={labelClass}>Location</span>
            <input
              value={formValues.location}
              onChange={(event) => updateField("location", event.target.value)}
              placeholder="123 Main St, Boston, MA"
              className={inputClass}
            />
          </label>

          <div className="grid gap-6 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className={labelClass}>Capacity</span>
              <input
                type="number"
                min={1}
                step={1}
                value={formValues.capacity}
                onChange={(event) =>
                  updateField("capacity", event.target.value)
                }
                placeholder="150"
                className={inputClass}
              />
            </label>
            <label className="grid gap-2">
              <span className={labelClass}>Ticket price (USD)</span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={formValues.price}
                onChange={(event) => updateField("price", event.target.value)}
                placeholder="45.00"
                className={inputClass}
              />
            </label>
          </div>

          <label className="grid gap-2">
            <span className={labelClass}>Description</span>
            <textarea
              value={formValues.description}
              onChange={(event) =>
                updateField("description", event.target.value)
              }
              placeholder="Share the schedule, special guests, and what makes this event memorable."
              rows={5}
              className={`${inputClass} resize-none`}
            />
          </label>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="submit"
              disabled={status === "submitting"}
              className="flex items-center justify-center rounded-full bg-gradient-to-r from-amber-300 via-purple-400 to-amber-300 px-6 py-3 text-sm font-semibold text-neutral-900 shadow-sm transition disabled:cursor-not-allowed disabled:opacity-70"
            >
              {status === "submitting" ? "Creating…" : "Create event"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
