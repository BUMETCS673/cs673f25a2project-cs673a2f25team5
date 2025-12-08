import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines and merges Tailwind CSS class names.
 * Accepts any number of class values (strings, arrays, objects) and returns a single merged string.
 * Uses `clsx` for conditional class logic and `tailwind-merge` to resolve Tailwind conflicts.
 *
 * @param {...ClassValue[]} inputs - Class values to combine (strings, arrays, objects).
 * @returns {string} Merged class names string.
 */

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
