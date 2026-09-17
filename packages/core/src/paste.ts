/**
 * Clipboard hygiene and smart-paste primitives. PRD §11.2.
 *
 * Two jobs:
 *   1. Scrub what people actually have on their clipboard. Text copied from
 *      Word, Notion or Google Docs carries zero-width spaces, non-breaking
 *      spaces and smart quotes that silently break naive parsers.
 *   2. Extract a usable value from a human sentence, not just a clean token.
 */

// Hoisted: these run on every paste and must never be rebuilt per call.
const INVISIBLE_RE = /[​-‍⁠﻿­]/g
const NBSP_RE = /[   ]/g
const SMART_QUOTE_RE = /[‘’‚‛′]/g
const SMART_DQUOTE_RE = /[“”„‟″]/g
const DASH_RE = /[‐-―−]/g
const WS_RUN_RE = /\s{2,}/g

/**
 * Normalise pasted text before any parsing.
 * Idempotent, and safe to run on typed input too.
 */
export function scrub(input: string): string {
  return input
    .replace(INVISIBLE_RE, "")
    .replace(NBSP_RE, " ")
    .replace(SMART_QUOTE_RE, "'")
    .replace(SMART_DQUOTE_RE, '"')
    .replace(DASH_RE, "-")
    .replace(WS_RUN_RE, " ")
    .trim()
}

/** Every digit in the string, in order. */
export function digitsOf(input: string): string {
  let out = ""
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i)
    if (c >= 48 && c <= 57) out += input[i]
  }
  return out
}

const EXT_RE = /(?:ext|x|extension|poste)\.?\s*:?\s*(\d{1,6})\s*$/i

/**
 * Split a trailing extension off a phone-ish string.
 * "(415) 555-2671 ext 4" → { base: "(415) 555-2671", extension: "4" }
 */
export function splitExtension(input: string): {
  base: string
  extension?: string
} {
  const m = EXT_RE.exec(input)
  if (!m) return { base: input }
  return { base: input.slice(0, m.index).trim(), extension: m[1] }
}

/**
 * Decide which separator convention a number string uses, then return a
 * plain JS-parseable numeric string.
 *
 * The ambiguity that matters: "1.234" is one thousand two hundred thirty-four
 * in de-DE and one-point-two-three-four in en-US. We resolve it by structure
 * rather than by assuming a locale:
 *   - if both separators appear, the LAST one is the decimal separator
 *   - if only one appears and it splits exactly 3 trailing digits and there
 *     is more than one group, it is a thousands separator
 *   - otherwise it is a decimal separator
 */
export function parseLooseNumber(input: string): number | null {
  const s = scrub(input).replace(/[^\d.,\-+]/g, "")
  if (!s || !/\d/.test(s)) return null

  const negative = /^-/.test(s) || /\(.*\)/.test(input)
  const body = s.replace(/[-+]/g, "")

  const lastDot = body.lastIndexOf(".")
  const lastComma = body.lastIndexOf(",")

  let normalised: string
  if (lastDot !== -1 && lastComma !== -1) {
    const decimalAt = Math.max(lastDot, lastComma)
    const intPart = body.slice(0, decimalAt).replace(/[.,]/g, "")
    const fracPart = body.slice(decimalAt + 1).replace(/[.,]/g, "")
    normalised = `${intPart}.${fracPart}`
  } else if (lastDot !== -1 || lastComma !== -1) {
    const sep = lastDot !== -1 ? "." : ","
    const at = lastDot !== -1 ? lastDot : lastComma
    const groups = body.split(sep)
    const tail = body.slice(at + 1)
    const isThousands = tail.length === 3 && groups.length > 1 && groups[0]!.length <= 3
    normalised = isThousands
      ? body.replace(/[.,]/g, "")
      : `${body.slice(0, at).replace(/[.,]/g, "")}.${tail}`
  } else {
    normalised = body
  }

  const n = Number.parseFloat(normalised)
  if (!Number.isFinite(n)) return null
  return negative ? -n : n
}

const CURRENCY_SYMBOLS: ReadonlyArray<readonly [RegExp, string]> = [
  [/\bUSD\b|\$(?!\s*[A-Z])/i, "USD"],
  [/\bEUR\b|€/i, "EUR"],
  [/\bGBP\b|£/i, "GBP"],
  [/\bINR\b|₹/i, "INR"],
  [/\bJPY\b|¥/i, "JPY"],
  [/\bBRL\b|R\$/i, "BRL"],
  [/\bAUD\b|A\$/i, "AUD"],
  [/\bCAD\b|C\$/i, "CAD"],
]

/** Detect an ISO currency code from pasted text, if one is unambiguous. */
export function detectCurrency(input: string): string | null {
  for (const [re, code] of CURRENCY_SYMBOLS) {
    if (re.test(input)) return code
  }
  return null
}

/** Split pasted text into trimmed, de-duplicated, non-empty items. */
export function splitList(input: string, extra: readonly string[] = []): string[] {
  const seps = [",", "\n", "\t", ";", ...extra]
  let parts = [scrub(input)]
  for (const sep of seps) {
    parts = parts.flatMap((p) => p.split(sep))
  }
  const seen = new Set<string>()
  const out: string[] = []
  for (const p of parts) {
    const t = p.trim()
    if (t && !seen.has(t)) {
      seen.add(t)
      out.push(t)
    }
  }
  return out
}

/** Read text from a paste event across browsers. */
export function clipboardText(e: {
  clipboardData?: DataTransfer | null
}): string {
  return e.clipboardData?.getData("text") ?? ""
}
