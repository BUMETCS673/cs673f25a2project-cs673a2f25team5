import { EventRegisterData } from "@/component/events/event-detail/viewModel";
import type { AttendeeCreatePayload } from "./attendeeTypes";

type AttendeeStatus = AttendeeCreatePayload["status"];

type RegisterAttendeeSuccess = {
  success: true;
  status: AttendeeStatus;
  message: string;
  toast?: "success" | "info";
};

type RegisterAttendeeFailure = {
  success: false;
  code:
    | "unauthenticated"
    | "alreadyRegistered"
    | "host"
    | "eventClosed"
    | "unknown";
  message: string;
  status?: AttendeeStatus | null;
};

type RegisterAttendeeResult = RegisterAttendeeSuccess | RegisterAttendeeFailure;

type EventRegisterCardProps = EventRegisterData & {
  eventId: string;
  onRegister: (
    eventId: string,
    status: AttendeeStatus,
  ) => Promise<RegisterAttendeeResult>;
  initialStatus: AttendeeStatus | null;
  isAuthenticated: boolean;
  isHost: boolean;
  note?: string;
};

type StatusOption = {
  value: AttendeeStatus;
  label: string;
  description: string;
};

const STATUS_OPTIONS: StatusOption[] = [
  {
    value: "RSVPed",
    label: "Going",
    description: "Reserve my spot — I'm planning to attend.",
  },
  {
    value: "Maybe",
    label: "Maybe",
    description: "I'm interested but need to confirm.",
  },
  {
    value: "Not Going",
    label: "Not going",
    description: "I can't make it this time.",
  },
];

const SUCCESS_MESSAGE_BY_STATUS: Record<AttendeeStatus, string> = {
  RSVPed: "You're all set—see you there!",
  Maybe: "We'll keep a seat warm if you can make it.",
  "Not Going": "Thanks for letting us know.",
};

const STATUS_LABEL_MAP: Record<AttendeeStatus, string> = {
  RSVPed: "Going",
  Maybe: "Maybe",
  "Not Going": "Not going",
};

const REGISTRATION_CLOSED_MESSAGE =
  "This event has already ended, so registration updates are closed.";

export {
  STATUS_OPTIONS,
  SUCCESS_MESSAGE_BY_STATUS,
  STATUS_LABEL_MAP,
  REGISTRATION_CLOSED_MESSAGE,
  type EventRegisterCardProps,
  type AttendeeStatus,
  type RegisterAttendeeResult,
};
