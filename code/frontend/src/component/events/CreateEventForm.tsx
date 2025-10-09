"use client";

import { FormEvent, useMemo, useState } from "react";

type EventFormState = {
  title: string;

  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  location: string;
  capacity: string;
  price: string;
  isVirtual: boolean;
  category: string;
  description: string;
  image: File | null;
};

const SAVE_TIMEOUT = 600;

const INITIAL_FORM: EventFormState = {
  title: "",

  startDate: "",
  startTime: "",
  endDate: "",
  endTime: "",
  location: "",
  capacity: "",
  price: "",
  isVirtual: false,
  category: "",
  description: "",
  image: null,
};

type SubmissionState = "idle" | "submitting" | "success";

export function CreateEventForm({
  organizerEmail,
}: {
  organizerEmail?: string;
}) {
  const [formState, setFormState] = useState<EventFormState>(INITIAL_FORM);
  const [status, setStatus] = useState<SubmissionState>("idle");
  const [errors, setErrors] = useState<string[]>([]);
  const [lastSaved, setLastSaved] = useState<EventFormState | null>(null);

  const inputClass =
    "w-full rounded-2xl border border-neutral-200 bg-white/90 px-4 py-3 text-sm text-neutral-800 shadow-sm transition focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200 dark:border-white/10 dark:bg-white/5 dark:text-neutral-100";

  const labelClass =
    "text-sm font-medium text-neutral-700 dark:text-neutral-200";

  const previewDetails = useMemo(() => {
    if (!lastSaved) {
      return [];
    }
    const entries: Array<{ label: string; value: string }> = [
      { label: "Event", value: lastSaved.title },
      {
        label: "When",
        value: `${lastSaved.startDate || "?"} ${
          lastSaved.startTime || ""
        } ${lastSaved.endDate ? `→ ${lastSaved.endDate}` : ""} ${
          lastSaved.endTime || ""
        }`.trim(),
      },
      {
        label: "Location",
        value: lastSaved.isVirtual
          ? `Virtual${lastSaved.location ? ` • ${lastSaved.location}` : ""}`
          : lastSaved.location || "Not provided",
      },
      {
        label: "Capacity",
        value: lastSaved.capacity ? `${lastSaved.capacity} guests` : "Open",
      },
      {
        label: "Price",
        value: lastSaved.price
          ? `$${Number(lastSaved.price).toFixed(2)}`
          : "Free",
      },
      {
        label: "Category",
        value: lastSaved.category || "Not specified",
      },
      {
        label: "Description",
        value: lastSaved.description || "No description yet.",
      },
    ];

    return entries;
  }, [lastSaved]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("submitting");

    const currentErrors: string[] = [];
    if (!formState.title.trim()) {
      currentErrors.push("Event name is required.");
    }
    if (!formState.startDate) {
      currentErrors.push("Start date is required.");
    }
    if (!formState.startTime) {
      currentErrors.push("Start time is required.");
    }
    if (!formState.location.trim() && !formState.isVirtual) {
      currentErrors.push("Location is required for in-person events.");
    }

    if (formState.capacity) {
      const capacityNum = Number(formState.capacity);
      if (Number.isNaN(capacityNum)) {
        currentErrors.push("Capacity must be a valid number.");
      } else if (capacityNum <= 0) {
        currentErrors.push("Capacity must be a positive number.");
      }
    }
    if (formState.price) {
      const priceNum = Number(formState.price);
      if (Number.isNaN(priceNum)) {
        currentErrors.push("Ticket price must be a valid number.");
      } else if (priceNum < 0) {
        currentErrors.push("Ticket price cannot be negative.");
      }
    }

    if (currentErrors.length > 0) {
      setErrors(currentErrors);
      setStatus("idle");
      return;
    }

    setErrors([]);
    // Simulate a network save so the UI feels responsive.
    await new Promise((resolve) => setTimeout(resolve, SAVE_TIMEOUT));
    setLastSaved({ ...formState });
    setStatus("success");
  };

  const updateField = <K extends keyof EventFormState>(
    key: K,
    value: EventFormState[K],
  ) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
    setStatus("idle");
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
              Share what guests need to know about your upcoming experience.
            </p>
          </div>
          {organizerEmail && (
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
              Signed in as {organizerEmail}
            </span>
          )}
        </div>

        {errors.length > 0 && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-200">
            <p className="font-medium">Please fix the following:</p>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              {errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {status === "success" && (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-200">
            Event draft saved locally. Connect to your backend to persist it.
          </div>
        )}

        <div className="mt-8 grid gap-6">
          <label className="grid gap-2">
            <span className={labelClass}>Event name</span>
            <input
              value={formState.title}
              onChange={(event) => updateField("title", event.target.value)}
              placeholder="Moonlight Rooftop Concert"
              className={inputClass}
            />
          </label>
          <label className="grid gap-2">
            <span className={labelClass}>Event image</span>
            <input
              type="file"
              onChange={(event) =>
                updateField("image", event.target.files?.[0] ?? null)
              }
              accept="image/*"
              placeholder="Image"
              className={inputClass}
            />
          </label>

          <div className="grid gap-6 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className={labelClass}>Start date</span>
              <input
                type="date"
                value={formState.startDate}
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
                value={formState.startTime}
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
                value={formState.endDate}
                onChange={(event) => updateField("endDate", event.target.value)}
                className={inputClass}
              />
            </label>
            <label className="grid gap-2">
              <span className={labelClass}>End time</span>
              <input
                type="time"
                value={formState.endTime}
                onChange={(event) => updateField("endTime", event.target.value)}
                className={inputClass}
              />
            </label>
          </div>

          <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <label className="grid gap-2">
              <span className={labelClass}>Location</span>
              <input
                value={formState.location}
                onChange={(event) =>
                  updateField("location", event.target.value)
                }
                placeholder="123 Main St, Boston, MA"
                className={inputClass}
                disabled={formState.isVirtual}
              />
            </label>
            <label className="flex items-center gap-3 text-sm font-medium text-neutral-700 dark:text-neutral-200">
              <input
                type="checkbox"
                checked={formState.isVirtual}
                onChange={(event) =>
                  updateField("isVirtual", event.target.checked)
                }
                className="h-5 w-5 rounded border-neutral-300 text-amber-400 focus:ring-amber-200"
              />
              Virtual event
            </label>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className={labelClass}>Capacity</span>
              <input
                type="number"
                min={1}
                step={1}
                value={formState.capacity}
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
                value={formState.price}
                onChange={(event) => updateField("price", event.target.value)}
                placeholder="45"
                className={inputClass}
              />
            </label>
          </div>

          <label className="grid gap-2">
            <span className={labelClass}>Category</span>
            <select
              value={formState.category}
              onChange={(event) => updateField("category", event.target.value)}
              className={`${inputClass} appearance-none`}
            >
              <option value="">Select a category</option>
              <option value="music">Music</option>
              <option value="workshop">Workshop</option>
              <option value="conference">Conference</option>
              <option value="social">Social</option>
              <option value="sports">Sports</option>
              <option value="fundraiser">Fundraiser</option>
            </select>
          </label>

          <label className="grid gap-2">
            <span className={labelClass}>Description</span>
            <textarea
              value={formState.description}
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
              {status === "submitting" ? "Saving…" : "Save event draft"}
            </button>
          </div>
        </div>
      </form>

      <section className="flex h-full flex-col justify-between gap-6 rounded-3xl border border-neutral-200/70 bg-white/65 p-6 shadow-lg shadow-purple-500/10 backdrop-blur-md dark:border-white/10 dark:bg-neutral-900/40">
        <div>
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            Live preview
          </h3>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            This is a quick snapshot of what guests will see. Update your copy
            on the left to watch it change.
          </p>
        </div>

        <div className="mt-4 space-y-4">
          {previewDetails.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-neutral-300 px-4 py-6 text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
              Fill out the form to generate a preview summary of your event.
            </p>
          ) : (
            <ul className="space-y-4">
              {previewDetails.map((item) => (
                <li
                  key={item.label}
                  className="rounded-2xl bg-white/70 p-4 text-sm shadow-sm dark:bg-white/5"
                >
                  <p className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                    {item.label}
                  </p>
                  <p className="mt-1 text-neutral-900 dark:text-neutral-100">
                    {item.value}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="mt-auto text-xs text-neutral-500 dark:text-neutral-400">
          Need additional fields like ticket tiers or speaker lists? Extend this
          form and hook it up to your backend API.
        </p>
      </section>
    </div>
  );
}
