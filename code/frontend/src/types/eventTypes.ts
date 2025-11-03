/*

 AI-generated code: 100% (tool: Codex - GPT-5, EventSchema, EventResponse, EventListSchema, EventListResponse, EventCreatePayloadSchema, EventCreatePayload) 

 Human code: 0%

 No framework-generated code.

*/

import { z } from "zod";
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

export const EventListSchema = z.object({
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
