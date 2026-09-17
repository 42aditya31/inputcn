import { describe, expect, it } from "vitest"

import {
  compileMask,
  formatMask,
  isMaskComplete,
  maskCapacity,
  maskPlaceholder,
  parseMask,
} from "../src/mask.js"

const US = "(###) ###-####"
const CPF = "###.###.###-##"
const PLATE = "AA-####"

describe("compileMask", () => {
  it("counts fillable slots", () => {
    expect(maskCapacity(US)).toBe(10)
    expect(maskCapacity(CPF)).toBe(11)
    expect(maskCapacity(PLATE)).toBe(6)
  })

  it("treats an escaped token as a literal", () => {
    expect(maskCapacity("\\#-###")).toBe(3)
    expect(formatMask("123", "\\#-###")).toBe("#-123")
  })

  it("returns the same compiled object for the same mask", () => {
    expect(compileMask(US)).toBe(compileMask(US))
  })
})

describe("parseMask", () => {
  it("keeps only characters the slots accept", () => {
    expect(parseMask("(415) 555-2671", US)).toBe("4155552671")
    expect(parseMask("415.555.2671", US)).toBe("4155552671")
    expect(parseMask("4155552671", US)).toBe("4155552671")
  })

  it("stops at capacity", () => {
    expect(parseMask("41555526719999", US)).toBe("4155552671")
  })

  it("drops characters that do not fit the slot type", () => {
    expect(parseMask("AB-1234", PLATE)).toBe("AB1234")
    expect(parseMask("ab1234", PLATE)).toBe("ab1234") // case-insensitive letters
  })

  it("does not let a character skip ahead to a later slot", () => {
    // "12-1234" has no letters, and "AA-####" needs two. Advancing past the
    // letter slots would make the raw string ambiguous — formatMask fills
    // slots left to right, so "1234" would wrongly render as "12-34".
    expect(parseMask("12-1234", PLATE)).toBe("")
    expect(formatMask("1234", PLATE)).toBe("12-34") // the ambiguity we avoid
  })

  it("returns empty for empty input", () => {
    expect(parseMask("", US)).toBe("")
  })
})

describe("formatMask", () => {
  it("inserts separators progressively", () => {
    expect(formatMask("", US)).toBe("")
    expect(formatMask("4", US)).toBe("(4")
    expect(formatMask("415", US)).toBe("(415")
    expect(formatMask("4155", US)).toBe("(415) 5")
    expect(formatMask("4155552671", US)).toBe("(415) 555-2671")
  })

  it("never emits a dangling separator ahead of the caret", () => {
    // "(415" not "(415) " — the trailing literal waits for the next digit.
    expect(formatMask("415", US)).toBe("(415")
    expect(formatMask("41555", CPF)).toBe("415.55")
  })

  it("round-trips: parse(format(x)) === x", () => {
    for (const raw of ["", "4", "415", "41555", "4155552671"]) {
      expect(parseMask(formatMask(raw, US), US)).toBe(raw)
    }
  })
})

describe("isMaskComplete", () => {
  it("is true only when every slot is filled", () => {
    expect(isMaskComplete("415555267", US)).toBe(false)
    expect(isMaskComplete("4155552671", US)).toBe(true)
  })
})

describe("maskPlaceholder", () => {
  it("derives a placeholder from the mask", () => {
    expect(maskPlaceholder(US)).toBe("(000) 000-0000")
    expect(maskPlaceholder(CPF)).toBe("000.000.000-00")
    expect(maskPlaceholder(PLATE, "_")).toBe("__-____")
  })
})
