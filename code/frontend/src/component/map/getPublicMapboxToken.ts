/*

 AI-generated code: 0%

 Human code: 100% (functions: getPublicMapboxToken) 

 No framework-generated code.

*/

export function getPublicMapboxToken(): string {
  const candidates = [
    process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
    process.env.NEXT_PUBLIC_MAP_BOX_TOKEN,
    process.env.MAPBOX_TOKEN,
    process.env.MAP_BOX_TOKEN,
  ];

  for (const token of candidates) {
    if (token && token.trim().length > 0) {
      return token;
    }
  }

  return "";
}
