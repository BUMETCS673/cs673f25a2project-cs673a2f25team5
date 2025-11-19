/*

AI-generated code: 100%

Human code: 0%

Framework-generated code: 0%

*/

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Profile from "../app/profile/page"; // <- adjust path if needed

describe("Profile Component Tabs", () => {
  test("renders all 3 tabs", () => {
    render(React.createElement(Profile));

    expect(screen.getByRole("tab", { name: /Attending/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Created/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Upcoming/i })).toBeInTheDocument();
  });

  test("Attending tab shows correct items", () => {
    render(React.createElement(Profile));

    // Attending tab should be active by default (Headless UI behavior)
    expect(screen.getByText("Saniya's Birthday")).toBeInTheDocument();
    expect(screen.getByText("Christmas Party")).toBeInTheDocument();
  });

  test("switching to Created tab shows correct events", () => {
    render(React.createElement(Profile));

    fireEvent.click(screen.getByRole("tab", { name: /Created/i }));

    expect(screen.getByText("Saniya's Birthday")).toBeInTheDocument();
    expect(screen.getByText("Sai's Birthday")).toBeInTheDocument();
  });

  test("switching to Upcoming tab shows correct events", () => {
    render(React.createElement(Profile));

    fireEvent.click(screen.getByRole("tab", { name: /Upcoming/i }));

    expect(screen.getByText("Thanksgiving Dinner")).toBeInTheDocument();
    expect(screen.getByText("Ice Skating Class")).toBeInTheDocument();
  });

  test("changing tabs hides the previous tab's content", () => {
    render(React.createElement(Profile));

    // Attending is default — assert one item from Attending
    expect(screen.getByText("Christmas Party")).toBeInTheDocument();

    // Switch to Upcoming
    fireEvent.click(screen.getByRole("tab", { name: /Upcoming/i }));

    // Attending content should disappear
    expect(screen.queryByText("Christmas Party")).not.toBeInTheDocument();
  });
});
