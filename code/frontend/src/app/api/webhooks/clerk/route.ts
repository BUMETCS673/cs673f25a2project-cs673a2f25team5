import { NextRequest, NextResponse } from "next/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { fetchWithTimeout } from "@/helpers/fetchTimeout";

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

    const { first_name, last_name, email_addresses } = evt.data;
    const email = email_addresses?.[0]?.email_address;

    // Validate required user data
    if (!email || typeof email !== "string" || email.trim() === "") {
      console.error(
        "[webhook] Missing or invalid email in user.created event:",
        email_addresses,
      );
      return new NextResponse("Missing required user email", { status: 400 });
    }

    try {
      const baseUrl = process.env.BACKEND_URL;
      if (!baseUrl) {
        console.error("[webhook] Configuration Error");
        return new NextResponse("Configuration Error", { status: 500 });
      }
      const url = new URL("/create-user/", baseUrl).toString();
      const resp = await fetchWithTimeout(url, {
        method: "POST",
        // TODO: add Bearer token for authentication to the backend.
        // Authorization: `Bearer ${INTERNAL_API_TOKEN}`, in header and define it in the environment variables.
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": evt?.data.id ?? crypto.randomUUID(),
        },
        body: JSON.stringify({
          first_name,
          last_name,
          email: email,
        }),
      });
      if (!resp.ok) {
        const text = await resp.text().catch(() => "");
        console.error("[webhook] Sync request failed:", resp.statusText, text);
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
