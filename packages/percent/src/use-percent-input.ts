"use client"

import { useCallback, useMemo, useRef, useState, type ClipboardEvent } from "react"

import { clipboardText } from "@inputcn/core/paste"
import type { BaseFieldProps, Rule } from "@inputcn/core/types"
import { useField, type UseFieldResult } from "@inputcn/core/use-field"
import {
  custom,
  integer as integerRule,
  max as maxRule,
  min as minRule,
  positive as positiveRule,
  required as requiredRule,
  rules,
} from "@inputcn/core/validity"

import {
  formatPercent,
  parsePastedPercent,
  parsePercent,
  withinPrecision,
} from "./percent.js"

export interface PercentConstraints {
  /** As a fraction: 0.05 means 5%. */
  min?: number
  /** As a fraction: 1 means 100%. */
  max?: number
  positive?: boolean
  /** Reject fractional percentages — 12% yes, 12.5% no. */
  integer?: boolean
  /** Maximum decimal places in the displayed percentage. Default 2. */
  precision?: number
}

export interface UsePercentInputOptions
  extends BaseFieldProps<number>,
    PercentConstraints {
  locale?: string
}

export interface UsePercentInputResult extends UseFieldResult<number> {
  /** The percentage string currently shown. */
  display: string
  inputProps: {
    ref: React.RefObject<HTMLInputElement | null>
    value: string
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    onBlur: () => void
    onPaste: (e: ClipboardEvent<HTMLInputElement>) => void
    inputMode: "decimal"
    autoComplete: "off"
    disabled: boolean | undefined
    readOnly: boolean | undefined
    placeholder: string | undefined
  }
}

const ALLOWED = /^[\d.,]*$/

export function usePercentInput(
  options: UsePercentInputOptions,
): UsePercentInputResult {
  const {
    locale = "en-US",
    precision = 2,
    min,
    max,
    positive,
    integer,
    required,
    validate,
    disabled,
    readOnly,
    placeholder,
    ...base
  } = options

  const asPercent = useCallback(
    (fraction: number) => `${formatPercent(fraction, { locale, precision })}%`,
    [locale, precision],
  )

  const ruleList = useMemo<ReadonlyArray<Rule<number>>>(
    () =>
      rules<number>(
        requiredRule<number>(required),
        minRule(min, asPercent),
        maxRule(max, asPercent),
        positiveRule(positive),
        integer && {
          rule: "integer",
          test: (v: number) => Number.isInteger(v * 100),
        },
        {
          rule: "precision",
          params: { precision },
          test: (v: number) => withinPrecision(v, precision),
        },
        custom<number>(validate),
      ),
    [required, min, max, positive, integer, precision, validate, asPercent],
  )

  const field = useField<number>({
    component: "PercentInput",
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

  /**
   * Draft holds what the user is literally typing. Without it, "12." would be
   * parsed to 0.12 and reformatted to "12" the instant the dot is typed,
   * making a decimal impossible to enter.
   */
  const [draft, setDraft] = useState<string | null>(null)
  const display = draft ?? (value === 0 ? "" : formatPercent(value, { locale, precision }))

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled || readOnly) return
      const text = e.currentTarget.value
      if (!ALLOWED.test(text)) return
      setDraft(text)
      setValue(parsePercent(text, { precision }))
    },
    [disabled, readOnly, setValue, precision],
  )

  // Committing on blur is what lets the draft exist without the value ever
  // disagreeing with it.
  const onBlur = useCallback(() => setDraft(null), [])

  const onPaste = useCallback(
    (e: ClipboardEvent<HTMLInputElement>) => {
      if (disabled || readOnly) return
      const text = clipboardText(e)
      if (!text) return
      e.preventDefault()
      const parsed = parsePastedPercent(text, { precision })
      if (parsed === null) return
      setDraft(null)
      setValue(parsed)
    },
    [disabled, readOnly, setValue, precision],
  )

  const inputProps = useMemo(
    () => ({
      ref,
      value: display,
      onChange,
      onBlur,
      onPaste,
      inputMode: "decimal" as const,
      autoComplete: "off" as const,
      disabled,
      readOnly,
      placeholder: placeholder ?? "0",
    }),
    [display, onChange, onBlur, onPaste, disabled, readOnly, placeholder],
  )

  return { ...field, display, inputProps }
}
