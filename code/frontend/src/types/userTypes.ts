/*

 AI-generated code: 40% (tool: Codex - GPT-5, UserSchema, UserResponse, UserListSchema, UserListResponse) 

 Human code: 60% (functions: UserSchema, UserResponse, UserListSchema, UserListResponse, GetUsersParams) 

 No framework-generated code.

*/

import { z } from "zod";

export const UserSchema = z.object({
  user_id: z.uuid(),
  first_name: z.string(),
  last_name: z.string(),
  email: z.email(),
  date_of_birth: z.string(),
  color: z.string().nullable().optional(),
  profile_picture_url: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type UserResponse = z.infer<typeof UserSchema>;

export const UserListSchema = z.object({
  items: z.array(UserSchema),
  total: z.number().int().nonnegative(),
  offset: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
});

export type UserListResponse = z.infer<typeof UserListSchema>;

export type GetUsersParams = {
  filters?: string[];
  offset?: number;
  limit?: number;
  signal?: AbortSignal;
};
