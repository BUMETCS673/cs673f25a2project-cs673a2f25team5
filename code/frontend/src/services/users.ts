import { z } from "zod";

import { API_BASE_URL } from "./config";

export const UserSchema = z.object({
  user_id: z.string().uuid(),
  first_name: z.string(),
  last_name: z.string(),
  email: z.string().email(),
  date_of_birth: z.string(),
  color: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type UserResponse = z.infer<typeof UserSchema>;

const UserListSchema = z.object({
  items: z.array(UserSchema),
  total: z.number().int().nonnegative(),
  offset: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
});

export async function getUser(id: string): Promise<UserResponse> {
  const userId = z.string().uuid().parse(id);
  const url = new URL("/users", API_BASE_URL);
  url.searchParams.append("filter", `user_id:eq:${userId}`);
  url.searchParams.set("limit", "1");

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
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
