export const formatUrlString = (s?: string) =>
  (s || "").trim().replace(/^\?/, "");
