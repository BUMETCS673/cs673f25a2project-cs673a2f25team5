import {
  decodeEventLocation,
  encodeEventLocation,
  getLocationDisplayText,
} from "@/helpers/locationCodec";

describe("locationCodec", () => {
  it("encodes and decodes payload with coordinates", () => {
    const encoded = encodeEventLocation({
      address: "123 Main St, Boston",
      longitude: -71.057083,
      latitude: 42.361145,
    });

    const decoded = decodeEventLocation(encoded);

    expect(decoded).toEqual({
      address: "123 Main St, Boston",
      longitude: -71.057083,
      latitude: 42.361145,
      isEncoded: true,
    });
  });

  it("decodes plain string addresses without coordinates", () => {
    const decoded = decodeEventLocation("Somerville, MA");

    expect(decoded).toEqual({
      address: "Somerville, MA",
      longitude: null,
      latitude: null,
      isEncoded: false,
    });
  });

  it("handles double-encoded payloads gracefully", () => {
    const encodedOnce = encodeEventLocation({
      address: "Back Bay Station",
      longitude: -71.0757,
      latitude: 42.3473,
    });
    const doubleEncoded = encodeURIComponent(encodedOnce);

    const decoded = decodeEventLocation(doubleEncoded);

    expect(decoded).toEqual({
      address: "Back Bay Station",
      longitude: -71.0757,
      latitude: 42.3473,
      isEncoded: true,
    });
  });

  it("provides display text for encoded locations", () => {
    const encoded = encodeEventLocation({
      address: "Fenway Park",
      longitude: -71.0972,
      latitude: 42.3467,
    });

    expect(getLocationDisplayText(encoded)).toBe("Fenway Park");
  });
});
