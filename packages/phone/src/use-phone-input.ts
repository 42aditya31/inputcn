"use client"

import { useCallback, useMemo, useRef, useState, type ClipboardEvent } from "react"

import { clipboardText } from "@inputcn/core/paste"
import { useField, type UseFieldResult } from "@inputcn/core/use-field"
import { useMaskedValue } from "@inputcn/core/use-masked-value"
import { custom, required as requiredRule, rules } from "@inputcn/core/validity"
import type { BaseFieldProps, Rule } from "@inputcn/core/types"

import { countryByIso, filterCountries, type Country } from "./countries.js"
import {
  formatNational,
  fromE164,
  isMobile,
  isValidLength,
  maxLengthOf,
  parseNational,
  parsePastedPhone,
  toE164,
} from "./phone.js"

export interface PhoneConstraints {
  /** Restrict the selector and reject numbers outside the list. */
  countries?: readonly string[]
  /** Reject numbers that look like landlines. */
  mobileOnly?: boolean
  /** Country selected before the user picks one. Defaults to "US". */
  defaultCountry?: string
}

export interface UsePhoneInputOptions
  extends BaseFieldProps<string>,
    PhoneConstraints {}

export interface UsePhoneInputResult extends UseFieldResult<string> {
  country: Country | undefined
  /** Countries offered in the selector, honouring `countries`. */
  available: readonly Country[]
  setCountry: (iso: string) => void
  /** Spread onto the visible <input>. */
  inputProps: {
    ref: React.RefObject<HTMLInputElement | null>
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    defaultValue: string
    onPaste: (e: ClipboardEvent<HTMLInputElement>) => void
    inputMode: "tel"
    autoComplete: "tel-national"
    type: "tel"
    placeholder: string | undefined
    disabled: boolean | undefined
    readOnly: boolean | undefined
  }
  /** Set when the last paste changed country. Must be shown and be undoable. */
  sideEffect: { from: string; to: string; label: string } | null
  dismissSideEffect: () => void
  /** Reverts the last paste, including the country switch. */
  undoPaste: () => void
}

const EMPTY = ""

export function usePhoneInput(options: UsePhoneInputOptions): UsePhoneInputResult {
  const {
    countries,
    mobileOnly,
    defaultCountry = "US",
    required,
    validate,
    disabled,
    readOnly,
    placeholder,
    ...base
  } = options

  const available = useMemo(() => filterCountries(countries), [countries])

  /* ---------------- country: derived from value, overridable ---------------- */

  // The country the user explicitly picked. `null` means "follow the value".
  const [picked, setPicked] = useState<string | null>(null)

  const incoming = base.value ?? base.defaultValue ?? EMPTY
  const parsedIncoming = useMemo(
    () => fromE164(incoming, countryByIso(defaultCountry)),
    [incoming, defaultCountry],
  )

  const country =
    countryByIso(picked ?? undefined) ??
    parsedIncoming.country ??
    countryByIso(defaultCountry) ??
    available[0]

  /* ---------------- validation rules ---------------- */

  const allowedIso = useMemo(
    () => (countries ? new Set(available.map((c) => c.iso)) : null),
    [countries, available],
  )

  const ruleList = useMemo<ReadonlyArray<Rule<string>>>(() => {
    return rules<string>(
      requiredRule<string>(required),
      {
        rule: "phoneFormat",
        test: (v) => {
          const p = fromE164(v, country)
          return isValidLength(p.national, p.country)
        },
      },
      allowedIso && {
        rule: "phoneAllowedCountries",
        params: { countries: available.map((c) => c.iso).join(", ") },
        test: (v) => {
          const p = fromE164(v, country)
          return !p.country || allowedIso.has(p.country.iso)
        },
      },
      mobileOnly && {
        rule: "phoneMobileOnly",
        test: (v) => {
          const p = fromE164(v, country)
          return isMobile(p.national, p.country)
        },
      },
      custom<string>(validate),
    )
  }, [required, country, allowedIso, available, mobileOnly, validate])

  const field = useField<string>({
    component: "PhoneInput",
    emptyValue: EMPTY,
    rules: ruleList,
    ...base,
    required,
    disabled,
    readOnly,
  })

  const { value, setValue } = field

  /* ---------------- masked display ---------------- */

  const format = useCallback(
    (e164: string) => formatNational(fromE164(e164, country).national, country),
    [country],
  )

  const parse = useCallback(
    (text: string) => toE164(parseNational(text, country), country),
    [country],
  )

  const masked = useMaskedValue<string>({
    value,
    format,
    parse,
    onChange: setValue,
    disabled,
    readOnly,
  })

  /* ---------------- country switching ---------------- */

  const setCountry = useCallback(
    (iso: string) => {
      const next = countryByIso(iso)
      if (!next) return
      setPicked(next.iso)
      // Keep the digits the user already typed; re-key them to the new country.
      const national = fromE164(value, country).national.slice(0, maxLengthOf(next))
      setValue(toE164(national, next))
    },
    [value, country, setValue],
  )

  /* ---------------- smart paste (PRD §11.2) ---------------- */

  const [sideEffect, setSideEffect] = useState<UsePhoneInputResult["sideEffect"]>(null)
  const undoRef = useRef<{ value: string; iso: string | null } | null>(null)

  const onPaste = useCallback(
    (e: ClipboardEvent<HTMLInputElement>) => {
      if (disabled || readOnly) return
      const text = clipboardText(e)
      if (!text) return
      e.preventDefault()

      const result = parsePastedPhone(text, country)
      undoRef.current = { value, iso: picked }

      if (result.switchedTo) {
        setPicked(result.switchedTo.iso)
        setSideEffect({
          from: country?.iso ?? "—",
          to: result.switchedTo.iso,
          label: `Switched to ${result.switchedTo.name}`,
        })
      } else {
        setSideEffect(null)
      }

      setValue(toE164(result.national, result.country ?? country))
    },
    [disabled, readOnly, country, value, picked, setValue],
  )

  const dismissSideEffect = useCallback(() => setSideEffect(null), [])

  const undoPaste = useCallback(() => {
    const prev = undoRef.current
    if (!prev) return
    setPicked(prev.iso)
    setValue(prev.value)
    setSideEffect(null)
    undoRef.current = null
  }, [setValue])

  const inputProps = useMemo(
    () => ({
      ...masked.inputProps,
      onPaste,
      inputMode: "tel" as const,
      autoComplete: "tel-national" as const,
      type: "tel" as const,
      placeholder: placeholder ?? country?.mask.replace(/#/g, "0"),
      disabled,
      readOnly,
    }),
    [masked.inputProps, onPaste, placeholder, country, disabled, readOnly],
  )

  return {
    ...field,
    country,
    available,
    setCountry,
    inputProps,
    sideEffect,
    dismissSideEffect,
    undoPaste,
  }
}
