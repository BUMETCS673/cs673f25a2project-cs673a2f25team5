/*

 AI-generated code: 0%

 Human code: 100% (tests: EventSort option selection & highlighting)

 Framework-generated code: 0%

*/

import { render, screen, fireEvent } from "@testing-library/react";
import { EventSort } from "../component/events/EventSort";

describe("EventSort component", () => {
  const sortOptions = ["Date", "Price", "Capacity", "A to Z", "Z to A"];

  test("renders Sort button", () => {
    render(<EventSort value="Date" onChange={() => {}} />);
    expect(screen.getByRole("button", { name: /sort/i })).toBeInTheDocument();
  });

  test("renders all sort options when clicked", () => {
    render(<EventSort value="Date" onChange={() => {}} />);

    const button = screen.getByRole("button", { name: /sort/i });
    fireEvent.click(button);

    sortOptions.forEach((option) => {
      expect(screen.getByRole("button", { name: option })).toBeInTheDocument();
    });
  });

  test("calls onChange callback when option is clicked", () => {
    const handleChange = jest.fn();
    render(<EventSort value="Date" onChange={handleChange} />);

    const button = screen.getByRole("button", { name: /sort/i });
    fireEvent.click(button);

    const optionButton = screen.getByRole("button", { name: "Price" });
    fireEvent.click(optionButton);

    expect(handleChange).toHaveBeenCalledWith("Price");
  });

  test("highlights the selected value", () => {
    render(<EventSort value="Capacity" onChange={() => {}} />);

    const button = screen.getByRole("button", { name: /sort/i });
    fireEvent.click(button);

    const selectedButton = screen.getByRole("button", { name: "Capacity" });
    expect(selectedButton).toHaveClass(
      "bg-gradient-to-r from-[#5c1354] to-[#b34fa8] text-white shadow-md",
    );
  });
});
