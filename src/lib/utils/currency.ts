/**
 * currency.ts — Centralized Indian Rupee (INR) formatting utilities.
 *
 * Usage:
 *   formatINR(1234.5)      → "₹1,234.50"
 *   formatINR(0)           → "₹0.00"
 *   inrSymbol              → "₹"
 */

/** The ₹ symbol used for inline display. */
export const inrSymbol = "₹";

/**
 * Formats a number as an INR amount string.
 * Uses Indian locale (en-IN) for proper comma grouping (1,00,000).
 *
 * @param amount  - numeric amount in rupees
 * @param decimals - decimal places (default 2)
 * @returns formatted string like "₹1,50,000.00"
 */
export function formatINR(amount: number, decimals = 2): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

/**
 * Formats a rate per unit, e.g. "₹50.00/kg"
 */
export function formatINRRate(price: number, unit: string, decimals = 2): string {
  return `${formatINR(price, decimals)}/${unit}`;
}
