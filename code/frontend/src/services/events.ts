/*

 AI-generated code: 100% (tool: Codex - GPT-5, EventSchema, EventResponse, EventListSchema, EventListResponse, EventCreatePayloadSchema, EventCreatePayload, createEvent, getEvents) 
 
 Human code: 0%

 No framework-generated code.

*/

"use server";

import { API_BASE_URL } from "./config";
import { auth } from "@clerk/nextjs/server";
import {
  EventCreatePayload,
  EventCreatePayloadSchema,
  EventResponse,
  EventListResponse,
  EventSchema,
  EventListSchema,
} from "../types/eventTypes";

export async function createEvent(
  payload: EventCreatePayload,
): Promise<EventResponse> {
  const body = EventCreatePayloadSchema.parse(payload);

  const { getToken } = await auth();
  const token = await getToken();

  const response = await fetch(`${API_BASE_URL}/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
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

  const { getToken } = await auth();

  const token = await getToken();

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    signal,
  });
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  const data = await response.json();
  return EventListSchema.parse(data);
}
