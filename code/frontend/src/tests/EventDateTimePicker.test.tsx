/*
AI-generated code: 100%

Human code: 0%

Framework-generated code: 0%

*/

import { fireEvent, render, screen } from "@testing-library/react";

import { EventDateTimePicker } from "@/component/events/EventDateTimePicker";
import type { DPDay, DPTime } from "@rehookify/datepicker";
import { useDatePicker } from "@rehookify/datepicker";

jest.mock("@rehookify/datepicker", () => ({
  __esModule: true,
  useDatePicker: jest.fn(),
}));

const mockUseDatePicker = useDatePicker as jest.MockedFunction<
  typeof useDatePicker
>;

const mockDayDate = new Date(2024, 5, 15, 9, 0, 0);
const mockTimeDate = new Date(2024, 5, 15, 11, 30, 0);

const mockDay: DPDay = {
  $date: mockDayDate,
  day: "15",
  disabled: false,
  inCurrentMonth: true,
  active: true,
  now: false,
  selected: false,
  range: "",
};

const mockTime: DPTime = {
  $date: mockTimeDate,
  disabled: false,
  now: false,
  selected: false,
  time: "11:30 AM",
};

const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

beforeEach(() => {
  jest.clearAllMocks();
  mockUseDatePicker.mockImplementation((config) => {
    const onDatesChange = config.onDatesChange;
    const dayButton = () => ({
      className: "",
      onClick: () => {
        onDatesChange([mockDayDate]);
      },
    });
    const timeButton = (_entry: DPTime, { onClick } = {}) => ({
      className: "",
      onClick: () => {
        onClick?.();
        onDatesChange([mockTimeDate]);
      },
    });
    const navProps = () => ({ onClick: jest.fn() });

    return {
      data: {
        calendars: [
          {
            month: "June",
            year: "2024",
            days: [mockDay],
          },
        ],
        weekDays,
        time: [mockTime],
      },
      propGetters: {
        dayButton,
        timeButton,
        addOffset: navProps,
        subtractOffset: navProps,
        setOffset: navProps,
      },
    };
  });
});

const renderPicker = (
  props?: Partial<Parameters<typeof EventDateTimePicker>[0]>,
) => {
  const defaultProps = {
    id: "event-start",
    label: "Start",
    dateValue: "",
    timeValue: "",
    onChange: jest.fn(),
  } satisfies Parameters<typeof EventDateTimePicker>[0];

  return render(<EventDateTimePicker {...defaultProps} {...props} />);
};

describe("EventDateTimePicker", () => {
  it("opens the calendar popover when the trigger is clicked", () => {
    renderPicker();

    const trigger = screen.getByRole("button", { name: /start/i });
    fireEvent.click(trigger);

    expect(
      screen.getByRole("dialog", { name: /start picker/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "15" })).toBeInTheDocument();
  });

  it("calls onChange with a formatted date when a day is selected", () => {
    const onChange = jest.fn();
    renderPicker({ onChange });

    fireEvent.click(screen.getByRole("button", { name: /start/i }));
    fireEvent.click(screen.getByRole("button", { name: "15" }));

    expect(onChange).toHaveBeenCalledWith("2024-06-15", "");
  });

  it("calls onChange with date and time when a time slot is chosen", () => {
    const onChange = jest.fn();
    renderPicker({ onChange });

    fireEvent.click(screen.getByRole("button", { name: /start/i }));
    fireEvent.click(screen.getByRole("button", { name: "11:30 AM" }));

    expect(onChange).toHaveBeenCalledWith("2024-06-15", "11:30");
  });
});
