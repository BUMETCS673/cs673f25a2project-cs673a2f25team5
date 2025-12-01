/*
 AI-generated code: 100%
*/

"use server";

import { auth } from "@clerk/nextjs/server";

import { API_BASE_URL } from "./config";

export type CheckoutSessionRequest = {
  event_id: string;
  user_id: string;
  amount_usd: string;
  email?: string | null;
};

export type CheckoutSessionResponse = {
  checkout_url: string | null;
  already_paid?: boolean;
};

export async function createCheckoutSession(
  payload: CheckoutSessionRequest,
): Promise<CheckoutSessionResponse> {
  const { getToken } = await auth();
  const token = await getToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/payments/checkout-session`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      event_id: payload.event_id,
      user_id: payload.user_id,
      amount_usd: payload.amount_usd,
      ...(payload.email ? { email: payload.email } : {}),
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Failed to create checkout session (status ${response.status})`,
    );
  }

  const data = (await response.json()) as Partial<CheckoutSessionResponse>;

  if (
    data.checkout_url !== null &&
    typeof data.checkout_url !== "undefined" &&
    typeof data.checkout_url !== "string"
  ) {
    throw new Error("Invalid checkout session response");
  }

  return {
    checkout_url: data.checkout_url ?? null,
    already_paid: Boolean(data.already_paid),
  };
}

// Refunds are not supported in this build.
