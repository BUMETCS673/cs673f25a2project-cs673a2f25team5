/*

 AI-generated code: 0%

 Human code: 100% (functions: parseDateValue, hasEventEnded) 

 No framework-generated code.

*/

type EventTimeInput = {
  eventStart?: string | null;
  eventEnd?: string | null;
  now?: number;
};

function parseDateValue(value: string | null | undefined): number | null {
  if (!value) {
    return null;
  }

  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return null;
  }

  return timestamp;
}

export function hasEventEnded({
  eventStart,
  eventEnd,
  now = Date.now(),
}: EventTimeInput): boolean {
  const endTimestamp = parseDateValue(eventEnd);
  const startTimestamp = parseDateValue(eventStart);

  if (typeof endTimestamp === "number") {
    return now >= endTimestamp;
  }

  if (typeof startTimestamp === "number") {
    return now >= startTimestamp;
  }

  return false;
}
