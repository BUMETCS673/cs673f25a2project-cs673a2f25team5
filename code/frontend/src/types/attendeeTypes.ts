/*

 AI-generated code: 0%

 Human code: 100% (AttendeeSchema, AttendeeResponse, AttendeeListSchema, AttendeeListResponse, AttendeeCreatePayloadSchema, AttendeeCreatePayload, GetAttendeesParams) 

 No framework-generated code.

*/

import { z } from "zod";

export const AttendeeSchema = z.object({
  attendee_id: z.uuid(),
  event_id: z.uuid(),
  user_id: z.uuid(),
  status: z.enum(["RSVPed", "Maybe", "Not Going"]),
  created_at: z.string(),
  updated_at: z.string(),
});

export type AttendeeResponse = z.infer<typeof AttendeeSchema>;

export const AttendeeListSchema = z.object({
  items: z.array(AttendeeSchema),
  total: z.number().int().nonnegative(),
  offset: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
});
export type AttendeeListResponse = z.infer<typeof AttendeeListSchema>;

export const AttendeeCreatePayloadSchema = z.object({
  event_id: z.uuid(),
  user_id: z.uuid(),
  status: z.enum(["RSVPed", "Maybe", "Not Going"]),
});
export type AttendeeCreatePayload = z.infer<typeof AttendeeCreatePayloadSchema>;

export type GetAttendeesParams = {
  filters?: string[];
  offset?: number;
  limit?: number;
  signal?: AbortSignal;
};
