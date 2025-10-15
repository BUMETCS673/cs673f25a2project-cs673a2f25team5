import { z } from "zod";

import {
  EventCreatePayloadSchema,
  type EventCreatePayload,
} from "@/services/events";

const UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;

const trimmedString = () => z.string().trim();

const parseDateTime = (date: string, time: string) =>
  new Date(`${date}T${time}`);

export const EventFormSchema = z
  .object({
    eventName: trimmedString().min(1, "Event name is required."),
    startDate: trimmedString().min(1, "Start date is required."),
    startTime: trimmedString().min(1, "Start time is required."),
    endDate: trimmedString().min(1, "End date is required."),
    endTime: trimmedString().min(1, "End time is required."),
    location: trimmedString().min(1, "Location is required."),
    description: trimmedString().optional(),
    pictureUrl: trimmedString().optional(),
    capacity: trimmedString().optional(),
    price: trimmedString().optional(),
  })
  .superRefine((values, ctx) => {
    const start = parseDateTime(values.startDate, values.startTime);
    if (Number.isNaN(start.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["startDate"],
        message: "Start date and time must be valid.",
      });
    }

    const end = parseDateTime(values.endDate, values.endTime);
    if (Number.isNaN(end.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "End date and time must be valid.",
      });
    }

    if (
      !Number.isNaN(start.getTime()) &&
      !Number.isNaN(end.getTime()) &&
      end <= start
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "End date and time must be after the start.",
      });
    }

    if (values.capacity) {
      const capacityNum = Number(values.capacity);
      if (
        !Number.isInteger(capacityNum) ||
        Number.isNaN(capacityNum) ||
        capacityNum <= 0
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["capacity"],
          message: "Capacity must be a positive whole number.",
        });
      }
    }

    if (values.price) {
      const priceNum = Number(values.price);
      const pricePattern = /^\d+(\.\d{1,2})?$/;
      if (
        Number.isNaN(priceNum) ||
        priceNum < 0 ||
        !pricePattern.test(values.price)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["price"],
          message:
            "Ticket price must be a valid amount with up to two decimals.",
        });
      }
    }

    if (values.pictureUrl) {
      try {
        new URL(values.pictureUrl, "http://placeholder.local");
      } catch {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["pictureUrl"],
          message: "Event image must be a valid URL.",
        });
      }
    }
  });

export type EventFormInput = z.input<typeof EventFormSchema>;
export type EventFormData = z.infer<typeof EventFormSchema>;

export const buildEventCreatePayload = (
  values: EventFormData,
  userId: string,
): EventCreatePayload => {
  const start = parseDateTime(values.startDate, values.startTime);
  const end = parseDateTime(values.endDate, values.endTime);
  const payload: EventCreatePayload = {
    event_name: values.eventName,
    event_datetime: start.toISOString(),
    event_endtime: end.toISOString(),
    event_location: values.location,
    description: values.description ? values.description : null,
    picture_url: values.pictureUrl ? values.pictureUrl : null,
    capacity: values.capacity ? Number.parseInt(values.capacity, 10) : null,
    price_field: values.price ? Math.round(Number(values.price) * 100) : null,
    user_id: userId,
    category_id: "123e4567-e89b-12d3-a456-426614174000",
  };

  return EventCreatePayloadSchema.parse(payload);
};
