import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Plan, PlanLimits } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  COP: "$",
  BOB: "Bs ",
  USD: "USD ",
  PEN: "S/ ",
  MXN: "$",
  ARS: "$",
}

export function formatPrice(price: number, currency = "COP"): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? "$"
  return `${symbol}${price.toLocaleString("es-CO", { maximumFractionDigits: 2 })}`
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleDateString("es-BO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleString("es-BO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  LITE: { products: 25, label: "Lite" },
  PRO: { products: 500, label: "Pro" },
}

export function remainingSlots(plan: Plan, currentProducts: number): number {
  return Math.max(0, PLAN_LIMITS[plan].products - currentProducts)
}
