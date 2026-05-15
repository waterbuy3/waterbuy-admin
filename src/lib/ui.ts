import { useEffect, useState } from "react";

/* ─── Debounce hook ─────────────────────────────────────────────────────────── */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/* ─── Formatters ────────────────────────────────────────────────────────────── */
export const formatINR = (n: number | string | null | undefined): string => {
  const num = typeof n === "string" ? Number(n) : (n ?? 0);
  if (!isFinite(num)) return "₹0";
  return `₹${num.toLocaleString("en-IN")}`;
};

export const formatLitres = (n: number | null | undefined): string =>
  `${(n ?? 0).toLocaleString("en-IN")}L`;

export const formatDate = (s?: string | null): string => {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
    });
  } catch { return "—"; }
};

export const formatDateTime = (s?: string | null): string => {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return "—"; }
};

/* ─── Order status colour map (shared across pages) ─────────────────────────── */
export const ORDER_STATUS_COLOR: Record<string, string> = {
  pending:    "bg-amber-100 text-amber-700 border-amber-200",
  confirmed:  "bg-blue-100 text-blue-700 border-blue-200",
  in_transit: "bg-violet-100 text-violet-700 border-violet-200",
  delivered:  "bg-emerald-100 text-emerald-700 border-emerald-200",
  cancelled:  "bg-red-100 text-red-600 border-red-200",
  paused:     "bg-amber-100 text-amber-700 border-amber-200",
  active:     "bg-emerald-100 text-emerald-700 border-emerald-200",
};

export const statusLabel = (s: string): string =>
  s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
