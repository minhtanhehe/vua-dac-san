import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as Vietnamese Dong (VND) currency string.
 * @param {number} value - The numeric value to format.
 * @returns {string} Formatted currency string, e.g. "150.000 ₫"
 */
export const formatVND = (value) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
