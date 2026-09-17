/**
 * Money maths and formatting. Framework-free.
 *
 * The canonical value is an INTEGER COUNT OF MINOR UNITS — 123450 is $1,234.50.
 * No float ever touches a price. This is the single most important decision in
 * the component: `0.1 + 0.2 !== 0.3` has cost real companies real money, and a
 * currency input that emits a float invites exactly that bug downstream.
 *
 * Zero-decimal currencies (JPY, KRW) fall out for free because the minor-unit
 * factor comes from Intl rather than a hardcoded 100.
 */

import { detectCurrency, parseLooseNumber, scrub } from "@inputcn/core/paste"

/** Cached formatters — constructing Intl.NumberFormat is expensive. */
const formatterCache = new Map<string, Intl.NumberFormat>()
const fractionCache = new Map<string, number>()

function key(locale: string, currency: string, opts = ""): string {
  return `${locale}|${currency}|${opts}`
}

/** Decimal places this currency uses. JPY → 0, USD → 2, KWD → 3. */
export function fractionDigits(currency: string, locale = "en-US"): number {
  const k = key(locale, currency)
  const hit = fractionCache.get(k)
  if (hit !== undefined) return hit

  let digits = 2
  try {
    digits =
      new Intl.NumberFormat(locale, { style: "currency", currency })
        .resolvedOptions().maximumFractionDigits ?? 2
  } catch {
    // Unknown currency code — fall back to the 2-decimal majority.
  }
  fractionCache.set(k, digits)
  return digits
}

/** 10 ** fractionDigits. 100 for USD, 1 for JPY. */
export function minorUnitFactor(currency: string, locale = "en-US"): number {
  return 10 ** fractionDigits(currency, locale)
}

export interface FormatOptions {
  locale?: string
  /** Render the currency symbol. Off by default — the UI shows it as an affix. */
  withSymbol?: boolean
  /** Force a sign for positive values. */
  signDisplay?: Intl.NumberFormatOptions["signDisplay"]
}

/** Minor units → the string the user sees. */
export function formatMinor(
  minor: number,
  currency: string,
  { locale = "en-US", withSymbol = false, signDisplay }: FormatOptions = {},
): string {
  const digits = fractionDigits(currency, locale)
  const k = key(locale, currency, `${withSymbol}|${signDisplay ?? ""}`)

  let fmt = formatterCache.get(k)
  if (!fmt) {
    fmt = new Intl.NumberFormat(locale, {
      ...(withSymbol ? { style: "currency", currency } : {}),
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
      ...(signDisplay ? { signDisplay } : {}),
    })
    formatterCache.set(k, fmt)
  }
  return fmt.format(minor / 10 ** digits)
}

/** The currency symbol for a locale, e.g. "$", "£", "R$". */
export function currencySymbol(currency: string, locale = "en-US"): string {
  try {
    const parts = new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
    }).formatToParts(0)
    return parts.find((p) => p.type === "currency")?.value ?? currency
  } catch {
    return currency
  }
}

/**
 * Append a typed digit, register-style: the value fills from the right.
 *
 * This is why CurrencyInput cannot drift its caret — the caret never moves,
 * because the user is not editing a string, they are pushing digits onto a
 * number. Typing 1, 2, 3 gives 0.01 → 0.12 → 1.23.
 */
export function pushDigit(minor: number, digit: number, max = 1e12): number {
  const sign = minor < 0 ? -1 : 1
  const next = Math.abs(minor) * 10 + digit
  return next > max ? minor : sign * next
}

/** Remove the right-most digit. */
export function popDigit(minor: number): number {
  const sign = minor < 0 ? -1 : 1
  return sign * Math.floor(Math.abs(minor) / 10)
}

/** Flip the sign. */
export function negate(minor: number): number {
  return minor === 0 ? 0 : -minor
}

/** Whole currency units → minor units, rounded correctly. */
export function toMinor(major: number, currency: string, locale = "en-US"): number {
  return Math.round(major * minorUnitFactor(currency, locale))
}

/** Minor units → whole currency units. Lossy by nature — display only. */
export function toMajor(minor: number, currency: string, locale = "en-US"): number {
  return minor / minorUnitFactor(currency, locale)
}

export interface PastedMoney {
  minor: number | null
  /** Set when the pasted text named a different currency. */
  switchedTo?: string
}

/**
 * Smart paste. PRD §11.2.
 *
 * "$1,234.50 USD" → 123450 and a currency switch.
 * "1.234,50"      → 123450, detecting the German convention by structure
 *                   rather than assuming the caller's locale.
 */
export function parsePastedMoney(
  input: string,
  currency: string,
  locale = "en-US",
): PastedMoney {
  const text = scrub(input)
  if (!text) return { minor: null }

  const detected = detectCurrency(text)
  const target = detected ?? currency

  const major = parseLooseNumber(text)
  if (major === null) return { minor: null }

  return {
    minor: toMinor(major, target, locale),
    ...(detected && detected !== currency ? { switchedTo: detected } : {}),
  }
}
