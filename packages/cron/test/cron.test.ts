import { describe, expect, it } from "vitest"

import {
  buildCron,
  describeCron,
  nextRuns,
  parseCron,
  shortestInterval,
  toBuilderState,
} from "../src/cron.js"

describe("parseCron", () => {
  it("accepts a valid expression", () => {
    const p = parseCron("0 9 * * 1-5")
    expect(p.ok).toBe(true)
    expect(p.values.minute).toEqual([0])
    expect(p.values.hour).toEqual([9])
    expect(p.values.dayOfWeek).toEqual([1, 2, 3, 4, 5])
  })

  it("expands steps and lists", () => {
    expect(parseCron("*/15 * * * *").values.minute).toEqual([0, 15, 30, 45])
    expect(parseCron("0,30 * * * *").values.minute).toEqual([0, 30])
    expect(parseCron("0 9-17/4 * * *").values.hour).toEqual([9, 13, 17])
  })

  it("accepts named months and days", () => {
    expect(parseCron("0 0 1 jan *").values.month).toEqual([1])
    expect(parseCron("0 0 * * mon").values.dayOfWeek).toEqual([1])
  })

  it("normalises Sunday-as-7 to 0", () => {
    // Both spellings are legal; leaving them distinct breaks every comparison.
    expect(parseCron("0 0 * * 7").values.dayOfWeek).toEqual([0])
    expect(parseCron("0 0 * * 0,7").values.dayOfWeek).toEqual([0])
  })

  it("expands @-aliases", () => {
    expect(parseCron("@daily").expression).toBe("0 0 * * *")
    expect(parseCron("@hourly").ok).toBe(true)
  })

  it("reports the field and the reason, not just 'invalid'", () => {
    const wrong = parseCron("0 25 * * *")
    expect(wrong.ok).toBe(false)
    expect(wrong.errors[0]?.field).toBe("hour")
    expect(wrong.errors[0]?.reason).toMatch(/0-23/)
  })

  it("rejects the wrong number of fields", () => {
    expect(parseCron("0 9 * *").ok).toBe(false)
    expect(parseCron("0 9 * * * *").ok).toBe(false)
    expect(parseCron("").ok).toBe(false)
  })

  it("rejects a backwards range and a zero step", () => {
    expect(parseCron("0 17-9 * * *").ok).toBe(false)
    expect(parseCron("*/0 * * * *").ok).toBe(false)
  })
})

describe("describeCron — the feature", () => {
  it("describes common schedules in a checkable sentence", () => {
    expect(describeCron("0 9 * * 1-5")).toBe("At 09:00, Monday through Friday")
    expect(describeCron("0 9 * * *")).toBe("At 09:00")
    expect(describeCron("*/15 * * * *")).toMatch(/every 15 minutes/i)
    expect(describeCron("* * * * *")).toBe("Every minute")
  })

  it("names days and months rather than printing numbers", () => {
    expect(describeCron("0 9 * * 1,3")).toMatch(/Monday and Wednesday/)
    expect(describeCron("0 0 1 1 *")).toMatch(/January/)
  })

  it("explains what is wrong rather than saying 'invalid'", () => {
    expect(describeCron("0 99 * * *")).toMatch(/hour field/)
    expect(describeCron("nonsense")).toMatch(/needs exactly 5 fields/)
  })
})

describe("nextRuns", () => {
  const from = new Date(2026, 0, 1, 8, 0, 0) // Thu 1 Jan 2026, 08:00

  it("returns upcoming times in order", () => {
    const runs = nextRuns("0 9 * * *", from, 3)
    expect(runs).toHaveLength(3)
    expect(runs[0]!.getHours()).toBe(9)
    expect(runs[0]!.getTime()).toBeLessThan(runs[1]!.getTime())
  })

  it("respects a weekday restriction", () => {
    const runs = nextRuns("0 9 * * 1-5", from, 5)
    for (const r of runs) {
      expect(r.getDay()).toBeGreaterThanOrEqual(1)
      expect(r.getDay()).toBeLessThanOrEqual(5)
    }
  })

  it("ORs day-of-month with day-of-week, per POSIX", () => {
    // Fires on the 1st OR on any Monday — not only Mondays that are the 1st.
    const runs = nextRuns("0 0 1 * 1", from, 4)
    for (const r of runs) {
      expect(r.getDate() === 1 || r.getDay() === 1).toBe(true)
    }
  })

  it("returns nothing for an invalid expression", () => {
    expect(nextRuns("nope", from)).toEqual([])
  })
})

describe("shortestInterval — powers minInterval", () => {
  const from = new Date(2026, 0, 1, 0, 0, 0)

  it("measures the gap between runs", () => {
    expect(shortestInterval("* * * * *", from)).toBe(60)
    expect(shortestInterval("*/5 * * * *", from)).toBe(300)
    expect(shortestInterval("0 * * * *", from)).toBe(3600)
  })

  it("catches the every-minute case a minInterval is meant to block", () => {
    expect(shortestInterval("* * * * *", from)).toBeLessThan(300)
  })
})

describe("builder", () => {
  it("composes an expression from state", () => {
    expect(
      buildCron({ frequency: "weekly", time: "09:00", days: [1, 2, 3, 4, 5], dayOfMonth: 1 }),
    ).toBe("0 9 * * 1,2,3,4,5")
    expect(
      buildCron({ frequency: "daily", time: "09:30", days: [], dayOfMonth: 1 }),
    ).toBe("30 9 * * *")
    expect(
      buildCron({ frequency: "hourly", time: "09:15", days: [], dayOfMonth: 1 }),
    ).toBe("15 * * * *")
    expect(
      buildCron({ frequency: "monthly", time: "00:00", days: [], dayOfMonth: 15 }),
    ).toBe("0 0 15 * *")
  })

  it("round-trips, so switching layout does not lose the schedule", () => {
    for (const state of [
      { frequency: "daily" as const, time: "09:30", days: [], dayOfMonth: 1 },
      { frequency: "weekly" as const, time: "09:00", days: [1, 3, 5], dayOfMonth: 1 },
      { frequency: "monthly" as const, time: "00:00", days: [], dayOfMonth: 15 },
    ]) {
      const expr = buildCron(state)
      const back = toBuilderState(expr)
      expect(back?.frequency, expr).toBe(state.frequency)
      expect(buildCron(back!), expr).toBe(expr)
    }
  })

  it("returns null for an expression the builder cannot represent", () => {
    // The builder has no way to express "every 15 minutes during office hours".
    expect(toBuilderState("*/15 9-17 * * *")).toBeNull()
    expect(toBuilderState("invalid")).toBeNull()
  })
})
