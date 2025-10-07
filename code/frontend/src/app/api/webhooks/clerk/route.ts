import { NextRequest, NextResponse } from "next/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";

export async function POST(req: NextRequest) {
  console.log("[webhook] Handler: POST invoked");

  let evt;
  try {
    evt = await verifyWebhook(req);
    console.log("[webhook] verifyWebhook passed, event:", evt);
  } catch (verifErr) {
    console.error("[webhook] verifyWebhook threw error:", verifErr);
    return new NextResponse("Invalid signature", { status: 400 });
  }

  // Always log the event type
  console.log("[webhook] Event type:", evt.type);

  if (evt.type === "user.created") {
    console.log("[webhook] Handling user.created");

    const firstName = evt.data.first_name;
    const lastName = evt.data.last_name;
    const emails = evt.data.email_addresses;
    const email = emails?.[0]?.email_address;

    // Validate required user data
    if (!email || typeof email !== "string" || email.trim() === "") {
      console.error(
        "[webhook] Missing or invalid email in user.created event:",
        emails,
      );
      return new NextResponse("Missing required user email", { status: 400 });
    }

    try {
      const baseUrl = process.env.BACKEND_URL;
      if (!baseUrl) {
        console.error("[webhook] Configuration Error");
        return new NextResponse("Configuration Error", { status: 500 });
      }
      const resp = await fetch(`${baseUrl.replace(/\/$/, "")}/create-user/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          email: email,
        }),
      });
      if (!resp.ok) {
        console.error("[webhook] Sync request failed:", resp.statusText);
        return new NextResponse("Sync request failed", { status: 500 });
      }
      const respText = await resp.text();
      console.log("[webhook] Sync request body:", respText);
    } catch (syncErr) {
      console.error("[webhook] Sync request failed:", syncErr);
      return new NextResponse("Sync request failed", { status: 500 });
    }
  } else {
    console.log("[webhook] Ignored event:", evt.type);
  }

  return new NextResponse("OK", { status: 200 });
}
