/*

 AI-generated code: 0%

 Human code: 100% (tests: EventFilter option selection & highlighting)

 Framework-generated code: 0%

*/

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EventFilter } from "@/component/events/EventFilter";

describe("EventFilter", () => {
  it("renders all sort options and calls onChange when selecting one", async () => {
    const onChange = jest.fn();

    render(<EventFilter value="Date" onChange={onChange} />);

    // Open popover menu
    await userEvent.click(screen.getByRole("button", { name: /sort/i }));

    const options = [
      "Date",
      "Distance",
      "Price",
      "Capacity",
      "A to Z",
      "Z to A",
    ];

    // Ensure all options render
    for (const label of options) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }

    // Click a non-selected option (e.g., Price)
    await userEvent.click(screen.getByText("Price"));

    expect(onChange).toHaveBeenCalledWith("Price");
  });

  it("applies selected styling to the active option", async () => {
    const onChange = jest.fn();

    render(<EventFilter value="Distance" onChange={onChange} />);

    // Open menu
    await userEvent.click(screen.getByRole("button", { name: /sort/i }));

    const selected = screen.getByText("Distance");

    // The class we check is part of your highlight styles
    expect(selected.className).toMatch(/bg-gradient-to-r/);
  });
});
