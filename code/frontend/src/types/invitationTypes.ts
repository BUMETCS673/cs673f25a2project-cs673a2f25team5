/*

 AI-generated code: 0%

 Human code: 100% (types: InviteActionResult, InviteActionHandler, InviteeLookupResult, InviteeLookupHandler, InvitationSummary, InviteActionSuccess, InviteActionFailure, InviteeLookupSuccess, InviteeLookupFailure)

 Framework-generated code: 0%

*/

import type { UserResponse } from "./userTypes";

export type InviteActionSuccess = {
  success: true;
  invitedUser: Pick<
    UserResponse,
    "user_id" | "email" | "first_name" | "last_name"
  >;
  message: string;
};

export type InviteActionFailure = {
  success: false;
  code:
    | "unauthenticated"
    | "forbidden"
    | "validation"
    | "self"
    | "notFound"
    | "duplicate"
    | "unknown";
  message: string;
};

export type InviteActionResult = InviteActionSuccess | InviteActionFailure;

export type InviteActionHandler = (
  identifier: string,
  userId?: string,
) => Promise<InviteActionResult>;

export type InviteeLookupSuccess = {
  success: true;
  users: Array<
    Pick<UserResponse, "user_id" | "email" | "first_name" | "last_name">
  >;
};

export type InviteeLookupFailure = {
  success: false;
  code: "unauthenticated" | "forbidden" | "validation" | "notFound" | "unknown";
  message: string;
};

export type InviteeLookupResult = InviteeLookupSuccess | InviteeLookupFailure;

export type InviteeLookupHandler = (
  identifier: string,
) => Promise<InviteeLookupResult>;

export type InvitationSummary = {
  attendeeId: string;
  eventId: string;
  eventName: string;
  eventDateLabel: string | null;
  eventLocation: string | null;
};
