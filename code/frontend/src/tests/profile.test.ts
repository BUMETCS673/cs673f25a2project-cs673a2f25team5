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

type EventsMock = jest.MockedFunction<(...args: unknown[]) => Promise<unknown>>;

const attendingMock = eventsSvc.getAttendingEvents as EventsMock;
const createdMock = eventsSvc.getCreatedEvents as EventsMock;
const upcomingMock = eventsSvc.getUpcomingEvents as EventsMock;

describe("Profile page tabs", () => {
  const attendingResults = [
    {
      event_id: "00000000-0000-0000-0000-000000000001",
      event_name: "A",
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
    {
      event_id: "00000000-0000-0000-0000-000000000002",
      event_name: "B",
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
  const upcomingResults = [
    {
      event_id: "00000000-0000-0000-0000-000000000003",
      event_name: "C",
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

  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  it("loads Attending on mount and displays events", async () => {
    attendingMock.mockResolvedValue(attendingResults as unknown);
    render(React.createElement(Profile));

    await waitFor(() => {
      expect(eventsSvc.getAttendingEvents).toHaveBeenCalledWith(
        expect.objectContaining({ offset: 0, limit: 5 }),
      );
      expect(screen.getByText("A")).toBeInTheDocument();
    });
  });

  it("fetches Created when Created tab is selected", async () => {
    attendingMock.mockResolvedValue(attendingResults as unknown);
    createdMock.mockResolvedValue(createdResults as unknown);
    render(React.createElement(Profile));

    fireEvent.click(screen.getByRole("tab", { name: /Created/i }));

    await waitFor(() => {
      expect(eventsSvc.getCreatedEvents).toHaveBeenCalledWith(
        expect.objectContaining({ offset: 0, limit: 5 }),
      );
      expect(screen.getByText("B")).toBeInTheDocument();
    });
  });

  it("fetches Upcoming when Upcoming tab is selected and hides Attending items", async () => {
    attendingMock.mockResolvedValue(attendingResults as unknown);
    upcomingMock.mockResolvedValue(upcomingResults as unknown);
    render(React.createElement(Profile));

    await waitFor(() => expect(screen.getByText("A")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("tab", { name: /Upcoming/i }));

    await waitFor(() => {
      expect(eventsSvc.getUpcomingEvents).toHaveBeenCalled();
      expect(screen.getByText("C")).toBeInTheDocument();
      expect(screen.queryByText("A")).not.toBeInTheDocument();
    });
  });
});
