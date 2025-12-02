/*** 
  AI-generated code: 30% (tool: Codex - GPT-5, modified and adapted, additions: jest import) 
  Human code: 70% (tests, structure, logic) 
  Framework-generated code: 0%
 **/

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import UserProfile1 from "../app/profile/page";
import * as eventsSvc from "../services/events";
import * as attendeesSvc from "../services/attendees";

// Mock Clerk user to ensure userId is defined
jest.mock("@clerk/nextjs", () => ({
  useUser: () => ({
    isLoaded: true,
    user: {
      externalId: "user_123",
      firstName: "Test",
      lastName: "User",
      createdAt: new Date("2025-01-01T00:00:00Z"),
      emailAddresses: [{ emailAddress: "test@example.com" }],
      imageUrl: "/img/avatar1.jpg",
    },
  }),
}));

jest.mock("../services/events", () => {
  const actual =
    jest.requireActual<typeof import("../services/events")>(
      "../services/events",
    );
  return {
    ...actual,
    getEvents: jest.fn(),
  };
});

jest.mock("../services/attendees", () => {
  const actual = jest.requireActual<typeof import("../services/attendees")>(
    "../services/attendees",
  );
  return {
    ...actual,
    getAttendees: jest.fn(),
  };
});

const getEventsMock = eventsSvc.getEvents as jest.Mock;
const getAttendeesMock = attendeesSvc.getAttendees as jest.Mock;

describe("Profile dropdown event selector", () => {
  const createdItems = [{ event_id: "e1", event_name: "Created Event" }];
  const registeredItems = [{ event_id: "r1", event_name: "Registered Event" }];
  const upcomingItems = [{ event_id: "u1", event_name: "Upcoming Event" }];

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  it("loads created events by default", async () => {
    getEventsMock.mockResolvedValueOnce({ items: createdItems });

    render(React.createElement(UserProfile1));

    await waitFor(() => {
      expect(getEventsMock).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.arrayContaining([
            expect.stringContaining("user_id:eq:"),
          ]),
        }),
      );
      expect(screen.getByText("Created Event")).toBeInTheDocument();
    });
  });

  it("loads registered events when user selects 'Events I registered for'", async () => {
    getEventsMock.mockResolvedValueOnce({ items: createdItems });
    getAttendeesMock.mockResolvedValue({
      items: [{ event_id: "r1" }],
    });
    getEventsMock.mockResolvedValueOnce({ items: registeredItems });

    render(React.createElement(UserProfile1));

    fireEvent.change(screen.getByLabelText(/Show/i), {
      target: { value: "registered" },
    });

    await waitFor(() => {
      expect(getAttendeesMock).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.arrayContaining([
            expect.stringContaining("user_id:eq:"),
          ]),
        }),
      );
      expect(getEventsMock).toHaveBeenLastCalledWith(
        expect.objectContaining({
          filters: expect.arrayContaining([
            expect.stringContaining("event_id:in"),
          ]),
        }),
      );
      expect(screen.getByText("Registered Event")).toBeInTheDocument();
    });
  });

  it("loads upcoming events when user selects 'Upcoming events'", async () => {
    getEventsMock.mockResolvedValueOnce({ items: createdItems });
    getEventsMock.mockResolvedValueOnce({ items: upcomingItems });

    render(React.createElement(UserProfile1));

    fireEvent.change(screen.getByLabelText(/Show/i), {
      target: { value: "upcoming" },
    });

    await waitFor(() => {
      expect(getEventsMock).toHaveBeenLastCalledWith(
        expect.objectContaining({
          filters: expect.arrayContaining([
            expect.stringContaining("event_datetime:gt:"),
          ]),
        }),
      );
      expect(screen.getByText("Upcoming Event")).toBeInTheDocument();
      expect(screen.queryByText("Created Event")).not.toBeInTheDocument();
    });
  });
});
