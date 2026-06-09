import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Precise, consistent timestamp for admin order views: date + time to the
 * second in the viewer's local timezone, e.g. "Jun 9, 2026, 3:45:12 PM".
 */
export function formatDateTime(date: Date | string | number): string {
  return new Date(date).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}
