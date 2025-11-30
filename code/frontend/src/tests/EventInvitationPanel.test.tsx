import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { act } from "react";
import { EventInvitationPanel } from "@/component/events/event-detail/EventInvitationPanel";

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe("EventInvitationPanel", () => {
  const users = [
    {
      user_id: "user-1",
      email: "one@example.com",
      first_name: "One",
      last_name: "Alpha",
    },
    {
      user_id: "user-2",
      email: "two@example.com",
      first_name: "Two",
      last_name: "Beta",
    },
  ];

  it("shows multiple lookup results and sends invite to selected user", async () => {
    const resolveInvitee = jest.fn().mockResolvedValue({
      success: true as const,
      users,
    });
    const onInvite = jest.fn().mockResolvedValue({
      success: true as const,
      invitedUser: users[1],
      message: "sent",
    });

    render(
      <EventInvitationPanel
        eventName="Test Event"
        hostName="Host"
        onInvite={onInvite}
        resolveInvitee={resolveInvitee}
      />,
    );

    const input = screen.getByPlaceholderText(/sasha@example.com/i);
    await userEvent.type(input, "two");

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 450));
    });

    await waitFor(() => {
      expect(resolveInvitee).toHaveBeenCalled();
    });

    expect(await screen.findByText(/One Alpha/)).toBeInTheDocument();
    expect(screen.getByText(/Two Beta/)).toBeInTheDocument();

    await userEvent.click(screen.getByText(/Two Beta/));
    await userEvent.click(screen.getByRole("button", { name: /send invite/i }));

    await waitFor(() => {
      expect(onInvite).toHaveBeenCalledWith("two", "user-2");
    });
  });
});
