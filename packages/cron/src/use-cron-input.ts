"use client"

import { useCallback, useMemo, useRef, useState, type ClipboardEvent } from "react"

import { clipboardText, scrub } from "@inputcn/core/paste"
import type { BaseFieldProps, Rule } from "@inputcn/core/types"
import { useField, type UseFieldResult } from "@inputcn/core/use-field"
import { custom, required as requiredRule, rules } from "@inputcn/core/validity"

import {
  buildCron,
  describeCron,
  nextRuns,
  parseCron,
  shortestInterval,
  toBuilderState,
  type BuilderState,
  type Frequency,
} from "./cron.js"

/** Bounds accept human text so the prop reads like the rule: minInterval="5m". */
export type IntervalBound = number | string

export interface CronConstraints {
  /**
   * Reject schedules that fire more often than this. The constraint that earns
   * its keep — it stops someone scheduling a job every second and taking down
   * a worker queue.
   */
  minInterval?: IntervalBound
}

export interface UseCronInputOptions
  extends BaseFieldProps<string>,
    CronConstraints {
  /** How many upcoming runs to compute for the preview. Default 3. */
  previewCount?: number
}

export interface UseCronInputResult extends UseFieldResult<string> {
  /** Plain-English description of the current expression. */
  description: string
  valid: boolean
  /** Upcoming fire times. Empty when the expression is invalid. */
  upcoming: Date[]
  /** Builder state, or null when the expression is too complex to represent. */
  builder: BuilderState | null
  setFrequency: (f: Frequency) => void
  setTime: (hhmm: string) => void
  toggleDay: (day: number) => void
  setDayOfMonth: (day: number) => void
  inputProps: {
    ref: React.RefObject<HTMLInputElement | null>
    value: string
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    onPaste: (e: ClipboardEvent<HTMLInputElement>) => void
    spellCheck: false
    autoComplete: "off"
    disabled: boolean | undefined
    readOnly: boolean | undefined
    placeholder: string | undefined
  }
}

const EMPTY = ""
const DEFAULT_BUILDER: BuilderState = {
  frequency: "daily",
  time: "09:00",
  days: [1, 2, 3, 4, 5],
  dayOfMonth: 1,
}

/**
 * Quotes the offending field and what it accepts, rather than just "invalid".
 *
 * Built per call so the captured error lives in a closure, not at module
 * scope — module-level mutable state would leak between component instances
 * and, under SSR, between requests.
 */
function makeFieldRule(): Rule<string> {
  let captured: { field: string; value: string; reason: string } | null = null
  return {
    rule: "cronField",
    get params() {
      return captured ?? {}
    },
    test: (v: string) => {
      const p = parseCron(v)
      const first = p.errors[0]
      captured = first
        ? { field: first.field, value: first.value, reason: first.reason }
        : null
      return p.ok
    },
  } as Rule<string>
}

/** Interval bounds may be written as "5m"; resolve to seconds once. */
function toSeconds(bound: IntervalBound | undefined): number | undefined {
  if (bound === undefined) return undefined
  if (typeof bound === "number") return bound
  const m = /^(\d+(?:\.\d+)?)\s*(s|m|h|d)?$/i.exec(bound.trim())
  if (!m) return undefined
  const n = Number(m[1])
  const unit = (m[2] ?? "m").toLowerCase()
  return n * ({ s: 1, m: 60, h: 3600, d: 86_400 }[unit] ?? 60)
}

export function useCronInput(options: UseCronInputOptions): UseCronInputResult {
  const {
    minInterval,
    previewCount = 3,
    required,
    validate,
    disabled,
    readOnly,
    placeholder,
    ...base
  } = options

  const minSeconds = useMemo(() => toSeconds(minInterval), [minInterval])

  const ruleList = useMemo<ReadonlyArray<Rule<string>>>(
    () =>
      rules<string>(
        requiredRule<string>(required),
        makeFieldRule(),
        minSeconds !== undefined && {
          rule: "cronMinInterval",
          params: { minInterval: typeof minInterval === "string" ? minInterval : `${minSeconds}s` },
          test: (v) => {
            const p = parseCron(v)
            // An invalid expression is the format rule's problem, not this one's.
            return !p.ok || shortestInterval(v) >= minSeconds
          },
        },
        custom<string>(validate),
      ),
    [required, minSeconds, minInterval, validate],
  )

  const field = useField<string>({
    component: "CronInput",
    emptyValue: EMPTY,
    rules: ruleList,
    ...base,
    required,
    disabled,
    readOnly,
  })

  const { value, setValue } = field
  const ref = useRef<HTMLInputElement | null>(null)

  const parsed = useMemo(() => parseCron(value), [value])
  const description = useMemo(() => (value ? describeCron(value) : ""), [value])

  const upcoming = useMemo(
    () => (parsed.ok ? nextRuns(value, new Date(), previewCount) : []),
    [parsed.ok, value, previewCount],
  )

  /* ---------------- builder ---------------- */

  // Derived from the expression where possible, so the two layouts stay in
  // sync. Local state only fills the gaps the expression cannot express.
  const derived = useMemo(() => toBuilderState(value), [value])
  const [fallback, setFallback] = useState<BuilderState>(DEFAULT_BUILDER)
  const builder = derived ?? (value ? null : fallback)

  const applyBuilder = useCallback(
    (next: BuilderState) => {
      if (disabled || readOnly) return
      setFallback(next)
      setValue(buildCron(next))
    },
    [disabled, readOnly, setValue],
  )

  const current = derived ?? fallback

  const setFrequency = useCallback(
    (frequency: Frequency) => applyBuilder({ ...current, frequency }),
    [applyBuilder, current],
  )

  const setTime = useCallback(
    (time: string) => applyBuilder({ ...current, time }),
    [applyBuilder, current],
  )

  const toggleDay = useCallback(
    (day: number) => {
      const has = current.days.includes(day)
      const days = has ? current.days.filter((d) => d !== day) : [...current.days, day]
      applyBuilder({ ...current, days })
    },
    [applyBuilder, current],
  )

  const setDayOfMonth = useCallback(
    (dayOfMonth: number) => applyBuilder({ ...current, dayOfMonth }),
    [applyBuilder, current],
  )

  /* ---------------- text entry ---------------- */

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled || readOnly) return
      setValue(e.currentTarget.value)
    },
    [disabled, readOnly, setValue],
  )

  const onPaste = useCallback(
    (e: ClipboardEvent<HTMLInputElement>) => {
      if (disabled || readOnly) return
      const text = clipboardText(e)
      if (!text) return
      e.preventDefault()
      // Cron expressions get copied out of YAML and crontabs with a command
      // trailing them; keep only the five schedule fields.
      const cleaned = scrub(text).replace(/^\s*[-*]\s*/, "")
      const parts = cleaned.split(/\s+/)
      setValue(parts.length > 5 && parseCron(parts.slice(0, 5).join(" ")).ok
        ? parts.slice(0, 5).join(" ")
        : cleaned)
    },
    [disabled, readOnly, setValue],
  )

  const inputProps = useMemo(
    () => ({
      ref,
      value,
      onChange,
      onPaste,
      spellCheck: false as const,
      autoComplete: "off" as const,
      disabled,
      readOnly,
      placeholder: placeholder ?? "0 9 * * 1-5",
    }),
    [value, onChange, onPaste, disabled, readOnly, placeholder],
  )

  return {
    ...field,
    description,
    valid: parsed.ok,
    upcoming,
    builder,
    setFrequency,
    setTime,
    toggleDay,
    setDayOfMonth,
    inputProps,
  }
}
