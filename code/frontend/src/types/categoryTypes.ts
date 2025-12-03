/*

 AI-generated code: 0%
 
 Human code: 100% (CategorySchema, CategoryResponse, CategoryListSchema, CategoryListResponse)

 No framework-generated code.

*/

import { z } from "zod";

export const CategorySchema = z.object({
  category_id: z.uuid(),
  category_name: z.string(),
  description: z.string().nullable(),
});

export type CategoryResponse = z.infer<typeof CategorySchema>;

export const CategoryListSchema = z.object({
  items: z.array(CategorySchema),
  total: z.number().int().nonnegative(),
  offset: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
});

export type CategoryListResponse = z.infer<typeof CategoryListSchema>;
