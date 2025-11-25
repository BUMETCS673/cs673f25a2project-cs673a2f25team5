/*

 AI-generated code: 100% (tool: Codex - GPT-5, modified and adapted, functions: EventStatusTone, EventHeaderData, EventHeroMediaData, EventMetadataItem, EventAboutData, EventRegisterData, HostProfileTheme, HostCardData, RelatedEventItem, EventViewModel, BuildViewModelOptions, parseDate, formatLongDate, formatShortDateTime, formatShortDate, formatMetaLine, formatPrice, formatCapacity, getInitials, getDescriptionParagraphs, parseHexColor, mixRgb, rgbToCss, rgbaToCss, getRelativeLuminance, createHostProfileTheme, findEvent, longDateTimeFormatter, shortDateTimeFormatter, shortDateFormatter) 

 Human code: 0% 
 
 No framework-generated code.

*/

import type { CSSProperties } from "react";

import type { EventResponse } from "@/types/eventTypes";
import type { UserResponse } from "@/types/userTypes";
import { decodeEventLocation } from "@/helpers/locationCodec";

export type EventStatusTone = "past" | "live" | "upcoming";

export type EventHeaderData = {
  title: string;
  statusLabel: string;
  statusTone: EventStatusTone;
  startBadgeLabel: string | null;
  metaSummary: string | null;
};

export type EventHeroMediaData = {
  pictureUrl: string | null | undefined;
  eventName: string;
  shouldPrioritize: boolean;
};

export type EventMetadataItem = {
  id: string;
  icon:
    | "calendar"
    | "calendarEnd"
    | "location"
    | "ticket"
    | "people"
    | "refresh";
  label: string;
  value: string;
};

export type EventAboutData = {
  paragraphs: string[];
  metadataItems: EventMetadataItem[];
};

export type EventRegisterData = {
  ctaLabel: string;
  attendeeCount: number | null;
  capacity: number | null;
  eventStartTime: string | null;
  eventEndTime: string | null;
};

export type HostProfileTheme = {
  containerStyle: CSSProperties;
  avatarStyle: CSSProperties;
  primaryTextStyle: CSSProperties;
  secondaryTextStyle: CSSProperties;
};

export type HostCardData = {
  hasHost: boolean;
  hostName: string | null;
  hostEmail: string | null;
  hostInitials: string;
  theme: HostProfileTheme | null;
  emptyStateMessage: string;
};

export type RelatedEventItem = {
  id: string;
  name: string;
  href: string;
  dateLabel: string | null;
};

export type EventViewModel = {
  header: EventHeaderData;
  heroMedia: EventHeroMediaData;
  about: EventAboutData;
  register: EventRegisterData;
  hostCard: HostCardData;
  relatedEvents: RelatedEventItem[];
};

type BuildViewModelOptions = {
  event: EventResponse;
  host: UserResponse | null;
  hostEvents: EventResponse[];
  currentTimestamp?: number;
  attendeeCount?: number | null;
};

export function buildEventViewModel({
  event,
  host,
  hostEvents,
  currentTimestamp = Date.now(),
  attendeeCount,
}: BuildViewModelOptions): EventViewModel {
  const parsedStart = parseDate(event.event_datetime);
  const parsedEnd = parseDate(event.event_endtime);
  const now = currentTimestamp;
  const startTime = parsedStart?.getTime();
  const endTime = parsedEnd?.getTime();

  const hasStarted = typeof startTime === "number" && startTime <= now;
  const hasEnded =
    typeof endTime === "number"
      ? endTime < now
      : typeof startTime === "number"
        ? startTime < now
        : false;

  const statusTone: EventStatusTone = hasEnded
    ? "past"
    : hasStarted
      ? "live"
      : "upcoming";
  const statusLabel =
    statusTone === "past"
      ? "Past event"
      : statusTone === "live"
        ? "Happening now"
        : "Upcoming event";

  const startLabel = formatLongDate(event.event_datetime);
  const endLabel = formatLongDate(event.event_endtime);
  const shortStartLabel = formatShortDateTime(event.event_datetime);
  const decodedLocation = decodeEventLocation(event.event_location);
  const locationLabel = decodedLocation?.address ?? "Location to be announced";
  const priceLabel = formatPrice(event.price_field);
  const capacityLabel = formatCapacity(event.capacity);

  const headerMeta = formatMetaLine([
    startLabel,
    locationLabel,
    priceLabel !== "Free" ? priceLabel : null,
  ]);

  const descriptionParagraphs = getDescriptionParagraphs(event.description);
  const metadataItems: EventMetadataItem[] = [
    {
      id: "starts",
      icon: "calendar",
      label: "Starts",
      value: startLabel ?? "Date to be announced",
    },
    {
      id: "ends",
      icon: "calendarEnd",
      label: "Ends",
      value: endLabel ?? "Date to be announced",
    },
    {
      id: "location",
      icon: "location",
      label: "Location",
      value: locationLabel,
    },
    {
      id: "price",
      icon: "ticket",
      label: "Ticket price",
      value: priceLabel,
    },
    {
      id: "capacity",
      icon: "people",
      label: "Capacity",
      value: capacityLabel,
    },
    {
      id: "updated",
      icon: "refresh",
      label: "Last updated",
      value:
        formatShortDate(event.updated_at) ??
        formatShortDate(event.created_at) ??
        "Recently added",
    },
  ];

  const normalizedAttendeeCount =
    typeof attendeeCount === "number" && attendeeCount >= 0
      ? attendeeCount
      : null;
  const normalizedCapacity =
    typeof event.capacity === "number" && event.capacity > 0
      ? event.capacity
      : null;

  const registerData: EventRegisterData = {
    ctaLabel:
      priceLabel === "Free" ? "Register for free" : `Register • ${priceLabel}`,
    attendeeCount: normalizedAttendeeCount,
    capacity: normalizedCapacity,
    eventStartTime: event.event_datetime ?? null,
    eventEndTime: event.event_endtime ?? null,
  };

  const hostFullName = host
    ? `${host.first_name} ${host.last_name}`.trim()
    : null;
  const hostInitials = getInitials(hostFullName);
  const hostTheme = createHostProfileTheme(host?.color);

  const hostCard: HostCardData = {
    hasHost: Boolean(host),
    hostName: hostFullName,
    hostEmail: host?.email ?? null,
    hostInitials,
    theme: hostTheme,
    emptyStateMessage: "Host details are being finalized.",
  };

  const relatedEvents = hostEvents
    .filter((item) => item.event_id !== event.event_id)
    .map((item) => ({
      id: item.event_id,
      name: item.event_name,
      href: `/events/${item.event_id}`,
      dateLabel: formatShortDateTime(item.event_datetime),
    }))
    .sort((a, b) => {
      const aTime =
        parseDate(findEvent(hostEvents, a.id)?.event_datetime)?.getTime() ??
        Number.POSITIVE_INFINITY;
      const bTime =
        parseDate(findEvent(hostEvents, b.id)?.event_datetime)?.getTime() ??
        Number.POSITIVE_INFINITY;
      return aTime - bTime;
    })
    .slice(0, 3);

  return {
    header: {
      title: event.event_name,
      statusLabel,
      statusTone,
      startBadgeLabel: shortStartLabel,
      metaSummary: headerMeta || "Details coming soon",
    },
    heroMedia: {
      pictureUrl: event.picture_url,
      eventName: event.event_name,
      shouldPrioritize: !hasEnded,
    },
    about: {
      paragraphs: descriptionParagraphs,
      metadataItems,
    },
    register: registerData,
    hostCard,
    relatedEvents,
  };
}

function parseDate(value: string | null | undefined) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}

function formatLongDate(value: string | null | undefined) {
  const date = parseDate(value);
  return date ? longDateTimeFormatter.format(date) : null;
}

function formatShortDateTime(value: string | null | undefined) {
  const date = parseDate(value);
  return date ? shortDateTimeFormatter.format(date) : null;
}

function formatShortDate(value: string | null | undefined) {
  const date = parseDate(value);
  return date ? shortDateFormatter.format(date) : null;
}

function formatMetaLine(values: Array<string | null | undefined>) {
  return values.filter(Boolean).join(" • ");
}

function formatPrice(value: number | null | undefined) {
  if (typeof value !== "number" || value <= 0) {
    return "Free";
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value / 100);
}

function formatCapacity(value: number | null | undefined) {
  if (typeof value !== "number" || value <= 0) {
    return "Open capacity";
  }
  return `${value.toLocaleString()} guest${value === 1 ? "" : "s"}`;
}

function getInitials(fullName: string | null) {
  if (!fullName) {
    return "?";
  }
  const letters = fullName
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
  return letters.slice(0, 2) || "?";
}

function getDescriptionParagraphs(text: string | null | undefined) {
  if (!text || !text.trim()) {
    return [
      "The host is still polishing the details. Check back soon for updates about this experience.",
    ];
  }

  return text
    .trim()
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim().replace(/\s+/g, " "));
}

type RGB = {
  r: number;
  g: number;
  b: number;
};

const WHITE: RGB = { r: 255, g: 255, b: 255 };
const BLACK: RGB = { r: 0, g: 0, b: 0 };

function parseHexColor(value: string): RGB | null {
  const hex = value.startsWith("#") ? value.slice(1) : value;
  const normalized =
    hex.length === 3
      ? hex
          .split("")
          .map((char) => char + char)
          .join("")
      : hex;

  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return null;
  }

  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);

  return { r, g, b };
}

function mixRgb(color: RGB, target: RGB, amount: number): RGB {
  const weight = Math.min(Math.max(amount, 0), 1);
  return {
    r: Math.round(color.r * (1 - weight) + target.r * weight),
    g: Math.round(color.g * (1 - weight) + target.g * weight),
    b: Math.round(color.b * (1 - weight) + target.b * weight),
  };
}

function rgbToCss(color: RGB) {
  return `rgb(${color.r}, ${color.g}, ${color.b})`;
}

function rgbaToCss(color: RGB, alpha: number) {
  const safeAlpha = Math.min(Math.max(alpha, 0), 1);
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${safeAlpha})`;
}

function getRelativeLuminance(color: RGB) {
  const normalize = (value: number) => {
    const channel = value / 255;
    return channel <= 0.03928
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  };

  const r = normalize(color.r);
  const g = normalize(color.g);
  const b = normalize(color.b);

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function createHostProfileTheme(
  color: string | null | undefined,
): HostProfileTheme | null {
  if (!color) {
    return null;
  }

  const trimmed = color.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = parseHexColor(trimmed);
  if (!parsed) {
    const fallbackShadow = "rgba(15, 23, 42, 0.25)";
    const fallbackText = "#ffffff";
    return {
      containerStyle: {
        backgroundColor: trimmed,
        color: fallbackText,
        borderColor: "transparent",
        boxShadow: `0 18px 40px -20px ${fallbackShadow}`,
      },
      avatarStyle: {
        backgroundColor: "rgba(255, 255, 255, 0.25)",
        color: fallbackText,
      },
      primaryTextStyle: { color: fallbackText },
      secondaryTextStyle: { color: "rgba(255, 255, 255, 0.8)" },
    };
  }

  const lightBackground = mixRgb(parsed, WHITE, 0.45);
  const borderColor = mixRgb(parsed, WHITE, 0.65);
  const avatarBackground = mixRgb(parsed, WHITE, 0.25);
  const shadowRgb = mixRgb(parsed, BLACK, 0.8);
  const backgroundLuminance = getRelativeLuminance(lightBackground);
  const avatarLuminance = getRelativeLuminance(avatarBackground);
  const primaryTextColor = backgroundLuminance > 0.6 ? "#111827" : "#ffffff";
  const secondaryTextColor =
    backgroundLuminance > 0.6
      ? "rgba(17, 24, 39, 0.72)"
      : "rgba(255, 255, 255, 0.8)";
  const avatarTextColor = avatarLuminance > 0.6 ? "#111827" : "#ffffff";

  return {
    containerStyle: {
      backgroundColor: rgbToCss(lightBackground),
      borderColor: rgbToCss(borderColor),
      color: primaryTextColor,
      boxShadow: `0 18px 40px -20px ${rgbaToCss(shadowRgb, 0.35)}`,
    },
    avatarStyle: {
      backgroundColor: rgbToCss(avatarBackground),
      color: avatarTextColor,
    },
    primaryTextStyle: { color: primaryTextColor },
    secondaryTextStyle: { color: secondaryTextColor },
  };
}

function findEvent(events: EventResponse[], id: string) {
  return events.find((item) => item.event_id === id);
}

const longDateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const shortDateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

const shortDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});
