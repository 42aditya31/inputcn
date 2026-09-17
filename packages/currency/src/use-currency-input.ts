"use client"

import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react"

import { clipboardText } from "@inputcn/core/paste"
import type { BaseFieldProps, Rule } from "@inputcn/core/types"
import { useField, type UseFieldResult } from "@inputcn/core/use-field"
import {
  custom,
  integer as integerRule,
  max as maxRule,
  min as minRule,
  multipleOf as multipleOfRule,
  negative as negativeRule,
  nonZero as nonZeroRule,
  positive as positiveRule,
  required as requiredRule,
  rules,
} from "@inputcn/core/validity"

import {
  currencySymbol,
  formatMinor,
  fractionDigits,
  negate,
  parsePastedMoney,
  popDigit,
  pushDigit,
} from "./currency.js"

export interface CurrencyConstraints {
  /** Minor units. */
  min?: number
  /** Minor units. */
  max?: number
  positive?: boolean
  negative?: boolean
  nonZero?: boolean
  /** Reject fractional currency units (e.g. whole dollars only). */
  wholeUnitsOnly?: boolean
  /** Minor units the value must be a multiple of. */
  multipleOf?: number
}

export interface UseCurrencyInputOptions
  extends BaseFieldProps<number>,
    CurrencyConstraints {
  /** ISO 4217. Default "USD". */
  currency?: string
  /** BCP 47. Default "en-US". */
  locale?: string
  /** Allow typing a negative value with "-". Default false. */
  allowNegative?: boolean
  /** Stepper increment in minor units. Default one whole unit. */
  step?: number
}

export interface UseCurrencyInputResult extends UseFieldResult<number> {
  currency: string
  locale: string
  symbol: string
  /** The formatted string currently shown. */
  display: string
  fractionDigits: number
  step: (direction: 1 | -1) => void
  inputProps: {
    ref: React.RefObject<HTMLInputElement | null>
    value: string
    onChange: () => void
    onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void
    onPaste: (e: ClipboardEvent<HTMLInputElement>) => void
    inputMode: "decimal"
    autoComplete: "off"
    disabled: boolean | undefined
    readOnly: boolean | undefined
    placeholder: string | undefined
  }
  sideEffect: { from: string; to: string; label: string } | null
  dismissSideEffect: () => void
  undoPaste: () => void
}

const ALLOWED_KEYS = new Set([
  "Tab",
  "Enter",
  "Escape",
  "ArrowLeft",
  "ArrowRight",
  "Home",
  "End",
])

export function useCurrencyInput(
  options: UseCurrencyInputOptions,
): UseCurrencyInputResult {
  const {
    currency = "USD",
    locale = "en-US",
    allowNegative = false,
    step: stepProp,
    min,
    max,
    positive,
    negative,
    nonZero,
    wholeUnitsOnly,
    multipleOf,
    required,
    validate,
    disabled,
    readOnly,
    placeholder,
    ...base
  } = options

  const digits = fractionDigits(currency, locale)
  const factor = 10 ** digits
  const symbol = useMemo(() => currencySymbol(currency, locale), [currency, locale])

  const fmt = useCallback(
    (minor: number) => formatMinor(minor, currency, { locale }),
    [currency, locale],
  )

  const ruleList = useMemo<ReadonlyArray<Rule<number>>>(
    () =>
      rules<number>(
        requiredRule<number>(required),
        minRule(min, fmt),
        maxRule(max, fmt),
        positiveRule(positive),
        negativeRule(negative),
        nonZeroRule(nonZero),
        wholeUnitsOnly && {
          rule: "integer",
          test: (v: number) => v % factor === 0,
        },
        multipleOfRule(multipleOf, fmt),
        custom<number>(validate),
      ),
    [required, min, max, positive, negative, nonZero, wholeUnitsOnly, multipleOf, validate, fmt, factor],
  )

  const field = useField<number>({
    component: "CurrencyInput",
    emptyValue: 0,
    rules: ruleList,
    ...base,
    required,
    disabled,
    readOnly,
    // Emit a plain integer to FormData, never a formatted string.
    serialize: (v) => String(v),
  })

  const { value, setValue } = field
  const ref = useRef<HTMLInputElement | null>(null)
  const display = value === 0 ? "" : fmt(value)

  /**
   * Digit accumulator. The input is read-only to the keyboard in the usual
   * sense: we intercept keys and rebuild the number, so the caret never has
   * anywhere to drift to.
   */
  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (disabled || readOnly) return
      const k = e.key

      if (k >= "0" && k <= "9") {
        e.preventDefault()
        setValue(pushDigit(value, Number(k)))
        return
      }
      if (k === "Backspace") {
        e.preventDefault()
        setValue(popDigit(value))
        return
      }
      if (k === "Delete") {
        e.preventDefault()
        setValue(0)
        return
      }
      if (allowNegative && (k === "-" || k === "Minus")) {
        e.preventDefault()
        setValue(negate(value))
        return
      }
      if (k === "ArrowUp") {
        e.preventDefault()
        setValue(value + (stepProp ?? factor))
        return
      }
      if (k === "ArrowDown") {
        e.preventDefault()
        const next = value - (stepProp ?? factor)
        setValue(!allowNegative && next < 0 ? 0 : next)
        return
      }
      // Let shortcuts and navigation through; swallow everything else so
      // stray letters never appear in a money field.
      if (!ALLOWED_KEYS.has(k) && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
      }
    },
    [disabled, readOnly, value, setValue, allowNegative, stepProp, factor],
  )

  const step = useCallback(
    (direction: 1 | -1) => {
      if (disabled || readOnly) return
      const next = value + direction * (stepProp ?? factor)
      setValue(!allowNegative && next < 0 ? 0 : next)
    },
    [disabled, readOnly, value, setValue, stepProp, factor, allowNegative],
  )

  /* ---------------- smart paste ---------------- */

  const [sideEffect, setSideEffect] =
    useState<UseCurrencyInputResult["sideEffect"]>(null)
  const undoRef = useRef<number | null>(null)

  const onPaste = useCallback(
    (e: ClipboardEvent<HTMLInputElement>) => {
      if (disabled || readOnly) return
      const text = clipboardText(e)
      if (!text) return
      e.preventDefault()

      const result = parsePastedMoney(text, currency, locale)
      if (result.minor === null) return

      undoRef.current = value
      setValue(result.minor)
      setSideEffect(
        result.switchedTo
          ? {
              from: currency,
              to: result.switchedTo,
              label: `Detected ${result.switchedTo}`,
            }
          : null,
      )
    },
    [disabled, readOnly, currency, locale, value, setValue],
  )

  const dismissSideEffect = useCallback(() => setSideEffect(null), [])

  const undoPaste = useCallback(() => {
    if (undoRef.current === null) return
    setValue(undoRef.current)
    undoRef.current = null
    setSideEffect(null)
  }, [setValue])

  const inputProps = useMemo(
    () => ({
      ref,
      value: display,
      // Controlled with an intercepted keydown: onChange exists only to keep
      // React from warning about a controlled input with no handler.
      onChange: () => {},
      onKeyDown,
      onPaste,
      inputMode: "decimal" as const,
      autoComplete: "off" as const,
      disabled,
      readOnly,
      placeholder: placeholder ?? fmt(0),
    }),
    [display, onKeyDown, onPaste, disabled, readOnly, placeholder, fmt],
  )

  return {
    ...field,
    currency,
    locale,
    symbol,
    display,
    fractionDigits: digits,
    step,
    inputProps,
    sideEffect,
    dismissSideEffect,
    undoPaste,
  }
}
