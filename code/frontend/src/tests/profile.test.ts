/*** 
  AI-generated code: 25% (tool: Codex - GPT-5, modified and adapted, functions: UserProfile1, useUser, useCallback, useEffect, useState) 
  Human code: 75% (functions: UserProfile1, useUser, useCallback, useEffect, useState) 
  Framework-generated code: 0%
 **/

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
	const attendingResults = [{ event_id: "a1", event_name: "A-Attending" }];
	const createdResults = [{ event_id: "b1", event_name: "B-Created" }];
	const upcomingResults = [{ event_id: "c1", event_name: "C-Upcoming" }];

	beforeEach(() => {
		jest.resetAllMocks();
		jest.spyOn(console, "error").mockImplementation(() => {});
	});

	it("loads Attending on mount and displays events", async () => {
		attendingMock.mockResolvedValue(attendingResults as unknown);
		render(React.createElement(Profile));

		await waitFor(() => {
			expect(eventsSvc.getAttendingEvents).toHaveBeenCalledWith(
				expect.objectContaining({ offset: 0, limit: 5 })
			);
			expect(screen.getByText("A-Attending")).toBeInTheDocument();
		});
	});

	it("fetches Created when Created tab is selected", async () => {
		attendingMock.mockResolvedValue(attendingResults as unknown);
		createdMock.mockResolvedValue(createdResults as unknown);
		render(React.createElement(Profile));

		fireEvent.click(screen.getByRole("tab", { name: /Created/i }));

		await waitFor(() => {
			expect(eventsSvc.getCreatedEvents).toHaveBeenCalledWith(
				expect.objectContaining({ offset: 0, limit: 5 })
			);
			expect(screen.getByText("B-Created")).toBeInTheDocument();
		});
	});

	it("fetches Upcoming when Upcoming tab is selected and hides Attending items", async () => {
		attendingMock.mockResolvedValue(attendingResults as unknown);
		upcomingMock.mockResolvedValue(upcomingResults as unknown);
		render(React.createElement(Profile));

		await waitFor(() => expect(screen.getByText("A-Attending")).toBeInTheDocument());

		fireEvent.click(screen.getByRole("tab", { name: /Upcoming/i }));

		await waitFor(() => {
			expect(eventsSvc.getUpcomingEvents).toHaveBeenCalledWith(
				expect.objectContaining({ offset: 0, limit: 5 })
			);
			expect(screen.getByText("C-Upcoming")).toBeInTheDocument();
			expect(screen.queryByText("A-Attending")).not.toBeInTheDocument();
		});
	});
});

