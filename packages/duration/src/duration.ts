/**
 * Duration parsing and formatting. Framework-free.
 *
 * Canonical value is SECONDS as an integer.
 *
 * No substrate library exists for this — everyone writes their own regex and
 * disagrees about what a bare number means. The rule here is explicit and
 * documented: a bare number is MINUTES, because "timeout: 30" overwhelmingly
 * means half an hour rather than half a minute. Configurable, never guessed.
 */

import { scrub } from "@inputcn/core/paste"

export type DurationUnit = "d" | "h" | "m" | "s"

export const UNIT_SECONDS: Readonly<Record<DurationUnit, number>> = {
  d: 86_400,
  h: 3_600,
  m: 60,
  s: 1,
}

/** Longest-first so "min" is matched before "m". */
const UNIT_WORDS: ReadonlyArray<readonly [RegExp, DurationUnit]> = [
  [/^(days?|d)$/i, "d"],
  [/^(hours?|hrs?|h)$/i, "h"],
  [/^(minutes?|mins?|m)$/i, "m"],
  [/^(seconds?|secs?|s)$/i, "s"],
]

// Hoisted: these run on every keystroke.
const CLOCK_RE = /^(\d+):(\d{1,2})(?::(\d{1,2}))?$/
const TOKEN_RE = /(\d+(?:[.,]\d+)?)\s*([a-z]*)/gi

function unitOf(word: string, fallback: DurationUnit): DurationUnit {
  if (!word) return fallback
  for (const [re, unit] of UNIT_WORDS) {
    if (re.test(word)) return unit
  }
  return fallback
}

export interface ParseDurationOptions {
  /** What a bare number means. Default `"m"`. */
  bareUnit?: DurationUnit
}

/**
 * Parse human duration text into seconds.
 *
 * Accepts `"2h 30m"`, `"2h30"`, `"150m"`, `"2:30"`, `"1.5h"`, `"90 minutes"`.
 * Returns 0 for anything unparseable rather than NaN, so callers never have to
 * guard arithmetic.
 */
export function parseDuration(
  input: string,
  { bareUnit = "m" }: ParseDurationOptions = {},
): number {
  const text = scrub(input).toLowerCase()
  if (!text) return 0

  // Clock notation is unambiguous and must be handled before token scanning,
  // which would otherwise read "2:30" as two separate bare numbers.
  const clock = CLOCK_RE.exec(text)
  if (clock) {
    const h = Number(clock[1])
    const m = Number(clock[2])
    const s = clock[3] === undefined ? 0 : Number(clock[3])
    return h * 3600 + m * 60 + s
  }

  let total = 0
  let matched = false
  // Reset: TOKEN_RE is /g and carries lastIndex between calls.
  TOKEN_RE.lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = TOKEN_RE.exec(text)) !== null) {
    const n = Number.parseFloat(m[1]!.replace(",", "."))
    if (!Number.isFinite(n)) continue
    matched = true
    total += n * UNIT_SECONDS[unitOf(m[2] ?? "", bareUnit)]
  }

  return matched ? Math.round(total) : 0
}

export interface FormatDurationOptions {
  /** Largest unit to use. Default `"d"`. */
  maxUnit?: DurationUnit
  /** Show at most this many units. Default 2 — "1h 30m", not "1h 30m 0s". */
  maxParts?: number
  /** Text for a zero duration. Default `""`. */
  zero?: string
}

const ORDER: readonly DurationUnit[] = ["d", "h", "m", "s"]

/** Seconds → compact human text. `5400` → `"1h 30m"`. */
export function formatDuration(
  seconds: number,
  { maxUnit = "d", maxParts = 2, zero = "" }: FormatDurationOptions = {},
): string {
  if (!Number.isFinite(seconds) || seconds === 0) return zero

  const negative = seconds < 0
  let rest = Math.abs(Math.round(seconds))
  const startAt = ORDER.indexOf(maxUnit)
  const parts: string[] = []

  for (let i = startAt; i < ORDER.length; i++) {
    const unit = ORDER[i]!
    const size = UNIT_SECONDS[unit]
    const n = Math.floor(rest / size)
    if (n > 0) {
      parts.push(`${n}${unit}`)
      rest -= n * size
    }
    if (parts.length >= maxParts) break
  }

  if (parts.length === 0) return zero
  return (negative ? "-" : "") + parts.join(" ")
}

/** Seconds → ISO 8601 duration. `5400` → `"PT1H30M"`. */
export function toISO8601(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds === 0) return "PT0S"
  let rest = Math.abs(Math.round(seconds))

  const d = Math.floor(rest / 86_400)
  rest -= d * 86_400
  const h = Math.floor(rest / 3_600)
  rest -= h * 3_600
  const m = Math.floor(rest / 60)
  const s = rest - m * 60

  const time = [h && `${h}H`, m && `${m}M`, s && `${s}S`].filter(Boolean).join("")
  const date = d ? `${d}D` : ""
  // "PT0S" is the canonical zero; a bare "P" is not valid.
  return `P${date}${time ? `T${time}` : d ? "" : "T0S"}`
}

/** Split seconds into whole hours, minutes and seconds for a segmented UI. */
export function toSegments(seconds: number): { h: number; m: number; s: number } {
  const total = Math.max(0, Math.round(seconds))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  return { h, m, s: total % 60 }
}

export function fromSegments(h: number, m: number, s: number): number {
  return Math.max(0, h) * 3600 + Math.max(0, m) * 60 + Math.max(0, s)
}

/** Smart paste — the same parser, since it is already tolerant by design. */
export function parsePastedDuration(
  input: string,
  options?: ParseDurationOptions,
): number | null {
  const text = scrub(input)
  if (!text || !/\d/.test(text)) return null
  return parseDuration(text, options)
}
