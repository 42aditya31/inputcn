"use client"

import { useCallback, useMemo, useRef, useState, type ClipboardEvent } from "react"

import { clipboardText } from "@inputcn/core/paste"
import type { BaseFieldProps, Rule } from "@inputcn/core/types"
import { useField, type UseFieldResult } from "@inputcn/core/use-field"
import {
  custom,
  max as maxRule,
  min as minRule,
  multipleOf as multipleOfRule,
  required as requiredRule,
  rules,
} from "@inputcn/core/validity"

import {
  formatDuration,
  fromSegments,
  parseDuration,
  parsePastedDuration,
  toISO8601,
  toSegments,
  type DurationUnit,
} from "./duration.js"

/** Bounds accept human text so the prop reads like the rule: min="5m". */
export type DurationBound = number | string

export interface DurationConstraints {
  min?: DurationBound
  max?: DurationBound
  /** Must be a whole multiple of this. Accepts "15m". */
  multipleOf?: DurationBound
  /** Largest unit shown when formatting. Default "d". */
  maxUnit?: DurationUnit
}

export interface UseDurationInputOptions
  extends BaseFieldProps<number>,
    DurationConstraints {
  /** What a bare number means. Default "m". */
  bareUnit?: DurationUnit
  /** Presets offered by the `presets` layout. */
  presets?: readonly string[]
}

export interface UseDurationInputResult extends UseFieldResult<number> {
  /** Normalised human text for the current value. */
  display: string
  iso: string
  segments: { h: number; m: number; s: number }
  setSegment: (unit: "h" | "m" | "s", n: number) => void
  presets: readonly string[]
  /** The preset matching the current value, if any. */
  activePreset: string | undefined
  applyPreset: (text: string) => void
  inputProps: {
    ref: React.RefObject<HTMLInputElement | null>
    value: string
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    onBlur: () => void
    onPaste: (e: ClipboardEvent<HTMLInputElement>) => void
    autoComplete: "off"
    disabled: boolean | undefined
    readOnly: boolean | undefined
    placeholder: string | undefined
  }
}

const DEFAULT_PRESETS = ["5m", "15m", "30m", "1h", "4h", "1d"] as const

/** Bounds may be written as text; resolve once. */
function seconds(bound: DurationBound | undefined, bareUnit: DurationUnit): number | undefined {
  if (bound === undefined) return undefined
  return typeof bound === "number" ? bound : parseDuration(bound, { bareUnit })
}

export function useDurationInput(
  options: UseDurationInputOptions,
): UseDurationInputResult {
  const {
    bareUnit = "m",
    maxUnit = "d",
    min,
    max,
    multipleOf,
    presets = DEFAULT_PRESETS,
    required,
    validate,
    disabled,
    readOnly,
    placeholder,
    ...base
  } = options

  const minS = useMemo(() => seconds(min, bareUnit), [min, bareUnit])
  const maxS = useMemo(() => seconds(max, bareUnit), [max, bareUnit])
  const stepS = useMemo(() => seconds(multipleOf, bareUnit), [multipleOf, bareUnit])

  const asText = useCallback((s: number) => formatDuration(s, { maxUnit }), [maxUnit])

  const ruleList = useMemo<ReadonlyArray<Rule<number>>>(
    () =>
      rules<number>(
        requiredRule<number>(required),
        minRule(minS, asText),
        maxRule(maxS, asText),
        multipleOfRule(stepS, asText),
        custom<number>(validate),
      ),
    [required, minS, maxS, stepS, validate, asText],
  )

  const field = useField<number>({
    component: "DurationInput",
    emptyValue: 0,
    rules: ruleList,
    ...base,
    required,
    disabled,
    readOnly,
    serialize: (v) => String(v),
  })

  const { value, setValue } = field
  const ref = useRef<HTMLInputElement | null>(null)

  // While typing, show exactly what was typed — reformatting "2h 3" into
  // "2h 3m" mid-keystroke makes the next character land in the wrong place.
  const [draft, setDraft] = useState<string | null>(null)
  const normalised = formatDuration(value, { maxUnit })
  const display = draft ?? normalised

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled || readOnly) return
      const text = e.currentTarget.value
      setDraft(text)
      setValue(parseDuration(text, { bareUnit }))
    },
    [disabled, readOnly, setValue, bareUnit],
  )

  const onBlur = useCallback(() => setDraft(null), [])

  const onPaste = useCallback(
    (e: ClipboardEvent<HTMLInputElement>) => {
      if (disabled || readOnly) return
      const text = clipboardText(e)
      if (!text) return
      e.preventDefault()
      const parsed = parsePastedDuration(text, { bareUnit })
      if (parsed === null) return
      setDraft(null)
      setValue(parsed)
    },
    [disabled, readOnly, setValue, bareUnit],
  )

  const segments = useMemo(() => toSegments(value), [value])

  const setSegment = useCallback(
    (unit: "h" | "m" | "s", n: number) => {
      if (disabled || readOnly) return
      const next = { ...toSegments(value), [unit]: Math.max(0, n) }
      setDraft(null)
      setValue(fromSegments(next.h, next.m, next.s))
    },
    [disabled, readOnly, value, setValue],
  )

  const presetSeconds = useMemo(
    () => presets.map((p) => parseDuration(p, { bareUnit })),
    [presets, bareUnit],
  )

  const activePreset = useMemo(() => {
    const i = presetSeconds.indexOf(value)
    return i === -1 ? undefined : presets[i]
  }, [presetSeconds, presets, value])

  const applyPreset = useCallback(
    (text: string) => {
      if (disabled || readOnly) return
      setDraft(null)
      setValue(parseDuration(text, { bareUnit }))
    },
    [disabled, readOnly, setValue, bareUnit],
  )

  const inputProps = useMemo(
    () => ({
      ref,
      value: display,
      onChange,
      onBlur,
      onPaste,
      autoComplete: "off" as const,
      disabled,
      readOnly,
      placeholder: placeholder ?? "2h 30m",
    }),
    [display, onChange, onBlur, onPaste, disabled, readOnly, placeholder],
  )

  return {
    ...field,
    display,
    iso: toISO8601(value),
    segments,
    setSegment,
    presets,
    activePreset,
    applyPreset,
    inputProps,
  }
}
