import { describe, expect, it } from "vitest"

import {
  bestForeground,
  contrastRatio,
  format,
  luminance,
  parseColor,
  parsePastedColor,
  rgbToHsl,
  toHex,
  toHslString,
  toRgbString,
  wcagLevel,
} from "../src/color.js"

const BLACK = { r: 0, g: 0, b: 0, a: 1 }
const WHITE = { r: 255, g: 255, b: 255, a: 1 }

describe("parseColor", () => {
  it("parses 6-digit hex with or without the hash", () => {
    expect(parseColor("#3A3FD6")).toEqual({ r: 58, g: 63, b: 214, a: 1 })
    expect(parseColor("3a3fd6")).toEqual({ r: 58, g: 63, b: 214, a: 1 })
  })

  it("expands 3-digit shorthand", () => {
    expect(parseColor("#f0a")).toEqual({ r: 255, g: 0, b: 170, a: 1 })
  })

  it("reads 8-digit hex alpha", () => {
    const c = parseColor("#3A3FD680")!
    expect(c.r).toBe(58)
    expect(c.a).toBeCloseTo(0.5, 1)
  })

  it("parses rgb() and rgba()", () => {
    expect(parseColor("rgb(58, 63, 214)")).toEqual({ r: 58, g: 63, b: 214, a: 1 })
    expect(parseColor("rgba(58, 63, 214, 0.5)")).toEqual({ r: 58, g: 63, b: 214, a: 0.5 })
    // Modern space-separated syntax.
    expect(parseColor("rgb(58 63 214 / 50%)")?.a).toBeCloseTo(0.5)
  })

  it("parses hsl()", () => {
    expect(parseColor("hsl(0, 100%, 50%)")).toEqual({ r: 255, g: 0, b: 0, a: 1 })
    expect(parseColor("hsl(120, 100%, 50%)")).toEqual({ r: 0, g: 255, b: 0, a: 1 })
  })

  it("returns null for junk", () => {
    expect(parseColor("")).toBeNull()
    expect(parseColor("reddish")).toBeNull()
    expect(parseColor("#12345")).toBeNull()
  })
})

describe("output formats", () => {
  it("emits uppercase canonical hex, so equal colours are string-equal", () => {
    expect(toHex(parseColor("#3a3fd6")!)).toBe("#3A3FD6")
    expect(toHex(parseColor("rgb(58,63,214)")!)).toBe("#3A3FD6")
    expect(toHex(parseColor("#3a3fd6")!)).toBe(toHex(parseColor("RGB(58, 63, 214)")!))
  })

  it("only includes alpha when it is not opaque", () => {
    expect(toHex({ r: 0, g: 0, b: 0, a: 1 })).toBe("#000000")
    expect(toHex({ r: 0, g: 0, b: 0, a: 0.5 })).toHaveLength(9)
  })

  it("formats as rgb and hsl", () => {
    const c = parseColor("#FF0000")!
    expect(toRgbString(c)).toBe("rgb(255, 0, 0)")
    expect(toHslString(c)).toBe("hsl(0, 100%, 50%)")
    expect(format(c, "hex")).toBe("#FF0000")
  })

  it("round-trips hex → rgb → hex exactly", () => {
    for (const hex of ["#3A3FD6", "#16A34A", "#000000", "#FFFFFF"]) {
      const c = parseColor(hex)!
      expect(toHex(parseColor(toRgbString(c))!), hex).toBe(hex)
    }
  })

  it("round-trips through hsl to within one channel step", () => {
    // hsl() strings round h/s/l to integers for readability, so this is lossy
    // by construction — a documented ±1/255 per channel, not a bug. It is why
    // the CANONICAL value is hex: hsl and rgb are output formats only.
    for (const hex of ["#3A3FD6", "#16A34A", "#000000", "#FFFFFF"]) {
      const c = parseColor(hex)!
      const back = parseColor(toHslString(c))!
      for (const ch of ["r", "g", "b"] as const) {
        expect(Math.abs(back[ch] - c[ch]), `${hex}.${ch}`).toBeLessThanOrEqual(2)
      }
    }
  })

  it("is stable under repeated hex round-trips, so a stored value never drifts", () => {
    let hex = "#3A3FD6"
    for (let i = 0; i < 20; i++) hex = toHex(parseColor(hex)!)
    expect(hex).toBe("#3A3FD6")
  })

  it("converts to HSL sanely", () => {
    expect(rgbToHsl({ r: 255, g: 0, b: 0, a: 1 }).h).toBeCloseTo(0)
    expect(rgbToHsl({ r: 128, g: 128, b: 128, a: 1 }).s).toBe(0)
  })
})

describe("contrast — the reason this component exists", () => {
  it("matches the WCAG reference values", () => {
    // Black on white is the maximum possible ratio.
    expect(contrastRatio(BLACK, WHITE)).toBeCloseTo(21, 1)
    expect(contrastRatio(WHITE, WHITE)).toBeCloseTo(1, 5)
  })

  it("is symmetric", () => {
    const a = parseColor("#3A3FD6")!
    expect(contrastRatio(a, WHITE)).toBeCloseTo(contrastRatio(WHITE, a), 10)
  })

  it("computes luminance at the extremes", () => {
    expect(luminance(BLACK)).toBe(0)
    expect(luminance(WHITE)).toBeCloseTo(1, 10)
  })

  it("picks the readable foreground", () => {
    expect(bestForeground(WHITE)).toBe("#000000")
    expect(bestForeground(BLACK)).toBe("#FFFFFF")
    expect(bestForeground(parseColor("#FFFF00")!)).toBe("#000000") // yellow
    expect(bestForeground(parseColor("#3A3FD6")!)).toBe("#FFFFFF") // deep blue
  })

  it("grades against the WCAG thresholds", () => {
    expect(wcagLevel(21)).toBe("AAA")
    expect(wcagLevel(7)).toBe("AAA")
    expect(wcagLevel(4.5)).toBe("AA")
    expect(wcagLevel(3)).toBe("AA-large")
    expect(wcagLevel(2.9)).toBe("fail")
  })

  it("flags a brand colour nobody can read on white", () => {
    // Pale yellow on white: the exact case the constraint exists to prevent.
    const pale = parseColor("#FFF9C4")!
    expect(contrastRatio(pale, WHITE)).toBeLessThan(1.5)
    expect(wcagLevel(contrastRatio(pale, WHITE))).toBe("fail")
  })
})

describe("parsePastedColor", () => {
  it("takes a bare value", () => {
    expect(toHex(parsePastedColor("#3A3FD6")!)).toBe("#3A3FD6")
  })

  it("extracts from a CSS declaration", () => {
    expect(toHex(parsePastedColor("color: #3A3FD6;")!)).toBe("#3A3FD6")
    expect(toHex(parsePastedColor("background: rgb(58, 63, 214) !important")!)).toBe(
      "#3A3FD6",
    )
  })

  it("scrubs clipboard junk", () => {
    expect(toHex(parsePastedColor("​#3A3FD6 ")!)).toBe("#3A3FD6")
  })

  it("returns null when there is no colour", () => {
    expect(parsePastedColor("just some words")).toBeNull()
    expect(parsePastedColor("")).toBeNull()
  })
})
