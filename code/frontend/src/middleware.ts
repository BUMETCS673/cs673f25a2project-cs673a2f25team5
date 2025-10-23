import { NextResponse } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  "/discover(.*)",
  "/onboarding(.*)",
  "/create-events(.*)",
  "/events/(.*)",
  "/events/[id](.*)",
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
