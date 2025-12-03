import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { useEventsBrowserState } from "@/component/events/hooks/useEventsBrowserState";
import { getLocationDisplayText } from "@/helpers/locationCodec";
import type { EventListResponse } from "@/services/events";
import { encodeEventLocation } from "@/helpers/locationCodec";

const initialResult: EventListResponse = {
  items: [
    {
      event_id: "11111111-1111-1111-1111-111111111111",
      event_name: "Morning Yoga",
      event_datetime: "2025-07-04T12:00:00.000Z",
      event_endtime: "2025-07-04T14:00:00.000Z",
      event_location: encodeEventLocation({
        address: "Studio 27, Boston",
        longitude: -71.0589,
        latitude: 42.3601,
      }),
      description: "Find your flow with instructors from across the city.",
      picture_url: null,
      capacity: 40,
      price_field: null,
      user_id: "22222222-2222-2222-2222-222222222222",
      category_id: "33333333-3333-3333-3333-333333333333",
      created_at: "2025-06-01T10:00:00.000Z",
      updated_at: "2025-06-01T10:00:00.000Z",
    },
  ],
  total: 1,
  offset: 0,
  limit: 9,
};

function Harness() {
  const state = useEventsBrowserState(initialResult);
  return (
    <div>
      <div data-testid="results">
        {state.eventsToRender
          .map((event) => getLocationDisplayText(event.event_location))
          .join(", ")}
      </div>
      <div data-testid="count">{state.eventsToRender.length}</div>
      <button type="button" onClick={() => state.setQuery("Studio 27")}>
        Search by location
      </button>
    </div>
  );
}

describe("useEventsBrowserState location filtering", () => {
  it("matches encoded addresses when querying", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    expect(screen.getByTestId("results").textContent).toContain("Studio 27");
    expect(screen.getByTestId("count").textContent).toBe("1");

    await user.click(
      screen.getByRole("button", { name: /search by location/i }),
    );

    expect(screen.getByTestId("results").textContent).toContain("Studio 27");
    expect(screen.getByTestId("count").textContent).toBe("1");
  });
});
