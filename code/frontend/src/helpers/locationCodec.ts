export type EncodedLocationPayload = {
  address: string;
  longitude: number;
  latitude: number;
};

export type DecodedLocation = {
  address: string;
  longitude: number | null;
  latitude: number | null;
  isEncoded: boolean;
};

const PREFIX = "geo::";
const ENCODE_VERSION = 1;

function createRawPayload({
  address,
  longitude,
  latitude,
}: EncodedLocationPayload) {
  return {
    v: ENCODE_VERSION,
    address,
    longitude: Number(longitude),
    latitude: Number(latitude),
  };
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function tryParseJson(value: string): Record<string, unknown> | null {
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function resolvePrefixedValue(value: string): string | null {
  let current = value;
  for (let i = 0; i < 3; i += 1) {
    if (current.startsWith(PREFIX)) {
      return current;
    }
    try {
      current = decodeURIComponent(current);
    } catch {
      return null;
    }
  }
  return current.startsWith(PREFIX) ? current : null;
}

function decodeWithFallbacks(value: string) {
  const attempts = new Set<string>([value]);
  let current = value;
  for (let i = 0; i < 3; i += 1) {
    try {
      current = decodeURIComponent(current);
      attempts.add(current);
    } catch {
      break;
    }
  }

  for (const candidate of attempts) {
    const parsed = tryParseJson(candidate);
    if (parsed) {
      return parsed;
    }
  }
  return null;
}

export function encodeEventLocation(payload: EncodedLocationPayload): string {
  const raw = createRawPayload(payload);
  return `${PREFIX}${encodeURIComponent(JSON.stringify(raw))}`;
}

export function decodeEventLocation(
  value: string | null | undefined,
): DecodedLocation | null {
  if (!value) {
    return null;
  }

  const resolved = resolvePrefixedValue(value);

  if (!resolved) {
    return {
      address: value,
      longitude: null,
      latitude: null,
      isEncoded: false,
    };
  }

  const encoded = resolved.slice(PREFIX.length);
  const payload = decodeWithFallbacks(encoded);

  if (!payload) {
    return {
      address: resolved,
      longitude: null,
      latitude: null,
      isEncoded: false,
    };
  }

  const address = typeof payload.address === "string" ? payload.address : value;
  const longitude =
    isFiniteNumber(payload.longitude) || typeof payload.longitude === "string"
      ? Number(payload.longitude)
      : Number.NaN;
  const latitude =
    isFiniteNumber(payload.latitude) || typeof payload.latitude === "string"
      ? Number(payload.latitude)
      : Number.NaN;

  return {
    address,
    longitude: Number.isFinite(longitude) ? longitude : null,
    latitude: Number.isFinite(latitude) ? latitude : null,
    isEncoded: true,
  };
}

export function getLocationDisplayText(
  value: string | null | undefined,
): string | null {
  const decoded = decodeEventLocation(value);
  return decoded?.address ?? null;
}
