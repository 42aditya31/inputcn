import { describe, expect, it } from "vitest"

import {
  detectBrand,
  formatCard,
  formatExpiry,
  isExpired,
  isValidLength,
  luhn,
  parseExpiry,
  parsePastedCard,
} from "../src/card.js"

// Standard test numbers published by the networks; all Luhn-valid.
const VISA = "4242424242424242"
const MASTERCARD = "5555555555554444"
const AMEX = "378282246310005"
const DISCOVER = "6011111111111117"

describe("detectBrand", () => {
  it("identifies the major networks", () => {
    expect(detectBrand(VISA)?.brand).toBe("visa")
    expect(detectBrand(MASTERCARD)?.brand).toBe("mastercard")
    expect(detectBrand(AMEX)?.brand).toBe("amex")
    expect(detectBrand(DISCOVER)?.brand).toBe("discover")
  })

  it("identifies from a partial number", () => {
    expect(detectBrand("4")?.brand).toBe("visa")
    expect(detectBrand("37")?.brand).toBe("amex")
  })

  it("prefers Maestro over Mastercard on their overlapping ranges", () => {
    // 5018 is Maestro; a naive 5[1-5] check would miss it, and 50 is not in
    // Mastercard's range anyway — this guards the ordering.
    expect(detectBrand("5018000000000000")?.brand).toBe("maestro")
    expect(detectBrand("5555000000000000")?.brand).toBe("mastercard")
  })

  it("returns undefined when undeterminable", () => {
    expect(detectBrand("")).toBeUndefined()
    expect(detectBrand("9")).toBeUndefined()
  })
})

describe("luhn", () => {
  it("accepts the published test numbers", () => {
    for (const n of [VISA, MASTERCARD, AMEX, DISCOVER]) {
      expect(luhn(n), n).toBe(true)
    }
  })

  it("catches a single-digit typo", () => {
    expect(luhn("4242424242424243")).toBe(false)
  })

  it("catches a transposition", () => {
    expect(luhn("4242424242424262")).toBe(false)
  })

  it("rejects anything too short to be a card", () => {
    expect(luhn("4242")).toBe(false)
    expect(luhn("")).toBe(false)
  })

  it("rejects non-digits rather than coercing them", () => {
    expect(luhn("4242abcd42424242")).toBe(false)
  })
})

describe("formatCard", () => {
  it("groups in fours for most brands", () => {
    expect(formatCard(VISA, detectBrand(VISA))).toBe("4242 4242 4242 4242")
  })

  it("uses 4-6-5 for Amex", () => {
    expect(formatCard(AMEX, detectBrand(AMEX))).toBe("3782 822463 10005")
  })

  it("formats progressively while typing", () => {
    const v = detectBrand("4")
    expect(formatCard("4", v)).toBe("4")
    expect(formatCard("42424", v)).toBe("4242 4")
  })

  it("caps at the brand's longest accepted length", () => {
    const amex = detectBrand(AMEX)
    expect(formatCard(AMEX + "999999", amex).replace(/\D/g, "")).toHaveLength(15)
  })
})

describe("isValidLength", () => {
  it("checks against the brand's accepted lengths", () => {
    expect(isValidLength(AMEX, detectBrand(AMEX))).toBe(true)
    expect(isValidLength(VISA, detectBrand(AMEX))).toBe(false) // 16 ≠ 15
    expect(isValidLength(VISA, detectBrand(VISA))).toBe(true)
  })
})

describe("expiry", () => {
  it("parses the common spellings", () => {
    for (const text of ["0428", "04/28", "04 / 28", "04 / 2028"]) {
      const e = parseExpiry(text)
      expect(e?.month, text).toBe(4)
      expect(e?.fullYear, text).toBe(2028)
    }
  })

  it("rejects an impossible month", () => {
    expect(parseExpiry("1328")).toBeNull()
    expect(parseExpiry("0028")).toBeNull()
  })

  it("returns null while still incomplete", () => {
    expect(parseExpiry("04")).toBeNull()
    expect(parseExpiry("")).toBeNull()
  })

  it("formats as the user types", () => {
    expect(formatExpiry("0")).toBe("0")
    expect(formatExpiry("04")).toBe("04")
    expect(formatExpiry("042")).toBe("04 / 2")
    expect(formatExpiry("0428")).toBe("04 / 28")
  })

  it("treats a card as valid through the last day of its month", () => {
    const expiry = parseExpiry("0428")
    // Still valid on the final day of April 2028…
    expect(isExpired(expiry, new Date(2028, 3, 30, 23, 59))).toBe(false)
    // …and expired the instant May begins.
    expect(isExpired(expiry, new Date(2028, 4, 1, 0, 0))).toBe(true)
  })

  it("treats a null expiry as not-expired, leaving that to `required`", () => {
    expect(isExpired(null)).toBe(false)
  })
})

describe("parsePastedCard", () => {
  it("strips any punctuation a human used", () => {
    expect(parsePastedCard("4242-4242-4242-4242")).toBe(VISA)
    expect(parsePastedCard("4242 4242 4242 4242")).toBe(VISA)
    expect(parsePastedCard("Card: 4242424242424242")).toBe(VISA)
  })

  it("strips clipboard junk", () => {
    expect(parsePastedCard("​4242 4242–4242 4242")).toBe(VISA)
  })
})
