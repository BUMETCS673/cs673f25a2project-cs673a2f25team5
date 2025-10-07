import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Protect only specific private routes
const isPrivateRoute = createRouteMatcher(["/discover(.*)", "/onboarding(.*)"]);

// A matcher for the webhook path(s) you want to skip
const isWebhookRoute = createRouteMatcher(["/api/webhooks/clerk(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  // If it's a webhook route, skip (let it through)
  if (isWebhookRoute(req)) {
    return NextResponse.next();
  }

  // If it's a private route, require auth
  if (isPrivateRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals, static files, etc.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
