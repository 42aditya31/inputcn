/**
 * Country metadata for PhoneInput.
 *
 * Deliberately self-contained: no libphonenumber-js at this layer. The full
 * metadata bundle is ~145 kB and most apps need a dozen countries, so the
 * component ships national templates and defers *authoritative* validation to
 * an optional adapter (see `validator.ts`). PRD §8.4: one small dependency per
 * component, and only when genuinely needed.
 */

export interface Country {
  /** ISO 3166-1 alpha-2. */
  iso: string
  name: string
  /** Calling code without "+". */
  dial: string
  /** National-format template; `#` is a digit slot. */
  mask: string
  /** Expected national significant number length(s). */
  lengths: readonly number[]
  /** Leading digits that indicate a mobile line, for `mobileOnly`. */
  mobilePrefixes?: readonly string[]
  /** National trunk prefix stripped when parsing, e.g. "0" in the UK. */
  trunk?: string
}

export const COUNTRIES: readonly Country[] = [
  { iso: "US", name: "United States", dial: "1", mask: "(###) ###-####", lengths: [10] },
  { iso: "CA", name: "Canada", dial: "1", mask: "(###) ###-####", lengths: [10] },
  {
    iso: "GB",
    name: "United Kingdom",
    dial: "44",
    mask: "#### ######",
    lengths: [10],
    trunk: "0",
    mobilePrefixes: ["7"],
  },
  {
    iso: "IN",
    name: "India",
    dial: "91",
    mask: "##### #####",
    lengths: [10],
    trunk: "0",
    mobilePrefixes: ["6", "7", "8", "9"],
  },
  {
    iso: "DE",
    name: "Germany",
    dial: "49",
    mask: "### ########",
    lengths: [10, 11],
    trunk: "0",
    mobilePrefixes: ["15", "16", "17"],
  },
  {
    iso: "FR",
    name: "France",
    dial: "33",
    mask: "# ## ## ## ##",
    lengths: [9],
    trunk: "0",
    mobilePrefixes: ["6", "7"],
  },
  {
    iso: "ES",
    name: "Spain",
    dial: "34",
    mask: "### ## ## ##",
    lengths: [9],
    mobilePrefixes: ["6", "7"],
  },
  {
    iso: "IT",
    name: "Italy",
    dial: "39",
    mask: "### ### ####",
    lengths: [9, 10],
    mobilePrefixes: ["3"],
  },
  {
    iso: "NL",
    name: "Netherlands",
    dial: "31",
    mask: "# ########",
    lengths: [9],
    trunk: "0",
    mobilePrefixes: ["6"],
  },
  {
    iso: "JP",
    name: "Japan",
    dial: "81",
    mask: "##-####-####",
    lengths: [10],
    trunk: "0",
    mobilePrefixes: ["70", "80", "90"],
  },
  {
    iso: "BR",
    name: "Brazil",
    dial: "55",
    mask: "## #####-####",
    lengths: [10, 11],
    mobilePrefixes: ["9"],
  },
  {
    iso: "AU",
    name: "Australia",
    dial: "61",
    mask: "# #### ####",
    lengths: [9],
    trunk: "0",
    mobilePrefixes: ["4"],
  },
  {
    iso: "SG",
    name: "Singapore",
    dial: "65",
    mask: "#### ####",
    lengths: [8],
    mobilePrefixes: ["8", "9"],
  },
  {
    iso: "AE",
    name: "United Arab Emirates",
    dial: "971",
    mask: "## ### ####",
    lengths: [9],
    trunk: "0",
    mobilePrefixes: ["50", "52", "54", "55", "56", "58"],
  },
  {
    iso: "ZA",
    name: "South Africa",
    dial: "27",
    mask: "## ### ####",
    lengths: [9],
    trunk: "0",
    mobilePrefixes: ["6", "7", "8"],
  },
  {
    iso: "MX",
    name: "Mexico",
    dial: "52",
    mask: "## #### ####",
    lengths: [10],
    mobilePrefixes: ["1"],
  },
  {
    iso: "NG",
    name: "Nigeria",
    dial: "234",
    mask: "### ### ####",
    lengths: [10],
    trunk: "0",
    mobilePrefixes: ["70", "80", "81", "90", "91"],
  },
  {
    iso: "PK",
    name: "Pakistan",
    dial: "92",
    mask: "### #######",
    lengths: [10],
    trunk: "0",
    mobilePrefixes: ["3"],
  },
] as const

/* ------------------------------------------------------------------ *
 * Index maps. Built once at module load — every lookup is O(1) rather
 * than a .find() scan per keystroke (js-index-maps).
 * ------------------------------------------------------------------ */

export const BY_ISO: ReadonlyMap<string, Country> = new Map(
  COUNTRIES.map((c) => [c.iso, c]),
)

/** Dial codes longest-first, so "1" never shadows "1-something". */
const DIALS_BY_LENGTH: readonly Country[] = [...COUNTRIES].sort(
  (a, b) => b.dial.length - a.dial.length,
)

export function countryByIso(iso: string | undefined): Country | undefined {
  return iso ? BY_ISO.get(iso.toUpperCase()) : undefined
}

/**
 * Best country for a set of digits that begin with a calling code.
 * Longest match wins; ties resolve to the first declared country, which is
 * why US precedes CA in the list above (both are +1).
 */
export function countryByDial(digits: string): Country | undefined {
  for (const c of DIALS_BY_LENGTH) {
    if (digits.startsWith(c.dial)) return c
  }
  return undefined
}

/** Restrict the list, preserving the caller's ordering when given. */
export function filterCountries(allowed?: readonly string[]): readonly Country[] {
  if (!allowed || allowed.length === 0) return COUNTRIES
  const wanted = new Set(allowed.map((c) => c.toUpperCase()))
  const out: Country[] = []
  for (const iso of allowed) {
    const c = BY_ISO.get(iso.toUpperCase())
    if (c) out.push(c)
  }
  // Anything unrecognised is simply absent rather than throwing — a typo in a
  // country list should not blank the whole selector.
  return out.length > 0 ? out : COUNTRIES.filter((c) => wanted.has(c.iso))
}
