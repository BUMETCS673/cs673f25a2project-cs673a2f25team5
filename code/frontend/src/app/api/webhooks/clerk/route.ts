/*

 AI-generated code:  20% (tool: Codex - GPT-5, modified and adapted, functions: POST, verifyWebhook) 

 Human code: 72% (functions: POST, verifyWebhook, clerkClient, NextRequest, NextResponse) 

 Framework-generated code: 8% (tool: Next.js, framework: Next.js) 

*/
import { NextRequest, NextResponse } from "next/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { clerkClient } from "@clerk/nextjs/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000"; // Adjust as needed

export async function POST(req: NextRequest) {
  console.log("[Webhook] Received Clerk user.created event");

  let evt;
  try {
    evt = await verifyWebhook(req);
  } catch (err) {
    console.error("[Webhook] Verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const eventType = evt.type;
  if (eventType !== "user.created") {
    console.log(`[Webhook] Ignored event type: ${eventType}`);
    return NextResponse.json({ received: true });
  }

  const user = evt.data;
  const email = user.email_addresses?.[0]?.email_address;

  // Construct payload that your backend expects
  const payload = {
    first_name: user.first_name || "Unknown",
    last_name: user.last_name || "Unknown",
    email: email || "unknown@example.com",
    date_of_birth: "2000-01-01",
    color: "blue",
  };

  console.log("[Webhook] Sending payload to backend:", payload);

  try {
    const res = await fetch(`${BACKEND_URL}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("[Webhook] Backend responded with error:", text);
      return NextResponse.json(
        { error: "Backend error", details: text },
        { status: res.status },
      );
    }

    const data = await res.json();

    console.log("backend data: ", data);

    const clerk = await clerkClient();
    await clerk.users.updateUser(user.id, { externalId: data.user_id });

    console.log("[Webhook] Successfully created user in backend");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Webhook] Failed to reach backend:", error);
    return NextResponse.json(
      { error: "Failed to reach backend" },
      { status: 500 },
    );
  }
}
