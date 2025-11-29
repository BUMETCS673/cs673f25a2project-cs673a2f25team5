/**
 * AI-generated code: 100%
 *
 * Human code: 0%
 *
 * Framework-generated code: 0%
 */

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Health check endpoint for container healthchecks and monitoring
 * Returns 200 OK with a simple status message
 */
export async function GET() {
  return NextResponse.json(
    { status: "healthy", timestamp: new Date().toISOString() },
    { status: 200 },
  );
}
