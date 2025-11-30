/*

 AI-generated code: 77% (tool: Codex - GPT-5, modified and adapted, functions: EventPage) 

 Human code: 23% (functions: EventPage, setting up filters to get the event and passing params to the getEvents function) 

 No framework-generated code.

*/

export const dynamic = "force-dynamic";

import { currentUser } from "@clerk/nextjs/server";

import { buildEventViewModel } from "@/component/events/event-detail/viewModel";
import { EventPageLayout } from "./event-page-layout";
import {
  fetchEventDetailData,
  fetchInitialAttendeeStatus,
} from "./event-page-data";
import { renderE2EEventPage } from "./e2e-fallback";
import {
  createInviteAction,
  createResolveInviteeAction,
} from "@/services/invite-action";
import {
  HOST_REGISTRATION_MESSAGE,
  createRegisterAction,
} from "../../../services/register-action";
import { SUCCESS_MESSAGE_BY_STATUS } from "@/types/registerTypes";

export default async function EventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (process.env.NEXT_PUBLIC_E2E === "1") {
    return renderE2EEventPage(id);
  }

  const viewer = await currentUser();
  const attendeeExternalId = viewer?.externalId ?? null;

  const { attendeeCount, event, host, hostEvents } =
    await fetchEventDetailData(id);

  const isHostUser = attendeeExternalId === event.user_id;

  const initialStatus = await fetchInitialAttendeeStatus({
    attendeeExternalId,
    eventId: event.event_id,
    isHostUser,
  });

  const viewModel = buildEventViewModel({
    event,
    host,
    hostEvents,
    attendeeCount,
  });

  const onRegister = createRegisterAction({
    hostMessage: HOST_REGISTRATION_MESSAGE,
    hostUserId: event.user_id,
    successMessages: SUCCESS_MESSAGE_BY_STATUS,
  });
  const onInvite = isHostUser
    ? await createInviteAction({
        eventId: event.event_id,
        hostUserId: event.user_id,
      })
    : null;
  const onResolveInvitee = isHostUser
    ? await createResolveInviteeAction({
        hostUserId: event.user_id,
      })
    : null;

  return (
    <EventPageLayout
      eventId={event.event_id}
      eventName={viewModel.header.title}
      eventLocation={event.event_location ?? null}
      initialStatus={initialStatus}
      isAuthenticated={Boolean(attendeeExternalId)}
      isHost={isHostUser}
      inviteAction={onInvite}
      resolveInvitee={onResolveInvitee}
      onRegister={onRegister}
      viewModel={viewModel}
    />
  );
}
