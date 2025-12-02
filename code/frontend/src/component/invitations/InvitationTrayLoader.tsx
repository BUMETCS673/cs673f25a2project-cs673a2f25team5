/*

 AI-generated code: 0%

 Human code: 100% (InvitationTrayLoader)

 No framework-generated code.

*/

import { currentUser } from "@clerk/nextjs/server";
import { InvitationTray } from "./InvitationTray";
import { fetchPendingInvitations } from "@/services/invitations";

export async function InvitationTrayLoader() {
  const viewer = await currentUser();
  const viewerExternalId = viewer?.externalId ?? null;

  if (!viewerExternalId) {
    return null;
  }

  const invitations = await fetchPendingInvitations(viewerExternalId);

  return <InvitationTray invitations={invitations} />;
}
