import type { CategoryResponse } from "@/types/categoryTypes";
import clsx from "clsx";

type CategoryFilterProps = {
  categories: CategoryResponse[];
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string | null) => void;
};

export function CategoryFilter({
  categories,
  selectedCategoryId,
  onSelectCategory,
}: CategoryFilterProps) {
  const hasCategories = categories.length > 0;

  return (
    <label className="flex w-1/2 flex-col gap-2">
      <select
        className={clsx(
          "w-full rounded-full border border-neutral-200 bg-white/90 px-4 py-3 text-sm font-medium text-neutral-800 shadow-sm transition focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200/80 dark:border-white/10 dark:bg-neutral-900/70 dark:text-neutral-100 dark:focus:border-amber-300 dark:focus:ring-amber-300/40",
          !hasCategories && "cursor-not-allowed opacity-70",
        )}
        value={selectedCategoryId ?? ""}
        onChange={(event) => {
          const value = event.target.value;
          onSelectCategory(value === "" ? null : value);
        }}
        disabled={!hasCategories}
      >
        <option value="">All categories</option>
        {categories.map((category) => (
          <option key={category.category_id} value={category.category_id}>
            {category.category_name}
          </option>
        ))}
      </select>
      {!hasCategories && (
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          No categories available yet.
        </span>
      )}
    </label>
  );
}
