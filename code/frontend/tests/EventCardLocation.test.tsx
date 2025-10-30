import { render, screen } from "@testing-library/react";

import { EventCard } from "@/component/events/EventCard";
import { encodeEventLocation } from "@/helpers/locationCodec";
import type { EventResponse } from "@/services/events";

const baseEvent: EventResponse = {
  event_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  event_name: "Sunset Rooftop Jam",
  event_datetime: "2025-06-01T22:00:00.000Z",
  event_endtime: "2025-06-02T00:00:00.000Z",
  event_location: null,
  description: "Bring your own blanket.",
  picture_url: null,
  capacity: 100,
  price_field: null,
  user_id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
  category_id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
  created_at: "2025-05-01T12:00:00.000Z",
  updated_at: "2025-05-01T12:00:00.000Z",
};

describe("EventCard location display", () => {
  it("renders decoded address for encoded location payload", () => {
    const encodedLocation = encodeEventLocation({
      address: "123 Harbor Walk, Boston, MA",
      longitude: -71.0419,
      latitude: 42.3521,
    });

    render(
      <EventCard
        event={{ ...baseEvent, event_location: encodedLocation }}
        href="/events/1"
      />,
    );

    expect(screen.getByText("123 Harbor Walk, Boston, MA")).toBeInTheDocument();
  });

  it("falls back to plain text locations", () => {
    render(
      <EventCard
        event={{ ...baseEvent, event_location: "Cambridge, MA" }}
        href="/events/2"
      />,
    );

    expect(screen.getByText("Cambridge, MA")).toBeInTheDocument();
  });
});
