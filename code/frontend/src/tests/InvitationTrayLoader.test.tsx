/*

 AI-generated code: 0%

 Human code: 100% (tests: InvitationTrayLoader renders based on auth and invitations)

 Framework-generated code: 0%

*/

import { InvitationTrayLoader } from "@/component/invitations/InvitationTrayLoader";
import { fetchPendingInvitations } from "@/services/invitations";
import { currentUser } from "@clerk/nextjs/server";
import { render } from "@testing-library/react";

jest.mock("@clerk/nextjs/server", () => ({
  currentUser: jest.fn(),
}));

jest.mock("@/services/invitations", () => ({
  fetchPendingInvitations: jest.fn(),
}));

const mockCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;
const mockFetchInvitations = fetchPendingInvitations as jest.MockedFunction<
  typeof fetchPendingInvitations
>;

describe("InvitationTrayLoader", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("returns null when not signed in", async () => {
    mockCurrentUser.mockResolvedValueOnce(null as never);
    const result = await InvitationTrayLoader();
    expect(result).toBeNull();
  });

  it("renders tray when invitations exist", async () => {
    mockCurrentUser.mockResolvedValueOnce({
      externalId: "user-1",
    } as never);
    mockFetchInvitations.mockResolvedValueOnce([
      {
        attendeeId: "a1",
        eventId: "e1",
        eventName: "Event One",
        eventDateLabel: "Jan 1",
        eventLocation: "123",
      },
    ]);

    const element = await InvitationTrayLoader();
    expect(element).not.toBeNull();
    const { getByText } = render(element!);
    expect(getByText(/Event One/)).toBeInTheDocument();
  });
});
