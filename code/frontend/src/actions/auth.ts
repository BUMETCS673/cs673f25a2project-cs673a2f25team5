"use server";

import { cookies } from "next/headers";

export async function setLoginCookie(email: string) {
  const cookieStore = await cookies();
  cookieStore.set("email", email, { path: "/", httpOnly: true });
}

export async function getLoginCookie() {
  const cookieStore = await cookies();
  return cookieStore.get("email");
}

export async function deleteLoginCookie() {
  const cookieStore = await cookies();
  cookieStore.delete("email");
}
