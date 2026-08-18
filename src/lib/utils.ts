import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a number as Nigerian Naira currency.
 */
export function formatCurrency(amount: number): string {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '₦0.00';
  }

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
  }).format(Math.max(0, amount));
}

/**
 * Clamp a number between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(min) || !Number.isFinite(max)) {
    return min;
  }
  if (min > max) {
    throw new Error('min cannot be greater than max');
  }
  return Math.min(Math.max(value, min), max);
}

/**
 * Truncate a string to a given length with an ellipsis.
 */
export function truncate(str: string, maxLength: number): string {
  if (typeof str !== 'string' || maxLength < 0) {
    return '';
  }
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength).trimEnd() + "…";
}
