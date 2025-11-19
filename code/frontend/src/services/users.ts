/*

 AI-generated code: 100% (tool: Codex - GPT-5, UserSchema, UserResponse, UserListSchema, UserListResponse, getUser) 

 Human code: 0%

 No framework-generated code.

*/

import { z } from "zod";
import { API_BASE_URL } from "./config";
import { UserResponse, UserListSchema } from "@/types/userTypes";
import { auth } from "@clerk/nextjs/server";

export async function getUser(id: string): Promise<UserResponse> {
  const userId = z.uuid().parse(id);
  const url = new URL("/users", API_BASE_URL);
  url.searchParams.append("filter_expression", `user_id:eq:${userId}`);
  url.searchParams.set("limit", "1");

  const { getToken } = await auth();

  const token = await getToken();

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  const data = await response.json();
  const result = UserListSchema.parse(data);
  const user = result.items[0];

  if (!user) {
    throw new Error("User not found");
  }

  return user;
}
