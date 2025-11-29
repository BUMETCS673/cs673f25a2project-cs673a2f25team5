/*

 AI-generated code: 63% (tool: Codex - GPT-5, modified and adapted, functions: createEmptyFormValues, inputClass, labelClass, CreateEventForm, SubmissionState, createEmptyFormValues, updateField, handleSubmit, mapboxToken) 
  EventFormSchema,
  buildEventCreatePayload,
  type EventFormInput,
  createEvent,
  useUser,
  redirect,
  EventLocationPickerMap,
  getPublicMapboxToken

 Human code: 37% (functions: createEmptyFormValues, inputClass, labelClass, CreateEventForm, SubmissionState, createEmptyFormValues, updateField, handleSubmit, mapboxToken) 

 No framework-generated code.

*/

"use client";

import {
  Fragment,
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  EventFormSchema,
  buildEventCreatePayload,
  type EventFormInput,
} from "./createEventSchema";
import { createEvent } from "@/services/events";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { EventLocationPickerMap } from "./EventLocationPickerMap";
import { EventDateTimePicker, parseDateTimeValue } from "./EventDateTimePicker";
import { getPublicMapboxToken } from "@/component/map/getPublicMapboxToken";
import { encodeEventLocation } from "@/helpers/locationCodec";
import { toast } from "sonner";
import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  Transition,
} from "@headlessui/react";
import { FiChevronDown } from "react-icons/fi";
import { CategoryResponse } from "@/types/categoryTypes";
import { getCategories } from "@/services/categories";

type SubmissionState = "idle" | "submitting" | "success";
type Coordinates = { longitude: number; latitude: number };
type LocationSelectionPayload = {
  placeName: string | null;
  coordinates: Coordinates | null;
};

const DEFAULT_CATEGORY_DESCRIPTION = "More details about this category soon.";
const CATEGORY_FIELD_LABEL_ID = "event-category-label";

const createEmptyFormValues = (): EventFormInput => ({
  eventName: "",
  startDate: "",
  startTime: "",
  category: "",
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
  const router = useRouter();
  const [formValues, setFormValues] = useState<EventFormInput>(
    createEmptyFormValues,
  );
  const [selectedCoordinates, setSelectedCoordinates] =
    useState<Coordinates | null>(null);
  const [status, setStatus] = useState<SubmissionState>("idle");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const { user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress;
  const userId = user?.externalId;

  const [categoryOptions, setCategoryOptions] = useState<CategoryResponse[]>(
    [],
  );

  useEffect(() => {
    let isMounted = true;

    const fetchCategories = async () => {
      try {
        const categories = await getCategories();
        if (!isMounted) {
          return;
        }
        setCategoryOptions(categories.items);
      } catch (error) {
        console.error("Failed to load categories", error);
        toast.error("We could not load categories. Please try again.");
      }
    };

    fetchCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  const mapboxToken = useMemo(() => getPublicMapboxToken(), []);
  const selectedCategory = useMemo(
    () =>
      categoryOptions.find(
        (category) => category.category_id === formValues.category,
      ) ?? null,
    [categoryOptions, formValues.category],
  );

  const patchFormValues = useCallback((updates: Partial<EventFormInput>) => {
    setFormValues((prev) => ({ ...prev, ...updates }));
    setValidationErrors([]);
    setStatus((prev) => (prev === "success" ? "idle" : prev));
  }, []);

  const updateField = useCallback(
    (
      field: keyof EventFormInput,
      value: string,
      options?: { preserveCoordinates?: boolean },
    ) => {
      patchFormValues({ [field]: value } as Partial<EventFormInput>);
      if (field === "location" && !options?.preserveCoordinates) {
        setSelectedCoordinates(null);
      }
    },
    [patchFormValues, setSelectedCoordinates],
  );

  const handleCategorySelect = useCallback(
    (category: CategoryResponse) => {
      updateField("category", category.category_id);
    },
    [updateField],
  );

  const handleLocationSelect = useCallback(
    ({ placeName, coordinates }: LocationSelectionPayload) => {
      if (placeName) {
        updateField("location", placeName, { preserveCoordinates: true });
      }
      setSelectedCoordinates(coordinates);
    },
    [setSelectedCoordinates, updateField],
  );

  const startDateSelection = useMemo(
    () => parseDateTimeValue(formValues.startDate, formValues.startTime),
    [formValues.startDate, formValues.startTime],
  );

  const handleStartDateTimeChange = useCallback(
    (date: string, time: string) => {
      patchFormValues({ startDate: date, startTime: time });
    },
    [patchFormValues],
  );

  const handleEndDateTimeChange = useCallback(
    (date: string, time: string) => {
      patchFormValues({ endDate: date, endTime: time });
    },
    [patchFormValues],
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const loadingToastId = toast.loading("Creating event...");
    if (!userId) {
      setValidationErrors(["You must be logged in to create an event"]);
      setStatus("idle");
      toast.dismiss(loadingToastId);
      toast.error("You must be logged in to create an event");
      return;
    }
    setStatus("submitting");
    setValidationErrors([]);

    const result = EventFormSchema.safeParse(formValues);
    if (!result.success) {
      const issues = result.error.issues.map((issue) => issue.message);
      setValidationErrors(Array.from(new Set(issues)));
      setStatus("idle");
      toast.dismiss(loadingToastId);
      toast.error("Please fix the validation errors");
      return;
    }

    try {
      const locationValue =
        selectedCoordinates && formValues.location
          ? encodeEventLocation({
              address: formValues.location,
              longitude: selectedCoordinates.longitude,
              latitude: selectedCoordinates.latitude,
            })
          : result.data.location;

      const valuesForPayload = {
        ...result.data,
        location: locationValue,
      };
      await createEvent(buildEventCreatePayload(valuesForPayload, userId));
      toast.dismiss(loadingToastId);
      toast.success("Event created successfully");
      setStatus("success");
      setFormValues(createEmptyFormValues());
      setSelectedCoordinates(null);
      router.push(`/events`);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "We could not save the event. Please try again.";
      toast.dismiss(loadingToastId);
      toast.error(message);
      setStatus("idle");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-10 rounded-3xl border border-neutral-200/70 bg-white/85 p-8 shadow-xl shadow-amber-500/10 backdrop-blur-md dark:border-white/10 dark:bg-neutral-900/60"
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
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-200">
          <p className="font-medium">Please fix the following:</p>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            {validationErrors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="space-y-8">
        <div className="space-y-6">
          <label className="grid gap-2">
            <span className={labelClass}>Event name</span>
            <input
              value={formValues.eventName}
              onChange={(event) => updateField("eventName", event.target.value)}
              placeholder="Moonlight Rooftop Concert"
              className={inputClass}
            />
          </label>

          <span id={CATEGORY_FIELD_LABEL_ID} className={labelClass}>
            Event category
          </span>
          <Menu as="div" className="relative w-full">
            <MenuButton
              className={`${inputClass} flex w-full items-center justify-between gap-4 text-left`}
              aria-labelledby={CATEGORY_FIELD_LABEL_ID}
            >
              <span className="flex flex-col">
                <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  {selectedCategory?.category_name ?? "Select a category"}
                </span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                  {selectedCategory
                    ? (selectedCategory.description ??
                      DEFAULT_CATEGORY_DESCRIPTION)
                    : "Select a category for your event"}
                </span>
              </span>
              <span className="rounded-2xl bg-neutral-100 p-2 text-neutral-600 ring-1 ring-black/5 dark:bg-white/10 dark:text-neutral-200">
                <FiChevronDown className="h-4 w-4" />
              </span>
            </MenuButton>
            <Transition
              as={Fragment}
              enter="transition duration-150 ease-out"
              enterFrom="translate-y-1 scale-95 opacity-0"
              enterTo="translate-y-0 scale-100 opacity-100"
              leave="transition duration-100 ease-in"
              leaveFrom="translate-y-0 scale-100 opacity-100"
              leaveTo="translate-y-1 scale-95 opacity-0"
            >
              <MenuItems className="absolute left-0 right-0 z-30 mt-3 origin-top rounded-3xl border border-neutral-200/80 bg-white/95 p-2 shadow-2xl shadow-amber-500/10 ring-1 ring-black/5 backdrop-blur dark:border-white/10 dark:bg-neutral-900/95">
                <div className="space-y-1">
                  {categoryOptions.map(
                    ({ category_id, category_name, description }) => (
                      <MenuItem
                        key={category_id}
                        as="button"
                        onClick={() =>
                          handleCategorySelect({
                            category_id,
                            category_name,
                            description,
                          })
                        }
                        className="group flex w-full items-center gap-4 rounded-2xl px-4 py-3 text-left text-sm text-neutral-800 transition hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 dark:text-neutral-100 dark:hover:bg-white/10"
                      >
                        <span className="flex flex-col text-left">
                          <span className="font-semibold">{category_name}</span>
                          <span className="text-xs text-neutral-500 dark:text-neutral-400">
                            {description ?? DEFAULT_CATEGORY_DESCRIPTION}
                          </span>
                        </span>
                      </MenuItem>
                    ),
                  )}
                </div>
              </MenuItems>
            </Transition>
          </Menu>

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
            <EventDateTimePicker
              id="event-start"
              label="Start date & time"
              dateValue={formValues.startDate}
              timeValue={formValues.startTime}
              onChange={handleStartDateTimeChange}
            />
            <EventDateTimePicker
              id="event-end"
              label="End date & time"
              dateValue={formValues.endDate}
              timeValue={formValues.endTime}
              onChange={handleEndDateTimeChange}
              minDate={startDateSelection}
            />
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

          <div className="space-y-4">
            <EventLocationPickerMap
              mapboxToken={mapboxToken}
              coordinates={selectedCoordinates}
              onLocationSelect={handleLocationSelect}
            />
            <div className="rounded-3xl border border-neutral-200/70 bg-white/85 p-6 shadow-lg shadow-amber-500/10 backdrop-blur dark:border-white/10 dark:bg-neutral-900/60">
              <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-neutral-500 dark:text-neutral-400">
                Saved address
              </h3>
              <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-200">
                {formValues.location
                  ? formValues.location
                  : "Use the search above or the map to pin your event venue."}
              </p>
              {selectedCoordinates ? (
                <p className="mt-3 text-xs text-neutral-500 dark:text-neutral-400">
                  Coordinates: {selectedCoordinates.latitude.toFixed(4)},{" "}
                  {selectedCoordinates.longitude.toFixed(4)}
                </p>
              ) : null}
            </div>
          </div>

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
        </div>

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
  );
}
