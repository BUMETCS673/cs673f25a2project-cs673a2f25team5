/*

 AI-generated code: 0%

 Human code: 100% (getCategories)

 No framework-generated code.

*/

"use server";

import { API_BASE_URL } from "./config";
import { auth } from "@clerk/nextjs/server";
import {
  CategoryListResponse,
  CategoryListSchema,
} from "../types/categoryTypes";

export async function getCategories(
  params?: GetCategoriesParams,
): Promise<CategoryListResponse> {
  const { filters, offset, limit } = params ?? {};
  const url = new URL("/categories", API_BASE_URL);

  for (const filter of filters ?? []) {
    url.searchParams.append("filter_expression", filter);
  }

  if (typeof offset === "number") {
    url.searchParams.set("offset", offset.toString());
  }

  if (typeof limit === "number") {
    url.searchParams.set("limit", limit.toString());
  }

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
  return CategoryListSchema.parse(data);
}

type GetCategoriesParams = {
  filters?: string[];
  offset?: number;
  limit?: number;
};
