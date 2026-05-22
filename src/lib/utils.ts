import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility for merging Tailwind classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Currency formatter (Localized for SaaS)
 */
export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * Compact Currency formatter (e.g. $ 1M, $ 280K)
 */
export const formatCompactCurrency = (value: number) => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 1,
    notation: "compact",
    compactDisplay: "short"
  }).format(value);
};

/**
 * Formats a numeric string with thousands dots (es-CO)
 */
export const formatNumberWithDots = (val: string | number) => {
  if (val === "" || val === undefined || val === null) return "";
  const num = typeof val === "string" ? val.replace(/\D/g, "") : val.toString();
  if (isNaN(Number(num))) return "";
  return new Intl.NumberFormat("es-CO").format(Number(num));
};

/**
 * Removes non-numeric characters from a string
 */
export const parseNumericString = (val: string): number => {
  const clean = val.replace(/\D/g, "");
  return clean === "" ? 0 : Number(clean);
};
/**
 * Parses a YYYY-MM-DD string into a local Date object without timezone shifts
 */
export const parseLocalDate = (dateStr: string) => {
  if (!dateStr) return new Date();
  // Extraer solo la parte YYYY-MM-DD en caso de que venga con tiempo (ISO)
  const cleanDate = dateStr.split('T')[0];
  const [y, m, d] = cleanDate.split('-').map(Number);
  
  if (isNaN(y) || isNaN(m) || isNaN(d)) return new Date();
  
  return new Date(y, m - 1, d);
};
