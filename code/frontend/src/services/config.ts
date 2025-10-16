/*
 AI-generated code:  0% 
 Human code:100% (functions: API_BASE_URL) 

 No framework-generated code.

*/
const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") ??
  "http://localhost:8000";

export { API_BASE_URL };
