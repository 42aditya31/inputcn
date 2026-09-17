/**
 * File size parsing and formatting. Framework-free.
 *
 * Canonical value is BYTES as an integer.
 *
 * The distinction that matters and that everyone gets wrong: `MB` is 1000²,
 * `MiB` is 1024². They differ by 4.9% at mega and 7.4% at giga, which is the
 * gap between "100 MB upload limit" and a user's file being rejected. This
 * module keeps them separate and never silently converts one to the other.
 */

import { scrub } from "@inputcn/core/paste"

export type Unit = "B" | "KB" | "MB" | "GB" | "TB" | "PB"
export type BinaryUnit = "B" | "KiB" | "MiB" | "GiB" | "TiB" | "PiB"

export const DECIMAL_UNITS: readonly Unit[] = ["B", "KB", "MB", "GB", "TB", "PB"]
export const BINARY_UNITS: readonly BinaryUnit[] = ["B", "KiB", "MiB", "GiB", "TiB", "PiB"]

/** Multiplier per unit. Lowercase keys so lookup is case-insensitive. */
const FACTORS: ReadonlyMap<string, number> = new Map([
  ["b", 1], ["byte", 1], ["bytes", 1],
  ["k", 1e3], ["kb", 1e3], ["kilobyte", 1e3], ["kilobytes", 1e3],
  ["m", 1e6], ["mb", 1e6], ["megabyte", 1e6], ["megabytes", 1e6],
  ["g", 1e9], ["gb", 1e9], ["gigabyte", 1e9], ["gigabytes", 1e9],
  ["t", 1e12], ["tb", 1e12], ["terabyte", 1e12], ["terabytes", 1e12],
  ["p", 1e15], ["pb", 1e15],
  ["kib", 1024], ["mib", 1024 ** 2], ["gib", 1024 ** 3],
  ["tib", 1024 ** 4], ["pib", 1024 ** 5],
])

// Hoisted — runs on every keystroke.
const SIZE_RE = /^\s*([\d.,]+)\s*([a-z]*)\s*$/i

export interface ParseOptions {
  /** Unit assumed when none is written. Default "B". */
  bareUnit?: string
  /** Read ambiguous units (KB, MB…) as powers of 1024. Default false. */
  binary?: boolean
}

/**
 * Parse human size text into bytes.
 * Returns null — not 0 — when unparseable, so "invalid" and "zero bytes" stay
 * distinguishable.
 */
export function parseFileSize(
  input: string,
  { bareUnit = "B", binary = false }: ParseOptions = {},
): number | null {
  const text = scrub(input)
  if (!text) return null

  const m = SIZE_RE.exec(text)
  if (!m) return null

  const n = Number.parseFloat(m[1]!.replace(/,/g, ""))
  if (!Number.isFinite(n) || n < 0) return null

  const unit = (m[2] || bareUnit).toLowerCase()
  let factor = FACTORS.get(unit)
  if (factor === undefined) return null

  // In binary mode the ambiguous SI-looking units mean powers of 1024. The
  // explicitly binary ones (KiB…) are never reinterpreted.
  if (binary && !unit.includes("i") && factor > 1) {
    const power = Math.round(Math.log10(factor) / 3)
    factor = 1024 ** power
  }

  return Math.round(n * factor)
}

export interface FormatOptions {
  /** Use KiB/MiB/GiB. Default false. */
  binary?: boolean
  /** Significant decimals. Default 2, trailing zeros trimmed. */
  precision?: number
  /** Force a specific unit instead of picking the most readable one. */
  unit?: string
}

/** Bytes → the most readable human string. `26214400` → `"26.21 MB"`. */
export function formatFileSize(
  bytes: number,
  { binary = false, precision = 2, unit }: FormatOptions = {},
): string {
  if (!Number.isFinite(bytes) || bytes < 0) return ""
  if (bytes === 0) return "0 B"

  const base = binary ? 1024 : 1000
  const units = binary ? BINARY_UNITS : DECIMAL_UNITS

  let index: number
  if (unit) {
    const found = units.findIndex((u) => u.toLowerCase() === unit.toLowerCase())
    index = found === -1 ? 0 : found
  } else {
    index = Math.min(Math.floor(Math.log(bytes) / Math.log(base)), units.length - 1)
  }

  const value = bytes / base ** index
  // Bytes are never fractional; larger units keep the requested precision.
  const decimals = index === 0 ? 0 : precision
  const trimmed = Number.parseFloat(value.toFixed(decimals))
  return `${trimmed} ${units[index]}`
}

/** Cached grouping formatter for the raw byte readout. */
const groupers = new Map<string, Intl.NumberFormat>()

/**
 * Group a byte count for display.
 *
 * Takes an explicit locale rather than calling `toLocaleString()`, which
 * follows the host machine and would render 25000000 as "2,50,00,000" on an
 * en-IN system. A technical readout must not depend on where it is rendered.
 */
export function groupBytes(bytes: number, locale = "en-US"): string {
  let fmt = groupers.get(locale)
  if (!fmt) {
    fmt = new Intl.NumberFormat(locale, { useGrouping: true, maximumFractionDigits: 0 })
    groupers.set(locale, fmt)
  }
  return fmt.format(bytes)
}

/** Round-trip helper: is this text a size we understand? */
export function isValidFileSize(input: string, options?: ParseOptions): boolean {
  return parseFileSize(input, options) !== null
}

/** Smart paste — the same parser, since it is already tolerant. */
export function parsePastedFileSize(
  input: string,
  options?: ParseOptions,
): number | null {
  const text = scrub(input)
  if (!text) return null

  const direct = parseFileSize(text, options)
  if (direct !== null) return direct

  // Pull a size token out of a longer sentence: "Max upload: 25 MB".
  const token = /([\d.,]+)\s*([kmgtp]i?b|bytes?|[kmgtp])\b/i.exec(text)
  return token ? parseFileSize(token[0], options) : null
}
