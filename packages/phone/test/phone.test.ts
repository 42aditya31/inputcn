import { describe, expect, it } from "vitest"

import { countryByDial, countryByIso } from "../src/countries.js"
import {
  formatNational,
  fromE164,
  isMobile,
  isValidLength,
  parseNational,
  parsePastedPhone,
  toE164,
} from "../src/phone.js"

const US = countryByIso("US")!
const GB = countryByIso("GB")!
const IN = countryByIso("IN")!

describe("countryByDial", () => {
  it("prefers the longest matching dial code", () => {
    // 234 (NG) must win over any shorter prefix
    expect(countryByDial("2348012345678")?.iso).toBe("NG")
    expect(countryByDial("14155552671")?.iso).toBe("US")
    expect(countryByDial("442071234567")?.iso).toBe("GB")
  })

  it("resolves a +1 tie to the first declared country", () => {
    expect(countryByDial("16135551234")?.iso).toBe("US")
  })
})

describe("formatNational", () => {
  it("formats progressively", () => {
    expect(formatNational("", US)).toBe("")
    expect(formatNational("415", US)).toBe("(415")
    expect(formatNational("4155552671", US)).toBe("(415) 555-2671")
    expect(formatNational("2071234567", GB)).toBe("2071 234567")
  })
})

describe("parseNational", () => {
  it("strips a national trunk prefix", () => {
    expect(parseNational("020 7123 4567", GB)).toBe("2071234567")
    expect(parseNational("09876543210", IN)).toBe("9876543210")
  })

  it("does not strip a leading zero that is the whole number", () => {
    expect(parseNational("0", GB)).toBe("0")
  })

  it("caps at the country's longest accepted length", () => {
    expect(parseNational("41555526719999", US)).toBe("4155552671")
  })
})

describe("E.164 round trip", () => {
  it("builds and parses back", () => {
    expect(toE164("4155552671", US)).toBe("+14155552671")
    const p = fromE164("+14155552671")
    expect(p.country?.iso).toBe("US")
    expect(p.national).toBe("4155552671")
    expect(p.e164).toBe("+14155552671")
  })

  it("tolerates a missing + by using the fallback country", () => {
    const p = fromE164("4155552671", US)
    expect(p.national).toBe("4155552671")
    expect(p.e164).toBe("+14155552671")
  })

  it("returns empty for empty input", () => {
    expect(fromE164("").e164).toBe("")
  })
})

describe("isValidLength / isMobile", () => {
  it("checks national length per country", () => {
    expect(isValidLength("4155552671", US)).toBe(true)
    expect(isValidLength("415555267", US)).toBe(false)
    expect(isValidLength("", US)).toBe(false)
  })

  it("detects mobile prefixes where data exists", () => {
    expect(isMobile("7911123456", GB)).toBe(true) // 07911 → mobile
    expect(isMobile("2071234567", GB)).toBe(false) // London landline
  })

  it("does not block when a country has no mobile data", () => {
    // US mobile and landline share prefixes, so we must not guess.
    expect(isMobile("4155552671", US)).toBe(true)
  })
})

describe("parsePastedPhone — PRD §11.2", () => {
  it("extracts a number from a sentence", () => {
    const r = parsePastedPhone("Call me at (415) 555-2671", US)
    expect(r.national).toBe("4155552671")
    expect(r.switchedTo).toBeUndefined()
  })

  it("captures a trailing extension", () => {
    const r = parsePastedPhone("(415) 555-2671 ext 4", US)
    expect(r.national).toBe("4155552671")
    expect(r.extension).toBe("4")
  })

  it("switches country on a pasted international number", () => {
    const r = parsePastedPhone("+44 20 7123 4567", US)
    expect(r.country?.iso).toBe("GB")
    expect(r.national).toBe("2071234567")
    expect(r.switchedTo?.iso).toBe("GB")
  })

  it("does not report a switch when the country is unchanged", () => {
    const r = parsePastedPhone("+1 415 555 2671", US)
    expect(r.country?.iso).toBe("US")
    expect(r.switchedTo).toBeUndefined()
  })

  it("understands a 00 IDD prefix", () => {
    const r = parsePastedPhone("00442071234567", US)
    expect(r.country?.iso).toBe("GB")
    expect(r.national).toBe("2071234567")
  })

  it("scrubs clipboard junk from Word and Google Docs", () => {
    // non-breaking spaces, zero-width space, en dash
    const r = parsePastedPhone("​(415) 555–2671", US)
    expect(r.national).toBe("4155552671")
  })

  it("drops a dial code pasted without a plus", () => {
    const r = parsePastedPhone("14155552671", US)
    expect(r.national).toBe("4155552671")
  })

  it("strips the trunk prefix on a national paste", () => {
    const r = parsePastedPhone("020 7123 4567", GB)
    expect(r.national).toBe("2071234567")
  })

  it("returns empty for text with no digits", () => {
    expect(parsePastedPhone("call me maybe", US).national).toBe("")
  })

  it("round-trips its own formatted output", () => {
    const formatted = formatNational("4155552671", US)
    expect(parsePastedPhone(formatted, US).national).toBe("4155552671")
  })
})
