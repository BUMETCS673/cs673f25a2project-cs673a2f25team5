export function getPublicMapboxToken(): string {
  return process.env.NEXT_PUBLIC_MAP_BOX_TOKEN ?? "";
}
