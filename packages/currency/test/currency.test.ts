import { describe, expect, it } from "vitest"

import {
  formatMinor,
  fractionDigits,
  minorUnitFactor,
  negate,
  parsePastedMoney,
  popDigit,
  pushDigit,
  toMajor,
  toMinor,
} from "../src/currency.js"

describe("fractionDigits", () => {
  it("reads the real decimal places per currency", () => {
    expect(fractionDigits("USD")).toBe(2)
    expect(fractionDigits("EUR")).toBe(2)
    expect(fractionDigits("JPY")).toBe(0) // zero-decimal
    expect(minorUnitFactor("JPY")).toBe(1)
    expect(minorUnitFactor("USD")).toBe(100)
  })

  it("falls back to 2 for an unknown code", () => {
    expect(fractionDigits("XXZ")).toBe(2)
  })
})

describe("formatMinor", () => {
  it("formats minor units per locale", () => {
    expect(formatMinor(123450, "USD", { locale: "en-US" })).toBe("1,234.50")
    expect(formatMinor(123450, "EUR", { locale: "de-DE" })).toBe("1.234,50")
    expect(formatMinor(0, "USD")).toBe("0.00")
  })

  it("renders zero-decimal currencies without a fraction", () => {
    expect(formatMinor(1235, "JPY", { locale: "en-US" })).toBe("1,235")
  })

  it("can include the symbol", () => {
    expect(formatMinor(123450, "USD", { withSymbol: true })).toContain("$")
  })
})

describe("digit accumulator", () => {
  it("fills from the right like a register", () => {
    let v = 0
    for (const d of [1, 2, 3]) v = pushDigit(v, d)
    expect(v).toBe(123)
    expect(formatMinor(v, "USD")).toBe("1.23")
  })

  it("pops from the right", () => {
    expect(popDigit(1234)).toBe(123)
    expect(popDigit(1)).toBe(0)
    expect(popDigit(0)).toBe(0)
  })

  it("preserves sign through push and pop", () => {
    expect(pushDigit(-12, 3)).toBe(-123)
    expect(popDigit(-123)).toBe(-12)
  })

  it("refuses to exceed the ceiling", () => {
    expect(pushDigit(1e12, 9)).toBe(1e12)
  })

  it("negate is an involution and leaves zero alone", () => {
    expect(negate(500)).toBe(-500)
    expect(negate(negate(500))).toBe(500)
    expect(negate(0)).toBe(0)
  })
})

describe("float safety — the reason minor units exist", () => {
  it("adds prices exactly where a float would drift", () => {
    // 0.1 + 0.2 !== 0.3 in binary floating point.
    expect(0.1 + 0.2).not.toBe(0.3)
    const a = toMinor(0.1, "USD")
    const b = toMinor(0.2, "USD")
    expect(a + b).toBe(30)
    expect(formatMinor(a + b, "USD")).toBe("0.30")
  })

  it("survives a hundred additions of a third of a dollar", () => {
    let total = 0
    for (let i = 0; i < 100; i++) total += toMinor(0.33, "USD")
    expect(total).toBe(3300)
    expect(Number.isInteger(total)).toBe(true)
  })

  it("round-trips major → minor → major", () => {
    for (const v of [0, 1, 1.5, 1234.56, 0.01]) {
      expect(toMajor(toMinor(v, "USD"), "USD")).toBeCloseTo(v, 10)
    }
  })
})

describe("parsePastedMoney — PRD §11.2", () => {
  it("takes the amount and detects the currency", () => {
    const r = parsePastedMoney("$1,234.50 USD", "EUR")
    expect(r.minor).toBe(123450)
    expect(r.switchedTo).toBe("USD")
  })

  it("resolves separators by structure, not by assumed locale", () => {
    // German convention: "." groups thousands, "," is the decimal point.
    expect(parsePastedMoney("1.234,50", "EUR").minor).toBe(123450)
    // US convention, same digits.
    expect(parsePastedMoney("1,234.50", "USD").minor).toBe(123450)
  })

  it("treats a lone dot with three trailing digits as thousands", () => {
    expect(parsePastedMoney("1.234", "EUR").minor).toBe(123400)
  })

  it("treats a lone dot with two trailing digits as a decimal", () => {
    expect(parsePastedMoney("12.34", "USD").minor).toBe(1234)
  })

  it("does not report a switch when the currency matches", () => {
    expect(parsePastedMoney("$99.00", "USD").switchedTo).toBeUndefined()
  })

  it("scrubs clipboard junk", () => {
    expect(parsePastedMoney("​$1 234.50", "USD").minor).toBe(123450)
  })

  it("respects a zero-decimal target currency", () => {
    expect(parsePastedMoney("1235", "JPY").minor).toBe(1235)
  })

  it("returns null when there is no number", () => {
    expect(parsePastedMoney("free of charge", "USD").minor).toBeNull()
    expect(parsePastedMoney("", "USD").minor).toBeNull()
  })

  it("round-trips its own formatted output", () => {
    const text = formatMinor(123450, "USD", { locale: "en-US" })
    expect(parsePastedMoney(text, "USD", "en-US").minor).toBe(123450)
  })
})
