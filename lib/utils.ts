import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normalizes a keyword to lowercase for consistent storage and querying
 * This ensures "Budget App" and "budget app" are treated as the same keyword
 */
export function normalizeKeyword(keyword: string): string {
  return keyword.trim().toLowerCase()
}
