/*
AI-generated code: 100%
Human code: 0%
Framework-generated code: 0%
*/

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Profile from "../app/profile/page";
import * as eventsSvc from "@/services/events";

jest.mock("@/services/events", () => ({
  ...jest.requireActual("@/services/events"),
  getAttendingEvents: jest.fn(),
  getCreatedEvents: jest.fn(),
  getUpcomingEvents: jest.fn(),
}));

const attendingMock = eventsSvc.getAttendingEvents as jest.MockedFunction<any>;
const createdMock = eventsSvc.getCreatedEvents as jest.MockedFunction<any>;
const upcomingMock = eventsSvc.getUpcomingEvents as jest.MockedFunction<any>;

describe("Profile Component Tabs (Service-Driven)", () => {
  const attendingResults = [
    { event_id: "1", 
      event_name: "A-Attending", 
      event_datetime: "2025-10-01T10:00:00Z",
      event_endtime: "2025-10-01T12:00:00Z",
      event_location: "X",
      description: null,
      picture_url: null,
      capacity: null,
      price_field: null,
      user_id: "00000000-0000-0000-0000-000000000000",
      category_id: "00000000-0000-0000-0000-000000000000", 
    },
  ];
  const createdResults = [
    { event_id: "2", 
      event_name: "B-Created", 
      event_datetime: "2025-10-02T10:00:00Z",
          event_endtime: "2025-10-01T12:00:00Z",
      event_location: "X",
      description: null,
      picture_url: null,
      capacity: null,
      price_field: null,
      user_id: "00000000-0000-0000-0000-000000000000",
      category_id: "00000000-0000-0000-0000-000000000000", 
    },
  ];
  const upcomingResults = [
    { event_id: "3", 
      event_name: "C-Upcoming", 
      event_datetime: "2025-10-03T10:00:00Z",
      event_endtime: "2025-10-01T12:00:00Z",
      event_location: "X",
      description: null,
      picture_url: null,
      capacity: null,
      price_field: null,
      user_id: "00000000-0000-0000-0000-000000000000",
      category_id: "00000000-0000-0000-0000-000000000000",  
    },
  ];

  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  test("initial load fetches attending events (like initial pagination scenario)", async () => {
    attendingMock.mockResolvedValue(attendingResults);
    render(React.createElement(Profile));

    await waitFor(() => {
      expect(eventsSvc.getAttendingEvents).toHaveBeenCalledWith(
        expect.objectContaining({ offset: 0, limit: 5 })
      );
      expect(screen.getByText("A-Attending")).toBeInTheDocument();
    });
  });

  test("switching to Created triggers service call (like handleNextPage)", async () => {
    attendingMock.mockResolvedValue(attendingResults);
    createdMock.mockResolvedValue(createdResults);
    render(React.createElement(Profile));

    fireEvent.click(screen.getByRole("tab", { name: /Created/i }));

    await waitFor(() => {
      expect(eventsSvc.getCreatedEvents).toHaveBeenCalledWith(
        expect.objectContaining({ offset: 0, limit: 5 })
      );
      expect(screen.getByText("B-Created")).toBeInTheDocument();
    });
  });

  test("switching to Upcoming triggers service call and hides previous results", async () => {
    attendingMock.mockResolvedValue(attendingResults);
    upcomingMock.mockResolvedValue(upcomingResults);
    render(React.createElement(Profile));

    await waitFor(() => expect(screen.getByText("A-Attending")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("tab", { name: /Upcoming/i }));

    await waitFor(() => {
      expect(eventsSvc.getUpcomingEvents).toHaveBeenCalled();
      expect(screen.getByText("C-Upcoming")).toBeInTheDocument();
      expect(screen.queryByText("A-Attending")).not.toBeInTheDocument();
    });
  });
});

