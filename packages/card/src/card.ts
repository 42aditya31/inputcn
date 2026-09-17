/**
 * Payment card parsing and validation. Framework-free.
 *
 * Canonical value is the digits only: `"4242424242424242"`.
 *
 * Scope note: this validates STRUCTURE — brand, length, Luhn checksum, expiry.
 * It cannot tell you whether a card has funds or even exists; only your PSP
 * can. The point is to catch the typo before the user watches a spinner and
 * gets a decline.
 */

import { digitsOf, scrub } from "@inputcn/core/paste"

export type CardBrand =
  | "visa"
  | "mastercard"
  | "amex"
  | "discover"
  | "diners"
  | "jcb"
  | "unionpay"
  | "maestro"

export interface BrandSpec {
  brand: CardBrand
  label: string
  /** Digit groups for display, e.g. Amex is 4-6-5. */
  gaps: readonly number[]
  /** Accepted total lengths. */
  lengths: readonly number[]
  cvcLength: number
  test: RegExp
}

// Hoisted — matched on every keystroke.
export const BRANDS: readonly BrandSpec[] = [
  { brand: "visa", label: "Visa", gaps: [4, 4, 4, 4], lengths: [16, 18, 19], cvcLength: 3, test: /^4/ },
  { brand: "mastercard", label: "Mastercard", gaps: [4, 4, 4, 4], lengths: [16], cvcLength: 3, test: /^(5[1-5]|2[2-7])/ },
  { brand: "amex", label: "American Express", gaps: [4, 6, 5], lengths: [15], cvcLength: 4, test: /^3[47]/ },
  { brand: "diners", label: "Diners Club", gaps: [4, 6, 4], lengths: [14, 16, 19], cvcLength: 3, test: /^3(?:0[0-5]|[68])/ },
  { brand: "discover", label: "Discover", gaps: [4, 4, 4, 4], lengths: [16, 19], cvcLength: 3, test: /^6(?:011|5|4[4-9])/ },
  { brand: "jcb", label: "JCB", gaps: [4, 4, 4, 4], lengths: [16, 17, 18, 19], cvcLength: 3, test: /^35(?:2[89]|[3-8])/ },
  { brand: "unionpay", label: "UnionPay", gaps: [4, 4, 4, 4], lengths: [16, 17, 18, 19], cvcLength: 3, test: /^62/ },
  { brand: "maestro", label: "Maestro", gaps: [4, 4, 4, 4], lengths: [12, 13, 14, 15, 16, 17, 18, 19], cvcLength: 3, test: /^(5018|5020|5038|6304|6759|676[1-3])/ },
]

/** Fallback used while the number is too short to identify. */
export const UNKNOWN_BRAND: BrandSpec = {
  brand: "visa", // never surfaced; only its layout is used
  label: "",
  gaps: [4, 4, 4, 4],
  lengths: [16],
  cvcLength: 3,
  test: /^$/,
}

const BY_BRAND = new Map(BRANDS.map((b) => [b.brand, b]))

export function brandSpec(brand: CardBrand): BrandSpec | undefined {
  return BY_BRAND.get(brand)
}

/** Identify the brand from a partial number. `undefined` until determinable. */
export function detectBrand(digits: string): BrandSpec | undefined {
  if (!digits) return undefined
  // Maestro's ranges overlap Mastercard's, so it is tested first.
  for (const b of BRANDS) {
    if (b.test.test(digits)) return b
  }
  return undefined
}

/** Longest number this brand can hold. */
export function maxLengthOf(spec: BrandSpec | undefined): number {
  const s = spec ?? UNKNOWN_BRAND
  let n = 0
  for (const l of s.lengths) if (l > n) n = l
  return n
}

/**
 * Luhn checksum. Catches single-digit typos and most transpositions — which is
 * the overwhelming majority of what users actually get wrong.
 */
export function luhn(digits: string): boolean {
  if (digits.length < 12) return false
  let sum = 0
  let alternate = false
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = digits.charCodeAt(i) - 48
    if (n < 0 || n > 9) return false
    if (alternate) {
      n *= 2
      if (n > 9) n -= 9
    }
    sum += n
    alternate = !alternate
  }
  return sum % 10 === 0
}

/** True when the length is one this brand accepts. */
export function isValidLength(digits: string, spec: BrandSpec | undefined): boolean {
  return (spec ?? UNKNOWN_BRAND).lengths.includes(digits.length)
}

/** Format for display using the brand's own grouping. */
export function formatCard(digits: string, spec: BrandSpec | undefined): string {
  const s = spec ?? UNKNOWN_BRAND
  const capped = digits.slice(0, maxLengthOf(s))
  if (!capped) return ""

  const out: string[] = []
  let i = 0
  for (const gap of s.gaps) {
    if (i >= capped.length) break
    out.push(capped.slice(i, i + gap))
    i += gap
  }
  // Anything past the declared groups (19-digit Visa) trails in fours.
  while (i < capped.length) {
    out.push(capped.slice(i, i + 4))
    i += 4
  }
  return out.join(" ")
}

/* ------------------------------------------------------------------ *
 * Expiry
 * ------------------------------------------------------------------ */

export interface Expiry {
  month: number
  year: number
  /** Four-digit year. */
  fullYear: number
}

/** Parse `"0428"`, `"04/28"`, `"04 / 2028"` into month and year. */
export function parseExpiry(input: string): Expiry | null {
  const d = digitsOf(input)
  if (d.length < 3) return null

  const month = Number(d.slice(0, 2))
  if (month < 1 || month > 12) return null

  const yearDigits = d.slice(2, 6)
  const year = Number(yearDigits)
  if (!Number.isFinite(year)) return null

  // A two-digit year is this century; four digits are taken literally.
  const fullYear = yearDigits.length <= 2 ? 2000 + year : year
  return { month, year, fullYear }
}

export function formatExpiry(input: string): string {
  const d = digitsOf(input).slice(0, 4)
  if (d.length <= 2) return d
  return `${d.slice(0, 2)} / ${d.slice(2)}`
}

/**
 * True when the card has not expired.
 * A card is valid through the LAST day of its stated month, so the comparison
 * is against the first day of the following month.
 */
export function isExpired(expiry: Expiry | null, now = new Date()): boolean {
  if (!expiry) return false
  const expiresAfter = new Date(expiry.fullYear, expiry.month, 1)
  return now.getTime() >= expiresAfter.getTime()
}

/* ------------------------------------------------------------------ *
 * Paste
 * ------------------------------------------------------------------ */

/** Extract a card number from pasted text, however it was punctuated. */
export function parsePastedCard(input: string): string {
  return digitsOf(scrub(input)).slice(0, 19)
}
