import { EventRegisterData } from "@/component/events/event-detail/viewModel";
import type { AttendeeCreatePayload } from "./attendeeTypes";

type AttendeeStatus = AttendeeCreatePayload["status"];

type RegisterResult =
  | {
      success: true;
      status: AttendeeStatus;
      message: string;
    }
  | {
      success: false;
      code: "unauthenticated" | "alreadyRegistered" | "host" | "unknown";
      message: string;
      status?: AttendeeStatus | null;
    };

type EventRegisterCardProps = EventRegisterData & {
  eventId: string;
  onRegister: (
    eventId: string,
    status: AttendeeStatus,
  ) => Promise<RegisterResult>;
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

export type AttendeeStatusType = AttendeeCreatePayload["status"];

export type RegisterAttendeeResult =
  | {
      success: true;
      status: AttendeeStatusType;
      message: string;
    }
  | {
      success: false;
      code: "unauthenticated" | "alreadyRegistered" | "host" | "unknown";
      message: string;
      status?: AttendeeStatusType | null;
    };

export {
  STATUS_OPTIONS,
  SUCCESS_MESSAGE_BY_STATUS,
  STATUS_LABEL_MAP,
  type EventRegisterCardProps,
  type RegisterResult,
  type AttendeeStatus,
};
