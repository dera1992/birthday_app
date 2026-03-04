import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount?: string | number | null, currency = "GBP") {
  if (amount === undefined || amount === null || amount === "") {
    return "Free";
  }

  const numeric = typeof amount === "string" ? Number(amount) : amount;
  if (Number.isNaN(numeric)) {
    return `${amount} ${currency}`;
  }

  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(numeric);
}

export function formatDate(date?: string | null) {
  if (!date) return "TBC";
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

export function initials(value?: string | null) {
  if (!value) return "BE";
  return value
    .split(" ")
    .map((chunk) => chunk[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
