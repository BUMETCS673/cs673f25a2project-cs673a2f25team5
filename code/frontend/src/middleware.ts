/*

 AI-generated code: 0%

 Human code: 40% (functions: isProtectedRoute, shouldBypassAuth, clerkMiddleware, createRouteMatcher, NextResponse)

 framework-generated code: 60% (functions: NextResponse, clerkMiddleware, createRouteMatcher) from @clerk/nextjs/server

*/

import { NextResponse } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  "/discover(.*)",
  "/onboarding(.*)",
  "/create-events(.*)",
  "/events/(.*)",
  "/events/[id](.*)",
  "/profile(.*)",
]);
const shouldBypassAuth = createRouteMatcher(["/api/webhooks/clerk(.*)"]);

export default clerkMiddleware(async (auth, request) => {
  if (process.env.NEXT_PUBLIC_E2E === "1") {
    return NextResponse.next();
  }
  if (shouldBypassAuth(request)) {
    return NextResponse.next();
  }

  if (isProtectedRoute(request)) {
    await auth.protect();
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
