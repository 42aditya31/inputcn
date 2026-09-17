/**
 * Percentage maths. Framework-free.
 *
 * Canonical value is a FRACTION: 0.125, not 12.5. The display is the
 * percentage; the value is what you multiply by. This is the off-by-100 bug
 * solved once — every codebase has shipped it at least once, usually in a
 * discount calculation.
 */

import { parseLooseNumber, scrub } from "@inputcn/core/paste"

export interface PercentFormatOptions {
  locale?: string
  /** Decimal places shown. Default 2, trailing zeros trimmed. */
  precision?: number
}

const formatterCache = new Map<string, Intl.NumberFormat>()

/** Fraction → the percentage string the user sees. `0.125` → `"12.5"`. */
export function formatPercent(
  fraction: number,
  { locale = "en-US", precision = 2 }: PercentFormatOptions = {},
): string {
  if (!Number.isFinite(fraction)) return ""
  const key = `${locale}|${precision}`
  let fmt = formatterCache.get(key)
  if (!fmt) {
    fmt = new Intl.NumberFormat(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: precision,
    })
    formatterCache.set(key, fmt)
  }
  return fmt.format(round(fraction * 100, precision))
}

/** Percentage string → fraction. `"12.5"` → `0.125`. */
export function parsePercent(
  text: string,
  { precision = 2 }: PercentFormatOptions = {},
): number {
  const n = parseLooseNumber(text.replace("%", ""))
  if (n === null) return 0
  // Divide first, then round at the fraction's own scale, so 33.33% does not
  // come back as 0.3332999999999.
  return round(n / 100, precision + 2)
}

/**
 * Round to a fixed number of decimals without the float drift that
 * `toFixed` + `parseFloat` reintroduces at the boundaries.
 */
export function round(value: number, decimals: number): number {
  const f = 10 ** decimals
  return Math.round((value + Number.EPSILON) * f) / f
}

/** True when the fraction has no more than `precision` decimals as a percent. */
export function withinPrecision(fraction: number, precision: number): boolean {
  const asPercent = fraction * 100
  return Math.abs(round(asPercent, precision) - asPercent) < 1e-9
}

/**
 * Smart paste. Handles `"12.5%"`, `"12,5 %"`, `"0.125"` — but NOT by guessing:
 * a bare value ≤ 1 with a decimal point is ambiguous between "0.125 as a
 * fraction" and "0.125 percent", so we always read the number as a PERCENTAGE
 * unless a fraction is explicitly requested. Consistency beats cleverness here,
 * because the wrong guess silently produces a 100× error.
 */
export function parsePastedPercent(
  input: string,
  options: PercentFormatOptions & { asFraction?: boolean } = {},
): number | null {
  const text = scrub(input)
  if (!text) return null
  const n = parseLooseNumber(text.replace("%", ""))
  if (n === null) return null
  return options.asFraction
    ? round(n, (options.precision ?? 2) + 2)
    : round(n / 100, (options.precision ?? 2) + 2)
}
