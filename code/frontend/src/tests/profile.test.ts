/*
AI-generated code: 100%
Human code: 0%
Framework-generated code: 0%
*/

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Profile from "../app/profile/page";
import * as eventsSvc from "@/services/events";

jest.mock("@/services/events", () => ({
  ...jest.requireActual("@/services/events"),
  getAttendingEvents: jest.fn(),
  getCreatedEvents: jest.fn(),
  getUpcomingEvents: jest.fn(),
}));

const attendingMock = jest.mocked(eventsSvc.getAttendingEvents);
const createdMock = jest.mocked(eventsSvc.getCreatedEvents);
const upcomingMock = jest.mocked(eventsSvc.getUpcomingEvents);

describe("Profile Component Tabs (Service-Driven)", () => {
  const attendingResults = [
    { event_id: "1", event_name: "A-Attending" },
  ];
  const createdResults = [
    { event_id: "2", event_name: "B-Created" },
  ];
  const upcomingResults = [
    { event_id: "3", event_name: "C-Upcoming" },
  ];

  beforeEach(() => {
    jest.restoreAllMocks();
    attendingMock.mockReset();
    createdMock.mockReset();
    upcomingMock.mockReset();
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  test("initial load fetches attending events (like initial pagination scenario)", async () => {
    attendingMock.mockResolvedValue(attendingResults);

    render(<Profile />);

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

    render(<Profile />);

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

    render(<Profile />);

    await waitFor(() =>
      expect(screen.getByText("A-Attending")).toBeInTheDocument()
    );

    fireEvent.click(screen.getByRole("tab", { name: /Upcoming/i }));

    await waitFor(() => {
      expect(eventsSvc.getUpcomingEvents).toHaveBeenCalled();
      expect(screen.getByText("C-Upcoming")).toBeInTheDocument();
      expect(screen.queryByText("A-Attending")).not.toBeInTheDocument();
    });
  });

  test("if no events return, shows empty state (like showEmptyState check)", async () => {
    attendingMock.mockResolvedValue([]);

    render(<Profile />);

    await waitFor(() => {
      expect(screen.getByText(/No events/i)).toBeInTheDocument();
    });
  });
});
