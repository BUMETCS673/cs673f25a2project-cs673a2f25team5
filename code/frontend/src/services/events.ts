import { z } from "zod";

import { API_BASE_URL } from "./config";

export const EventSchema = z.object({
  event_id: z.string().uuid(),
  event_name: z.string(),
  event_datetime: z.string(),
  event_endtime: z.string(),
  event_location: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  picture_url: z.string().nullable().optional(),
  capacity: z.number().nullable().optional(),
  price_field: z.number().nullable().optional(),
  user_id: z.string().uuid(),
  category_id: z.string().uuid(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type EventResponse = z.infer<typeof EventSchema>;

const EventListSchema = z.object({
  items: z.array(EventSchema),
  total: z.number().int().nonnegative(),
  offset: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
});

export type EventListResponse = z.infer<typeof EventListSchema>;

export const EventCreatePayloadSchema = z.object({
  event_name: z.string().min(1),
  event_datetime: z.string().min(1),
  event_endtime: z.string().min(1),
  event_location: z.string().min(1),
  description: z.string().nullable().optional(),
  picture_url: z.string().nullable().optional(),
  capacity: z.number().int().positive().nullable().optional(),
  price_field: z.number().int().nonnegative().nullable().optional(),
  user_id: z.string().uuid(),
  category_id: z.string().uuid(),
});

export type EventCreatePayload = z.infer<typeof EventCreatePayloadSchema>;

export async function createEvent(
  payload: EventCreatePayload,
): Promise<EventResponse> {
  const body = EventCreatePayloadSchema.parse(payload);

  const response = await fetch(`${API_BASE_URL}/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const data = (await response.json()) as {
        detail?: string;
        message?: string;
        error?: string;
      };
      message = data.detail ?? data.message ?? data.error ?? message;
    } catch {
      // Ignore JSON parse errors and fall back to the default message.
    }
    throw new Error(message);
  }

  const data = await response.json();
  return EventSchema.parse(data);
}

type GetEventsParams = {
  filters?: string[];
  offset?: number;
  limit?: number;
  signal?: AbortSignal;
};

export async function getEvents(
  params?: GetEventsParams,
): Promise<EventListResponse> {
  const { filters, offset, limit, signal } = params ?? {};
  const url = new URL("/events", API_BASE_URL);

  for (const filter of filters ?? []) {
    url.searchParams.append("filter_expression", filter);
  }

  if (typeof offset === "number") {
    url.searchParams.set("offset", offset.toString());
  }

  if (typeof limit === "number") {
    url.searchParams.set("limit", limit.toString());
  }

  console.log("filters: ", filters);
  console.log("url: ", url.toString());

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    signal,
  });
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  const data = await response.json();
  return EventListSchema.parse(data);
}
