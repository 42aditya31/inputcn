/**
 * Phone parsing, formatting and validation. Framework-free so it can run on
 * the server (`@inputcn/phone/phone`) and inside tests without React.
 *
 * Canonical value is always E.164: "+" followed by country code and national
 * significant number, no separators. The formatted string never escapes.
 */

import { digitsOf, scrub, splitExtension } from "@inputcn/core/paste"
import { formatMask } from "@inputcn/core/mask"

import { countryByDial, countryByIso, type Country } from "./countries.js"

export interface ParsedPhone {
  /** E.164, or "" when there are no digits. */
  e164: string
  /** National significant number, trunk prefix stripped. */
  national: string
  country: Country | undefined
  extension?: string
}

/** True when the national number has a length this country accepts. */
export function isValidLength(national: string, country: Country | undefined): boolean {
  if (!country) return false
  return country.lengths.includes(national.length)
}

/** True when the national number looks like a mobile line. */
export function isMobile(national: string, country: Country | undefined): boolean {
  const prefixes = country?.mobilePrefixes
  // Without data we cannot claim a number is NOT mobile, so we do not block it.
  if (!prefixes || prefixes.length === 0) return true
  for (const p of prefixes) {
    if (national.startsWith(p)) return true
  }
  return false
}

/** Strip a national trunk prefix ("0" in GB/DE/FR/…) if present. */
export function stripTrunk(national: string, country: Country | undefined): string {
  const trunk = country?.trunk
  if (trunk && national.length > trunk.length && national.startsWith(trunk)) {
    return national.slice(trunk.length)
  }
  return national
}

/** Format a national number using the country's template. */
export function formatNational(national: string, country: Country | undefined): string {
  if (!country) return national
  return formatMask(national.slice(0, maxLengthOf(country)), country.mask)
}

export function maxLengthOf(country: Country | undefined): number {
  if (!country) return 15 // E.164 hard ceiling
  let n = 0
  for (const l of country.lengths) if (l > n) n = l
  return n
}

/**
 * Keep only digits the country's template can hold.
 *
 * Order matters: the trunk prefix is stripped BEFORE the length cap, because
 * it is not part of the national significant number. Capping first would let
 * GB's leading "0" consume a mask slot and silently drop the final digit.
 */
export function parseNational(text: string, country: Country | undefined): string {
  const digits = digitsOf(text)
  if (!country) return digits.slice(0, 15)
  return stripTrunk(digits, country).slice(0, maxLengthOf(country))
}

/** Build E.164 from a country and its national number. */
export function toE164(national: string, country: Country | undefined): string {
  if (!national) return ""
  if (!country) return `+${national}`
  return `+${country.dial}${national}`
}

/**
 * Split an E.164 string back into country + national parts.
 * Tolerant of a missing "+" so stored values from other systems still load.
 */
export function fromE164(e164: string, fallback?: Country): ParsedPhone {
  const digits = digitsOf(e164)
  if (!digits) return { e164: "", national: "", country: fallback }

  const country = e164.trim().startsWith("+")
    ? countryByDial(digits)
    : (fallback ?? countryByDial(digits))

  if (!country) return { e164: `+${digits}`, national: digits, country: undefined }

  const national = digits.startsWith(country.dial)
    ? digits.slice(country.dial.length)
    : digits

  return { e164: toE164(national, country), national, country }
}

/**
 * Smart paste. PRD §11.2.
 *
 * Handles the messy reality: "Call me at (415) 555-2671 ext 4", a bare
 * international number, a number with the country's trunk prefix, or a
 * spreadsheet cell with stray whitespace.
 *
 * Returns `switchedTo` when the paste implies a DIFFERENT country than the one
 * currently selected — the caller must surface that, because it is a side
 * effect beyond this field's own value.
 */
export function parsePastedPhone(
  input: string,
  current: Country | undefined,
): { national: string; country: Country | undefined; extension?: string; switchedTo?: Country } {
  const cleaned = scrub(input)
  const { base, extension } = splitExtension(cleaned)
  const digits = digitsOf(base)

  if (!digits) return { national: "", country: current }

  // An explicit "+" (or a 00 IDD prefix) means the text carries its own country.
  const hasPlus = base.includes("+")
  const idd = digits.startsWith("00") ? digits.slice(2) : null
  const international = hasPlus ? digits : idd

  if (international) {
    const detected = countryByDial(international)
    if (detected) {
      const national = international.slice(detected.dial.length)
      return {
        national: national.slice(0, maxLengthOf(detected)),
        country: detected,
        extension,
        ...(detected.iso !== current?.iso ? { switchedTo: detected } : {}),
      }
    }
    return { national: international.slice(0, 15), country: undefined, extension }
  }

  // No country marker: treat the digits as national for the current country,
  // dropping a leading dial code if the user pasted it without a "+".
  let national = digits
  if (current && national.length > maxLengthOf(current) && national.startsWith(current.dial)) {
    national = national.slice(current.dial.length)
  }
  national = stripTrunk(national, current)
  return { national: national.slice(0, maxLengthOf(current)), country: current, extension }
}
