import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility for merging Tailwind classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const currencyFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const compactCurrencyFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 1,
  notation: "compact",
  compactDisplay: "short"
});

const numberFormatter = new Intl.NumberFormat("es-CO");

/**
 * Currency formatter (Localized for SaaS)
 */
export const formatCurrency = (value: number) => {
  return currencyFormatter.format(value);
};

/**
 * Compact Currency formatter (e.g. $ 1M, $ 280K)
 */
export const formatCompactCurrency = (value: number) => {
  return compactCurrencyFormatter.format(value);
};

/**
 * Formats a numeric string with thousands dots (es-CO)
 */
export const formatNumberWithDots = (val: string | number) => {
  if (val === "" || val === undefined || val === null) return "";
  const num = typeof val === "string" ? val.replace(/\D/g, "") : val.toString();
  if (isNaN(Number(num))) return "";
  return numberFormatter.format(Number(num));
};

/**
 * Removes non-numeric characters from a string
 */
export const parseNumericString = (val: string): number => {
  const clean = val.replace(/\D/g, "");
  return clean === "" ? 0 : Number(clean);
};

const dateCache = new Map<string, Date>();

/**
 * Parses a YYYY-MM-DD string into a local Date object without timezone shifts
 */
export const parseLocalDate = (dateStr: string) => {
  if (!dateStr) return new Date();
  
  if (dateCache.has(dateStr)) {
    return dateCache.get(dateStr)!;
  }

  // Extraer solo la parte YYYY-MM-DD en caso de que venga con tiempo (ISO o con espacio)
  const cleanDate = dateStr.split(/[T ]/)[0];
  const [y, m, d] = cleanDate.split('-').map(Number);
  
  if (isNaN(y) || isNaN(m) || isNaN(d)) return new Date();
  
  const result = new Date(y, m - 1, d);
  
  // Limitar el tamaño del caché a 1000 fechas (cubre ~3 años de uso diario)
  if (dateCache.size > 1000) {
    const firstKey = dateCache.keys().next().value;
    if (firstKey) dateCache.delete(firstKey);
  }
  
  dateCache.set(dateStr, result);
  return result;
};
