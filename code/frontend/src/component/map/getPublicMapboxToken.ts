/*

 AI-generated code:  0%
 
 Human code: 100% (functions: getPublicMapboxToken) 

 No framework-generated code.

*/
export function getPublicMapboxToken(): string {
  return process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? process.env.MAPBOX_TOKEN ?? "";
}
