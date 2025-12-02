/*** 
  AI-generated code: 100% (tool: Codex - GPT-5, modified and adapted, additions: jest import) 
  
  Human code: 0% 
  
  Framework-generated code: 0%
 **/

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import UserProfile1 from "../app/profile/page";
import * as eventsSvc from "@/services/events";
import * as attendeesSvc from "@/services/attendees";

// Mock Clerk user to ensure userId is defined
jest.mock("@clerk/nextjs", () => ({
  useUser: () => ({
    isLoaded: true,
    user: {
      externalId: "00000000-0000-0000-0000-000000000000",
      firstName: "Test",
      lastName: "User",
      createdAt: new Date("2025-01-01T00:00:00Z"),
      emailAddresses: [{ emailAddress: "test@example.com" }],
      imageUrl: "/img/avatar1.jpg",
    },
  }),
}));

jest.mock("@/services/events", () => ({
  ...jest.requireActual("@/services/events"),
  getEvents: jest.fn(),
}));

jest.mock("@/services/attendees", () => ({
  ...jest.requireActual("@/services/attendees"),
  getAttendees: jest.fn(),
}));

const getEventsMock = jest.mocked(eventsSvc.getEvents);
const getAttendeesMock = jest.mocked(attendeesSvc.getAttendees);

describe("Profile dropdown event selector", () => {
  const createdItems = [
    {
      event_id: "00000000-0000-0000-0000-000000000001",
      event_name: "Created Event",
      event_datetime: "2025-10-01T10:00:00Z",
      event_endtime: "2025-10-01T12:00:00Z",
      event_location: "Location A",
      description: null,
      picture_url: null,
      capacity: null,
      price_field: null,
      user_id: "00000000-0000-0000-0000-000000000000",
      category_id: "00000000-0000-0000-0000-000000000000",
    },
  ];
  const registeredItems = [
    {
      event_id: "00000000-0000-0000-0000-000000000002",
      event_name: "Registered Event",
      event_datetime: "2025-10-02T10:00:00Z",
      event_endtime: "2025-10-02T12:00:00Z",
      event_location: "Location B",
      description: null,
      picture_url: null,
      capacity: null,
      price_field: null,
      user_id: "00000000-0000-0000-0000-000000000000",
      category_id: "00000000-0000-0000-0000-000000000000",
    },
  ];
  const upcomingItems = [
    {
      event_id: "00000000-0000-0000-0000-000000000003",
      event_name: "Upcoming Event",
      event_datetime: "2025-10-03T10:00:00Z",
      event_endtime: "2025-10-03T12:00:00Z",
      event_location: "Location C",
      description: null,
      picture_url: null,
      capacity: null,
      price_field: null,
      user_id: "00000000-0000-0000-0000-000000000000",
      category_id: "00000000-0000-0000-0000-000000000000",
    },
  ];

  beforeEach(() => {
    jest.restoreAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
    getEventsMock.mockReset();
    getAttendeesMock.mockReset();
  });

  it("loads created events by default", async () => {
    getEventsMock.mockResolvedValueOnce({ items: createdItems });

    render(React.createElement(UserProfile1));

    await waitFor(() => {
      expect(eventsSvc.getEvents).toHaveBeenCalledWith(
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
      items: [
        {
          attendee_id: "00000000-0000-0000-0000-000000000001",
          event_id: "00000000-0000-0000-0000-000000000002",
          user_id: "00000000-0000-0000-0000-000000000000",
          status: "RSVPed",
          created_at: "2025-01-01T00:00:00Z",
          updated_at: "2025-01-01T00:00:00Z",
        },
      ],
    });
    getEventsMock.mockResolvedValueOnce({ items: registeredItems });

    render(React.createElement(UserProfile1));

    fireEvent.change(screen.getByLabelText(/Show/i), {
      target: { value: "registered" },
    });

    await waitFor(() => {
      expect(attendeesSvc.getAttendees).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.arrayContaining([
            expect.stringContaining("user_id:eq:"),
          ]),
        }),
      );
      expect(eventsSvc.getEvents).toHaveBeenLastCalledWith(
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
      expect(eventsSvc.getEvents).toHaveBeenLastCalledWith(
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
