import { describe, expect, it } from "vitest"

import {
  formatDuration,
  fromSegments,
  parseDuration,
  parsePastedDuration,
  toISO8601,
  toSegments,
} from "../src/duration.js"

describe("parseDuration", () => {
  it("parses compound human text", () => {
    expect(parseDuration("2h 30m")).toBe(9000)
    expect(parseDuration("1d 2h")).toBe(93_600)
    expect(parseDuration("45s")).toBe(45)
  })

  it("treats every equivalent spelling identically", () => {
    // The whole point: the user should not have to learn a syntax.
    const ninetyMinutes = 5400
    for (const text of ["1h 30m", "1h30m", "1h30", "90m", "90 minutes", "1:30", "1.5h"]) {
      expect(parseDuration(text), `"${text}"`).toBe(ninetyMinutes)
    }
  })

  it("reads a bare number as minutes by default", () => {
    expect(parseDuration("30")).toBe(1800)
  })

  it("lets the bare unit be configured rather than guessed", () => {
    expect(parseDuration("30", { bareUnit: "s" })).toBe(30)
    expect(parseDuration("30", { bareUnit: "h" })).toBe(108_000)
  })

  it("handles clock notation with seconds", () => {
    expect(parseDuration("1:30:15")).toBe(5415)
    expect(parseDuration("0:45")).toBe(2700)
  })

  it("accepts a comma decimal separator", () => {
    expect(parseDuration("1,5h")).toBe(5400)
  })

  it("returns 0 rather than NaN for junk", () => {
    expect(parseDuration("")).toBe(0)
    expect(parseDuration("soon")).toBe(0)
    expect(parseDuration("   ")).toBe(0)
  })

  it("is not affected by the global regex's lastIndex between calls", () => {
    // A /g regex keeps mutable state; calling twice must give the same answer.
    expect(parseDuration("2h 30m")).toBe(9000)
    expect(parseDuration("2h 30m")).toBe(9000)
    expect(parseDuration("2h 30m")).toBe(9000)
  })
})

describe("formatDuration", () => {
  it("formats compactly, largest unit first", () => {
    expect(formatDuration(5400)).toBe("1h 30m")
    expect(formatDuration(93_600)).toBe("1d 2h")
    expect(formatDuration(45)).toBe("45s")
  })

  it("limits how many units it shows", () => {
    expect(formatDuration(90_061, { maxParts: 2 })).toBe("1d 1h")
    expect(formatDuration(90_061, { maxParts: 4 })).toBe("1d 1h 1m 1s")
  })

  it("respects maxUnit", () => {
    expect(formatDuration(93_600, { maxUnit: "h" })).toBe("26h")
  })

  it("uses the zero text for zero", () => {
    expect(formatDuration(0)).toBe("")
    expect(formatDuration(0, { zero: "none" })).toBe("none")
  })

  it("round-trips through parseDuration", () => {
    for (const s of [45, 60, 5400, 9000, 86_400, 93_600]) {
      expect(parseDuration(formatDuration(s, { maxParts: 4 }))).toBe(s)
    }
  })
})

describe("toISO8601", () => {
  it("emits valid ISO durations", () => {
    expect(toISO8601(0)).toBe("PT0S")
    expect(toISO8601(45)).toBe("PT45S")
    expect(toISO8601(5400)).toBe("PT1H30M")
    expect(toISO8601(86_400)).toBe("P1D")
    expect(toISO8601(93_600)).toBe("P1DT2H")
  })

  it("never emits a bare P, which is not valid", () => {
    for (const s of [0, 1, 60, 3600, 86_400, 90_061]) {
      expect(toISO8601(s)).not.toBe("P")
      expect(toISO8601(s).startsWith("P")).toBe(true)
    }
  })
})

describe("segments", () => {
  it("splits and rejoins losslessly", () => {
    for (const s of [0, 59, 60, 3661, 5400, 359_999]) {
      const { h, m, s: sec } = toSegments(s)
      expect(fromSegments(h, m, sec)).toBe(s)
    }
  })

  it("clamps negatives rather than producing nonsense", () => {
    expect(fromSegments(-1, -1, -1)).toBe(0)
    expect(toSegments(-100)).toEqual({ h: 0, m: 0, s: 0 })
  })
})

describe("parsePastedDuration", () => {
  it("returns null when there is nothing numeric", () => {
    expect(parsePastedDuration("about an hour")).toBeNull()
    expect(parsePastedDuration("")).toBeNull()
  })

  it("scrubs clipboard junk", () => {
    expect(parsePastedDuration("​2h 30m")).toBe(9000)
  })
})
