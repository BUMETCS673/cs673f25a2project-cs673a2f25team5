/*

 AI-generated code: 0%

 Human code: 100% (createAttendee, getAttendees) 

 No framework-generated code.

*/

"use server";

import { API_BASE_URL } from "./config";
import { auth } from "@clerk/nextjs/server";
import {
  AttendeeCreatePayloadSchema,
  AttendeeCreatePayload,
  AttendeeResponse,
  AttendeeSchema,
  AttendeeListSchema,
  AttendeeListResponse,
  GetAttendeesParams,
  AttendeeStatus,
} from "../types/attendeeTypes";

type AttendeePatchOperation = {
  op: "replace";
  path: "/status";
  value: AttendeeStatus;
};

export type AttendeePatchRequest = Record<string, AttendeePatchOperation>;

export async function createAttendee(
  payload: AttendeeCreatePayload,
): Promise<AttendeeResponse> {
  const body = AttendeeCreatePayloadSchema.parse(payload);

  const { getToken } = await auth();
  const token = await getToken();

  const response = await fetch(`${API_BASE_URL}/attendees`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  const data = await response.json();
  return AttendeeSchema.parse(data);
}

export async function patchAttendees(
  patch: AttendeePatchRequest,
): Promise<Record<string, AttendeeResponse>> {
  const { getToken } = await auth();
  const token = await getToken();

  const response = await fetch(`${API_BASE_URL}/attendees`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ patch }),
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  const data = (await response.json()) as Record<string, unknown>;
  const parsed: Record<string, AttendeeResponse> = {};

  for (const [attendeeId, attendee] of Object.entries(data)) {
    parsed[attendeeId] = AttendeeSchema.parse(attendee);
  }

  return parsed;
}

export async function getAttendees(
  params?: GetAttendeesParams,
): Promise<AttendeeListResponse> {
  const { filters, offset, limit, signal } = params ?? {};
  const url = new URL("/attendees", API_BASE_URL);

  for (const filter of filters ?? []) {
    url.searchParams.append("filter_expression", filter);
  }

  if (typeof offset === "number") {
    url.searchParams.set("offset", offset.toString());
  }

  if (typeof limit === "number") {
    url.searchParams.set("limit", limit.toString());
  }

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
  return AttendeeListSchema.parse(data);
}
