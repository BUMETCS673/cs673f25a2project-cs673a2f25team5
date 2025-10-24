/*

 AI-generated code:  0% 
 
 Human code:100% (functions: fetchWithTimeout, FETCH_TIMEOUT_MS) 

 No framework-generated code.

*/
const FETCH_TIMEOUT_MS = 5_000;

export async function fetchWithTimeout(
  url: string,
  opts: RequestInit = {},
  timeout = FETCH_TIMEOUT_MS,
) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { ...opts, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}
