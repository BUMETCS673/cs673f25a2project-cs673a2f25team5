/*

 AI-generated code: 0%

 Human code: 100% (tests: InvitationTray rendering and toggle)

 Framework-generated code: 0%

*/

import { render, screen, fireEvent } from "@testing-library/react";
import { InvitationTray } from "@/component/invitations/InvitationTray";
import type { InvitationSummary } from "@/types/invitationTypes";

const baseInvitation: InvitationSummary = {
  attendeeId: "a1",
  eventId: "e1",
  eventName: "Event One",
  eventDateLabel: "Jan 1, 2025",
  eventLocation: "123 Main St",
};

describe("InvitationTray", () => {
  it("shows badge count and toggles open", () => {
    render(<InvitationTray invitations={[baseInvitation]} />);
    expect(screen.getByText("1")).toBeInTheDocument();

    const button = screen.getByRole("button", { name: /invitations/i });
    // Starts open when invitations exist
    expect(screen.getByText(/Event One/)).toBeInTheDocument();

    fireEvent.click(button);
    expect(screen.queryByText(/Event One/)).not.toBeInTheDocument();

    fireEvent.click(button);
    expect(screen.getByText(/Event One/)).toBeInTheDocument();
  });

  it("renders empty state when no invitations", () => {
    render(<InvitationTray invitations={[]} />);
    fireEvent.click(screen.getByRole("button", { name: /invitations/i }));
    expect(screen.getByText(/no pending invitations/i)).toBeInTheDocument();
  });
});
