"use client"

import { useCallback, useMemo, useRef, useState, type ClipboardEvent } from "react"

import { clipboardText } from "@inputcn/core/paste"
import type { BaseFieldProps, Rule } from "@inputcn/core/types"
import { useField, type UseFieldResult } from "@inputcn/core/use-field"
import { useMaskedValue } from "@inputcn/core/use-masked-value"
import { custom, required as requiredRule, rules } from "@inputcn/core/validity"

import {
  detectBrand,
  formatCard,
  formatExpiry,
  isExpired,
  isValidLength,
  luhn,
  maxLengthOf,
  parseExpiry,
  parsePastedCard,
  UNKNOWN_BRAND,
  type BrandSpec,
  type CardBrand,
} from "./card.js"

export interface CardConstraints {
  /** Restrict to the brands your PSP actually accepts. */
  brands?: readonly CardBrand[]
  /** Reject a card whose expiry has passed. Requires an expiry value. */
  notExpired?: boolean
  /** Require the CVC to be filled to the brand's length. */
  requireCvc?: boolean
}

export interface UseCardInputOptions
  extends BaseFieldProps<string>,
    CardConstraints {
  /** Expiry as typed, e.g. "04 / 28". Controlled separately from the number. */
  expiry?: string
  defaultExpiry?: string
  onExpiryChange?: (value: string) => void
  cvc?: string
  defaultCvc?: string
  onCvcChange?: (value: string) => void
}

export interface UseCardInputResult extends UseFieldResult<string> {
  brand: BrandSpec | undefined
  /** Never undefined — falls back to a neutral 4-4-4-4 layout. */
  layout: BrandSpec
  expiry: string
  cvc: string
  numberProps: {
    ref: React.RefObject<HTMLInputElement | null>
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    defaultValue: string
    onPaste: (e: ClipboardEvent<HTMLInputElement>) => void
    inputMode: "numeric"
    autoComplete: "cc-number"
    placeholder: string
    disabled: boolean | undefined
    readOnly: boolean | undefined
  }
  expiryProps: {
    ref: React.RefObject<HTMLInputElement | null>
    value: string
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    inputMode: "numeric"
    autoComplete: "cc-exp"
    placeholder: string
    disabled: boolean | undefined
    readOnly: boolean | undefined
  }
  cvcProps: {
    ref: React.RefObject<HTMLInputElement | null>
    value: string
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    inputMode: "numeric"
    autoComplete: "cc-csc"
    placeholder: string
    maxLength: number
    disabled: boolean | undefined
    readOnly: boolean | undefined
  }
}

const EMPTY = ""

export function useCardInput(options: UseCardInputOptions): UseCardInputResult {
  const {
    brands,
    notExpired,
    requireCvc,
    expiry: expiryProp,
    defaultExpiry,
    onExpiryChange,
    cvc: cvcProp,
    defaultCvc,
    onCvcChange,
    required,
    validate,
    disabled,
    readOnly,
    ...base
  } = options

  const expiryRef = useRef<HTMLInputElement | null>(null)
  const cvcRef = useRef<HTMLInputElement | null>(null)

  /* ---------------- expiry & cvc: controlled or not ---------------- */

  const [expiryState, setExpiryState] = useState(defaultExpiry ?? EMPTY)
  const expiry = expiryProp ?? expiryState
  const setExpiry = useCallback(
    (v: string) => {
      if (disabled || readOnly) return
      if (expiryProp === undefined) setExpiryState(v)
      onExpiryChange?.(v)
    },
    [disabled, readOnly, expiryProp, onExpiryChange],
  )

  const [cvcState, setCvcState] = useState(defaultCvc ?? EMPTY)
  const cvc = cvcProp ?? cvcState
  const setCvc = useCallback(
    (v: string) => {
      if (disabled || readOnly) return
      if (cvcProp === undefined) setCvcState(v)
      onCvcChange?.(v)
    },
    [disabled, readOnly, cvcProp, onCvcChange],
  )

  /* ---------------- brand ---------------- */

  const allowed = useMemo(
    () => (brands ? new Set<CardBrand>(brands) : null),
    [brands],
  )

  /* ---------------- rules ---------------- */

  const brandLabels = useMemo(
    () =>
      brands
        ? brands.map((b) => b.charAt(0).toUpperCase() + b.slice(1)).join(", ")
        : "",
    [brands],
  )

  const ruleList = useMemo<ReadonlyArray<Rule<string>>>(
    () =>
      rules<string>(
        requiredRule<string>(required),
        {
          rule: "cardLength",
          test: (v) => isValidLength(v, detectBrand(v)),
        },
        { rule: "luhn", test: (v) => luhn(v) },
        allowed && {
          rule: "cardBrand",
          params: { brands: brandLabels },
          test: (v) => {
            const b = detectBrand(v)
            return !b || allowed.has(b.brand)
          },
        },
        notExpired && {
          rule: "cardExpired",
          // The number's validity should not depend on a field the user may
          // not have reached yet, so an unparseable expiry is not an error
          // here — `required` on the expiry is the right tool for that.
          test: () => !isExpired(parseExpiry(expiry)),
        },
        requireCvc && {
          rule: "required",
          params: { message: "Enter the security code" },
          test: (v) => cvc.length === (detectBrand(v) ?? UNKNOWN_BRAND).cvcLength,
        },
        custom<string>(validate),
      ),
    [required, allowed, brandLabels, notExpired, expiry, requireCvc, cvc, validate],
  )

  const field = useField<string>({
    component: "CardInput",
    emptyValue: EMPTY,
    rules: ruleList,
    ...base,
    required,
    disabled,
    readOnly,
  })

  const { value, setValue } = field

  const brand = useMemo(() => detectBrand(value), [value])
  const layout = brand ?? UNKNOWN_BRAND

  /* ---------------- the number itself ---------------- */

  const format = useCallback((raw: string) => formatCard(raw, detectBrand(raw)), [])

  const parse = useCallback((text: string) => {
    const d = text.replace(/\D/g, "")
    return d.slice(0, maxLengthOf(detectBrand(d)))
  }, [])

  const masked = useMaskedValue<string>({
    value,
    format,
    parse,
    onChange: (next) => {
      setValue(next)
      // Advance when the number is both a valid length AND passes Luhn.
      //
      // Length alone is wrong: Visa accepts 16, 18 and 19 digits, so a
      // 19-digit card would have focus yanked away at digit 16. Requiring
      // Luhn too means a 16-digit prefix of a longer card almost never
      // advances, while a genuine 16-digit card always does.
      if (isValidLength(next, detectBrand(next)) && luhn(next)) {
        expiryRef.current?.focus()
      }
    },
    disabled,
    readOnly,
  })

  const onNumberPaste = useCallback(
    (e: ClipboardEvent<HTMLInputElement>) => {
      if (disabled || readOnly) return
      const text = clipboardText(e)
      if (!text) return
      e.preventDefault()
      setValue(parse(parsePastedCard(text)))
    },
    [disabled, readOnly, setValue, parse],
  )

  const onExpiryInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.currentTarget.value
      const next = formatExpiry(raw)
      setExpiry(next)
      if (next.replace(/\D/g, "").length === 4) cvcRef.current?.focus()
    },
    [setExpiry],
  )

  const onCvcInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setCvc(e.currentTarget.value.replace(/\D/g, "").slice(0, layout.cvcLength))
    },
    [setCvc, layout.cvcLength],
  )

  const numberProps = useMemo(
    () => ({
      ...masked.inputProps,
      onPaste: onNumberPaste,
      inputMode: "numeric" as const,
      autoComplete: "cc-number" as const,
      placeholder: formatCard("4".repeat(maxLengthOf(layout)), layout).replace(/4/g, "0"),
      disabled,
      readOnly,
    }),
    [masked.inputProps, onNumberPaste, layout, disabled, readOnly],
  )

  return {
    ...field,
    brand,
    layout,
    expiry,
    cvc,
    numberProps,
    expiryProps: {
      ref: expiryRef,
      value: expiry,
      onChange: onExpiryInput,
      inputMode: "numeric" as const,
      autoComplete: "cc-exp" as const,
      placeholder: "MM / YY",
      disabled,
      readOnly,
    },
    cvcProps: {
      ref: cvcRef,
      value: cvc,
      onChange: onCvcInput,
      inputMode: "numeric" as const,
      autoComplete: "cc-csc" as const,
      placeholder: layout.cvcLength === 4 ? "1234" : "123",
      maxLength: layout.cvcLength,
      disabled,
      readOnly,
    },
  }
}
