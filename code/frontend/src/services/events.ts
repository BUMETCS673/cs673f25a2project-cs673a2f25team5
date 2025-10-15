import { z } from "zod";

const BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") ??
  "http://localhost:8000";

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

  console.log("body: ", body);
  console.log("BASE_URL: ", BASE_URL);

  const response = await fetch(`${BASE_URL}/events`, {
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
