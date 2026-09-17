/**
 * Cron expression parsing, description and scheduling. Framework-free.
 *
 * Canonical value is the five-field expression: `"0 9 * * 1-5"`.
 *
 * Two things here that nobody else in this category does:
 *   • a plain-English description, so a non-engineer can verify a schedule
 *     without asking one
 *   • `minInterval`, so nobody accidentally schedules a job every second and
 *     takes down a worker queue
 */

import { scrub } from "@inputcn/core/paste"

export type CronField = "minute" | "hour" | "dayOfMonth" | "month" | "dayOfWeek"

export const FIELD_ORDER: readonly CronField[] = [
  "minute",
  "hour",
  "dayOfMonth",
  "month",
  "dayOfWeek",
]

interface FieldSpec {
  min: number
  max: number
  /** Names accepted in place of numbers, lowercase, index-aligned to `min`. */
  names?: readonly string[]
}

const SPECS: Readonly<Record<CronField, FieldSpec>> = {
  minute: { min: 0, max: 59 },
  hour: { min: 0, max: 23 },
  dayOfMonth: { min: 1, max: 31 },
  month: {
    min: 1,
    max: 12,
    names: ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"],
  },
  // 0 and 7 both mean Sunday, which the parser normalises.
  dayOfWeek: { min: 0, max: 7, names: ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] },
}

export const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const

/** Named shorthands people expect to work. */
export const ALIASES: Readonly<Record<string, string>> = {
  "@yearly": "0 0 1 1 *",
  "@annually": "0 0 1 1 *",
  "@monthly": "0 0 1 * *",
  "@weekly": "0 0 * * 0",
  "@daily": "0 0 * * *",
  "@midnight": "0 0 * * *",
  "@hourly": "0 * * * *",
}

export interface FieldError {
  field: CronField
  value: string
  reason: string
}

export interface ParsedCron {
  ok: boolean
  /** The normalised five-field expression. */
  expression: string
  /** Matching values per field, sorted ascending. Empty when invalid. */
  values: Record<CronField, number[]>
  errors: FieldError[]
}

const RANGE_RE = /^(\d+|[a-z]{3})(?:-(\d+|[a-z]{3}))?(?:\/(\d+))?$/i
const STAR_RE = /^\*(?:\/(\d+))?$/

function resolveToken(token: string, spec: FieldSpec): number | null {
  const named = spec.names?.indexOf(token.toLowerCase())
  if (named !== undefined && named !== -1) return named + spec.min
  const n = Number(token)
  return Number.isInteger(n) ? n : null
}

/** Expand one field into the concrete values it matches. */
function expandField(raw: string, field: CronField): { values: number[]; error?: string } {
  const spec = SPECS[field]
  const out = new Set<number>()

  for (const part of raw.split(",")) {
    const star = STAR_RE.exec(part)
    if (star) {
      const step = star[1] === undefined ? 1 : Number(star[1])
      if (step < 1) return { values: [], error: `step must be 1 or more` }
      for (let v = spec.min; v <= spec.max; v += step) out.add(v)
      continue
    }

    const m = RANGE_RE.exec(part)
    if (!m) return { values: [], error: `"${part}" is not a number, range or step` }

    const from = resolveToken(m[1]!, spec)
    if (from === null) return { values: [], error: `"${m[1]}" is not a valid value` }

    const to = m[2] === undefined ? from : resolveToken(m[2], spec)
    if (to === null) return { values: [], error: `"${m[2]}" is not a valid value` }

    const step = m[3] === undefined ? 1 : Number(m[3])
    if (step < 1) return { values: [], error: `step must be 1 or more` }

    if (from < spec.min || to > spec.max) {
      return { values: [], error: `accepts ${spec.min}-${spec.max}` }
    }
    if (to < from) return { values: [], error: `range runs backwards` }

    for (let v = from; v <= to; v += step) out.add(v)
  }

  // Sunday is both 0 and 7; collapse so comparisons are simple.
  if (field === "dayOfWeek" && out.has(7)) {
    out.delete(7)
    out.add(0)
  }

  return { values: [...out].sort((a, b) => a - b) }
}

const EMPTY_VALUES = (): Record<CronField, number[]> => ({
  minute: [],
  hour: [],
  dayOfMonth: [],
  month: [],
  dayOfWeek: [],
})

/** Parse and validate a cron expression. */
export function parseCron(input: string): ParsedCron {
  const text = scrub(input).toLowerCase()
  const expanded = ALIASES[text] ?? text
  const parts = expanded.split(/\s+/).filter(Boolean)

  if (parts.length !== 5) {
    return {
      ok: false,
      expression: expanded,
      values: EMPTY_VALUES(),
      errors: [
        {
          field: "minute",
          value: expanded,
          reason: `needs exactly 5 fields, found ${parts.length}`,
        },
      ],
    }
  }

  const values = EMPTY_VALUES()
  const errors: FieldError[] = []

  FIELD_ORDER.forEach((field, i) => {
    const raw = parts[i]!
    const { values: vals, error } = expandField(raw, field)
    if (error) errors.push({ field, value: raw, reason: error })
    else values[field] = vals
  })

  return { ok: errors.length === 0, expression: parts.join(" "), values, errors }
}

/* ------------------------------------------------------------------ *
 * Plain English
 * ------------------------------------------------------------------ */

function listNames(values: number[], names: readonly string[]): string {
  const picked = values.map((v) => names[v] ?? String(v))
  if (picked.length === 1) return picked[0]!
  if (picked.length === 2) return `${picked[0]} and ${picked[1]}`
  return `${picked.slice(0, -1).join(", ")} and ${picked.at(-1)}`
}

/**
 * The common step between values, when they are evenly spaced across the
 * field's full range. Lets "0,15,30,45" be described as "every 15 minutes"
 * rather than listed out.
 */
function evenStep(values: number[], min: number, max: number): number | null {
  if (values.length < 3 || values[0] !== min) return null
  const step = values[1]! - values[0]!
  if (step < 2) return null
  for (let i = 1; i < values.length; i++) {
    if (values[i]! - values[i - 1]! !== step) return null
  }
  // The run must reach the end of the field, or it is a partial range and
  // "every N" would overstate it.
  return values.at(-1)! + step > max ? step : null
}

/** True when the values form an unbroken run — "Monday through Friday". */
function isContiguous(values: number[]): boolean {
  if (values.length < 3) return false
  for (let i = 1; i < values.length; i++) {
    if (values[i]! !== values[i - 1]! + 1) return false
  }
  return true
}

const pad = (n: number) => String(n).padStart(2, "0")

/**
 * Describe a schedule in a sentence a non-engineer can check.
 * This is the feature — a cron field nobody can read is a cron field nobody
 * can review.
 */
export function describeCron(input: string): string {
  const parsed = parseCron(input)
  if (!parsed.ok) {
    const first = parsed.errors[0]
    return first ? `Invalid: the ${labelOf(first.field)} field ${first.reason}` : "Invalid schedule"
  }

  const { minute, hour, dayOfMonth, month, dayOfWeek } = parsed.values
  const allMinutes = minute.length === 60
  const allHours = hour.length === 24
  const allDom = dayOfMonth.length === 31
  const allMonths = month.length === 12
  const allDow = dayOfWeek.length === 7

  const minuteStep = evenStep(minute, 0, 59)

  let when: string
  if (allMinutes && allHours) {
    when = "Every minute"
  } else if (minuteStep !== null && allHours) {
    when = `Every ${minuteStep} minutes`
  } else if (minuteStep !== null) {
    when = `Every ${minuteStep} minutes, during ${listNames(hour, hour.map((h) => `${pad(h)}:00`))}`
  } else if (allMinutes) {
    when = `Every minute past ${listNames(hour.map((h) => h), hour.map((h) => `${pad(h)}:00`))}`
  } else if (allHours) {
    when =
      minute.length === 1
        ? `At minute ${minute[0]} of every hour`
        : `At minutes ${minute.join(", ")} of every hour`
  } else if (minute.length === 1 && hour.length === 1) {
    when = `At ${pad(hour[0]!)}:${pad(minute[0]!)}`
  } else if (minute.length === 1) {
    when = `At ${minute[0]} minutes past ${listNames(hour, hour.map((h) => `${pad(h)}:00`))}`
  } else {
    when = `At ${minute.length} times per hour, during ${hour.length} hours`
  }

  const clauses: string[] = []

  if (!allDow) {
    clauses.push(
      isContiguous(dayOfWeek)
        ? `${DAY_NAMES[dayOfWeek[0]!]} through ${DAY_NAMES[dayOfWeek.at(-1)!]}`
        : `on ${listNames(dayOfWeek, DAY_NAMES)}`,
    )
  }

  if (!allDom) {
    clauses.push(
      isContiguous(dayOfMonth)
        ? `on days ${dayOfMonth[0]}–${dayOfMonth.at(-1)} of the month`
        : `on day ${dayOfMonth.join(", ")} of the month`,
    )
  }

  if (!allMonths) {
    clauses.push(`in ${listNames(month.map((m) => m - 1), MONTH_NAMES)}`)
  }

  return clauses.length ? `${when}, ${clauses.join(", ")}` : when
}

function labelOf(field: CronField): string {
  return field === "dayOfMonth"
    ? "day-of-month"
    : field === "dayOfWeek"
      ? "day-of-week"
      : field
}

/* ------------------------------------------------------------------ *
 * Scheduling
 * ------------------------------------------------------------------ */

/**
 * The next `count` fire times after `from`.
 *
 * Deliberately a bounded minute-by-minute scan rather than a date solver: it
 * is simple enough to be obviously correct, and the horizon caps the cost. A
 * schedule that fires less often than once every 4 years returns fewer
 * results rather than hanging.
 */
export function nextRuns(input: string, from = new Date(), count = 3): Date[] {
  const parsed = parseCron(input)
  if (!parsed.ok) return []

  const { minute, hour, dayOfMonth, month, dayOfWeek } = parsed.values
  const mins = new Set(minute)
  const hrs = new Set(hour)
  const doms = new Set(dayOfMonth)
  const months = new Set(month)
  const dows = new Set(dayOfWeek)

  // A restricted day-of-month and day-of-week are OR'd, per POSIX cron.
  const domRestricted = dayOfMonth.length !== 31
  const dowRestricted = dayOfWeek.length !== 7

  const out: Date[] = []
  const d = new Date(from.getTime())
  d.setSeconds(0, 0)

  const HORIZON = 60 * 24 * 366 * 4 // four years of minutes
  for (let i = 0; i < HORIZON && out.length < count; i++) {
    d.setMinutes(d.getMinutes() + 1)

    if (!mins.has(d.getMinutes())) continue
    if (!hrs.has(d.getHours())) continue
    if (!months.has(d.getMonth() + 1)) continue

    const domOk = doms.has(d.getDate())
    const dowOk = dows.has(d.getDay())
    const dayOk =
      domRestricted && dowRestricted ? domOk || dowOk
      : domRestricted ? domOk
      : dowRestricted ? dowOk
      : true
    if (!dayOk) continue

    out.push(new Date(d.getTime()))
  }

  return out
}

/**
 * Shortest gap between consecutive runs, in seconds. `Infinity` when the
 * schedule fires less than twice inside the sampling window.
 *
 * Powers `minInterval` — the constraint that stops someone scheduling a job
 * every second.
 */
export function shortestInterval(input: string, from = new Date()): number {
  const runs = nextRuns(input, from, 12)
  if (runs.length < 2) return Number.POSITIVE_INFINITY

  let shortest = Number.POSITIVE_INFINITY
  for (let i = 1; i < runs.length; i++) {
    const gap = (runs[i]!.getTime() - runs[i - 1]!.getTime()) / 1000
    if (gap < shortest) shortest = gap
  }
  return shortest
}

/* ------------------------------------------------------------------ *
 * Builder
 * ------------------------------------------------------------------ */

export type Frequency = "hourly" | "daily" | "weekly" | "monthly"

export interface BuilderState {
  frequency: Frequency
  /** "HH:MM". Ignored for hourly. */
  time: string
  /** 0–6, Sunday first. Used by weekly. */
  days: readonly number[]
  /** 1–31. Used by monthly. */
  dayOfMonth: number
}

/** Compose an expression from the visual builder's state. */
export function buildCron({ frequency, time, days, dayOfMonth }: BuilderState): string {
  const [h = 0, m = 0] = time.split(":").map(Number)
  switch (frequency) {
    case "hourly":
      return `${m} * * * *`
    case "daily":
      return `${m} ${h} * * *`
    case "monthly":
      return `${m} ${h} ${dayOfMonth} * *`
    case "weekly":
      return `${m} ${h} * * ${days.length ? [...days].sort((a, b) => a - b).join(",") : "*"}`
  }
}

/**
 * Best-effort inverse of `buildCron`, so switching from the expression layout
 * to the builder does not silently discard the schedule.
 */
export function toBuilderState(input: string): BuilderState | null {
  const parsed = parseCron(input)
  if (!parsed.ok) return null

  const { minute, hour, dayOfMonth, month, dayOfWeek } = parsed.values
  if (minute.length !== 1 || month.length !== 12) return null

  const m = minute[0]!
  const time = (hh: number) => `${pad(hh)}:${pad(m)}`

  if (hour.length === 24 && dayOfMonth.length === 31 && dayOfWeek.length === 7) {
    return { frequency: "hourly", time: time(0), days: [], dayOfMonth: 1 }
  }
  if (hour.length !== 1) return null
  const h = hour[0]!

  if (dayOfMonth.length === 31 && dayOfWeek.length === 7) {
    return { frequency: "daily", time: time(h), days: [], dayOfMonth: 1 }
  }
  if (dayOfMonth.length === 31) {
    return { frequency: "weekly", time: time(h), days: dayOfWeek, dayOfMonth: 1 }
  }
  if (dayOfMonth.length === 1 && dayOfWeek.length === 7) {
    return { frequency: "monthly", time: time(h), days: [], dayOfMonth: dayOfMonth[0]! }
  }
  return null
}
