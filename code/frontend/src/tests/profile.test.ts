/*** 
  AI-generated code: 30% (tool: Codex - GPT-5, modified and adapted, additions: jest import) 
  Human code: 70% (tests, structure, logic) 
  Framework-generated code: 0%
 **/

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Profile from "../app/profile/page";
import * as eventsSvc from "../services/events";
import * as attendeesSvc from "../services/attendees";
import { jest } from "@jest/globals";

jest.mock("../services/events", () => {
  const actual = jest.requireActual<typeof import("../services/events")>("../services/events");
  return {
    ...actual,
    getEvents: jest.fn(),
  };
});

jest.mock("../services/attendees", () => {
  const actual = jest.requireActual<typeof import("../services/attendees")>("../services/attendees");
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
    getEventsMock.mockResolvedValue({
      items: createdItems,
    });

    render(<Profile />);

    await waitFor(() => {
      expect(getEventsMock).toHaveBeenCalled();
      expect(screen.getByText("Created Event")).toBeInTheDocument();
    });
  });

  it("loads registered events when user selects 'Events I registered for'", async () => {
    getEventsMock.mockResolvedValue({ items: [] }); // initial
    getAttendeesMock.mockResolvedValue({
      items: [{ event_id: "r1" }],
    });
    getEventsMock.mockResolvedValueOnce({ items: registeredItems });

    render(<Profile />);

    fireEvent.change(screen.getByLabelText(/Show/i), {
      target: { value: "registered" },
    });

    await waitFor(() => {
      expect(getAttendeesMock).toHaveBeenCalled();
      expect(getEventsMock).toHaveBeenLastCalledWith(
        expect.objectContaining({
          filters: expect.arrayContaining([expect.stringContaining("event_id:in")]),
        }),
      );
      expect(screen.getByText("Registered Event")).toBeInTheDocument();
    });
  });

  it("loads upcoming events when user selects 'Upcoming events'", async () => {
    getEventsMock.mockResolvedValueOnce({ items: createdItems }); // initial load
    getEventsMock.mockResolvedValueOnce({ items: upcomingItems }); // upcoming load

    render(<Profile />);

    fireEvent.change(screen.getByLabelText(/Show/i), {
      target: { value: "upcoming" },
    });

    await waitFor(() => {
      expect(getEventsMock).toHaveBeenCalled();
      expect(screen.getByText("Upcoming Event")).toBeInTheDocument();
      expect(screen.queryByText("Created Event")).not.toBeInTheDocument();
    });
  });
});
