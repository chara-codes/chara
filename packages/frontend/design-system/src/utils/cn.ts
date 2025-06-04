import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines multiple class names and applies Tailwind's merge strategy
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
