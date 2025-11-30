/*

 AI-generated code: 0% 

 Human code: 100% (functions: renderE2EEventPage) 

 framework-generated code: 0%

*/

import { EventPageLayout } from "./event-page-layout";

import { buildEventViewModel } from "@/component/events/event-detail/viewModel";
import type { RegisterAttendeeResult } from "@/types/registerTypes";

export async function renderE2EEventPage(eventId: string) {
  const event = {
    event_id: eventId,
    event_name: "E2E Event",
    event_datetime: "2025-10-01T10:00:00Z",
    event_endtime: "2025-10-01T12:00:00Z",
    event_location: "Addis Ababa",
    description: "Stubbed description",
    picture_url: null,
    capacity: 10,
    price_field: 0,
    user_id: "00000000-0000-0000-0000-000000000000",
    category_id: "00000000-0000-0000-0000-000000000000",
    created_at: "2025-09-01T00:00:00Z",
    updated_at: "2025-09-01T00:00:00Z",
  };

  const viewModel = buildEventViewModel({
    event,
    host: null,
    hostEvents: [],
  });

  const disabledRegister = async (): Promise<RegisterAttendeeResult> => ({
    success: false,
    code: "unknown",
    message: "Registration is disabled in E2E mode.",
  });

  return (
    <EventPageLayout
      eventId={event.event_id}
      eventName={event.event_name}
      eventLocation={event.event_location}
      initialStatus={null}
      isAuthenticated={false}
      isHost={false}
      inviteAction={null}
      resolveInvitee={null}
      onRegister={disabledRegister}
      viewModel={viewModel}
    />
  );
}
