/*

 AI-generated code: 100% 

*/

const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") ??
  process.env.BACKEND_URL?.replace(/\/$/, "") ??
  process.env.APP_BASE_URL?.replace(/\/$/, "") ??
  "http://backend:8000";

export { API_BASE_URL };
