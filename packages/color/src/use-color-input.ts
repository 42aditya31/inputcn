"use client"

import { useCallback, useMemo, useRef, useState, type ClipboardEvent } from "react"

import { clipboardText } from "@inputcn/core/paste"
import type { BaseFieldProps, Rule } from "@inputcn/core/types"
import { useField, type UseFieldResult } from "@inputcn/core/use-field"
import { custom, required as requiredRule, rules } from "@inputcn/core/validity"

import {
  DEFAULT_SWATCHES,
  bestForeground,
  contrastRatio,
  format,
  parseColor,
  parsePastedColor,
  toHex,
  wcagLevel,
  type ColorFormat,
  type RGB,
  type WcagLevel,
} from "./color.js"

export interface ColorConstraints {
  /**
   * Check contrast against this colour. The differentiating constraint: it
   * stops a customer picking a brand colour nobody can read.
   */
  contrastAgainst?: string
  /** Minimum WCAG ratio. 4.5 is AA for body text, 3 is AA for large text. */
  minContrast?: number
  /** Restrict to a palette. */
  allowed?: readonly string[]
}

export interface UseColorInputOptions
  extends BaseFieldProps<string>,
    ColorConstraints {
  /** Output format for `onChange`. Default "hex" — the only lossless one. */
  outputFormat?: ColorFormat
  /** Palette shown beneath the field. */
  swatches?: readonly string[]
}

export interface UseColorInputResult extends UseFieldResult<string> {
  /** Parsed value, or null while the text is incomplete. */
  rgb: RGB | null
  /** Canonical hex for the preview swatch, or "" when unparseable. */
  hex: string
  /** Readable text colour on top of the current value. */
  readableOn: "#000000" | "#FFFFFF"
  contrast: { ratio: number; level: WcagLevel; against: string } | null
  swatches: readonly string[]
  selectSwatch: (value: string) => void
  inputProps: {
    ref: React.RefObject<HTMLInputElement | null>
    value: string
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    onBlur: () => void
    onPaste: (e: ClipboardEvent<HTMLInputElement>) => void
    spellCheck: false
    autoComplete: "off"
    disabled: boolean | undefined
    readOnly: boolean | undefined
    placeholder: string | undefined
  }
  nativeProps: {
    type: "color"
    value: string
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    disabled: boolean | undefined
    tabIndex: -1
    "aria-label": string
  }
}

const EMPTY = ""
const BLACK: RGB = { r: 0, g: 0, b: 0, a: 1 }

/**
 * Contrast is a WARNING, not an error: a brand colour that fails AA is a
 * decision to reconsider, not an input to refuse. The measured ratio is
 * captured on the failing call so the message can quote it.
 */
function makeContrastRule(
  against: RGB,
  minContrast: number,
  againstLabel: string,
): Rule<string> {
  let measured = 0
  return {
    rule: "colorContrast",
    warning: true,
    get params() {
      return {
        against: againstLabel,
        minContrast,
        ratio: Math.round(measured * 100) / 100,
      }
    },
    test: (v: string) => {
      const c = parseColor(v)
      if (c === null) return true
      measured = contrastRatio(c, against)
      return measured >= minContrast
    },
  } as Rule<string>
}

export function useColorInput(options: UseColorInputOptions): UseColorInputResult {
  const {
    contrastAgainst,
    minContrast,
    allowed,
    outputFormat = "hex",
    swatches = DEFAULT_SWATCHES,
    required,
    validate,
    disabled,
    readOnly,
    placeholder,
    ...base
  } = options

  const against = useMemo(
    () => (contrastAgainst ? parseColor(contrastAgainst) : null),
    [contrastAgainst],
  )

  const allowedSet = useMemo(
    () => (allowed ? new Set(allowed.map((c) => toHex(parseColor(c) ?? BLACK))) : null),
    [allowed],
  )

  const ruleList = useMemo<ReadonlyArray<Rule<string>>>(
    () =>
      rules<string>(
        requiredRule<string>(required),
        { rule: "colorFormat", test: (v) => parseColor(v) !== null },
        allowedSet && {
          rule: "oneOf",
          params: { allowed },
          test: (v) => {
            const c = parseColor(v)
            return c === null || allowedSet.has(toHex(c))
          },
        },
        against && minContrast !== undefined && makeContrastRule(against, minContrast, contrastAgainst!),
        custom<string>(validate),
      ),
    [required, allowedSet, allowed, against, minContrast, contrastAgainst, validate],
  )

  const field = useField<string>({
    component: "ColorInput",
    emptyValue: EMPTY,
    rules: ruleList,
    ...base,
    required,
    disabled,
    readOnly,
  })

  const { value, setValue } = field
  const ref = useRef<HTMLInputElement | null>(null)

  const rgb = useMemo(() => parseColor(value), [value])
  const hex = rgb ? toHex(rgb) : ""
  const readableOn = rgb ? bestForeground(rgb) : "#000000"

  const contrast = useMemo(() => {
    if (!rgb || !against || !contrastAgainst) return null
    const ratio = contrastRatio(rgb, against)
    return { ratio: Math.round(ratio * 100) / 100, level: wcagLevel(ratio), against: contrastAgainst }
  }, [rgb, against, contrastAgainst])

  /**
   * Draft holds partial text. Without it, typing "#3" would be unparseable,
   * emit nothing, and the field would fight the user on every keystroke.
   */
  const [draft, setDraft] = useState<string | null>(null)
  const display = draft ?? value

  const emit = useCallback(
    (c: RGB) => setValue(format(c, outputFormat)),
    [setValue, outputFormat],
  )

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled || readOnly) return
      const text = e.currentTarget.value
      setDraft(text)
      const parsed = parseColor(text)
      // Emit the canonical form when it parses, and the raw text when it does
      // not. Emitting "" for unparseable input would leave the value empty,
      // which skips every non-required rule and silently shows no error.
      setValue(parsed ? format(parsed, outputFormat) : text)
    },
    [disabled, readOnly, setValue, outputFormat],
  )

  // Normalising on blur is what turns "3a3fd6" into "#3A3FD6".
  const onBlur = useCallback(() => setDraft(null), [])

  const onPaste = useCallback(
    (e: ClipboardEvent<HTMLInputElement>) => {
      if (disabled || readOnly) return
      const text = clipboardText(e)
      if (!text) return
      e.preventDefault()
      const parsed = parsePastedColor(text)
      if (!parsed) return
      setDraft(null)
      emit(parsed)
    },
    [disabled, readOnly, emit],
  )

  const selectSwatch = useCallback(
    (swatch: string) => {
      if (disabled || readOnly) return
      const parsed = parseColor(swatch)
      if (!parsed) return
      setDraft(null)
      emit(parsed)
    },
    [disabled, readOnly, emit],
  )

  const onNativeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const parsed = parseColor(e.currentTarget.value)
      if (!parsed) return
      setDraft(null)
      emit(parsed)
    },
    [emit],
  )

  const inputProps = useMemo(
    () => ({
      ref,
      value: display,
      onChange,
      onBlur,
      onPaste,
      spellCheck: false as const,
      autoComplete: "off" as const,
      disabled,
      readOnly,
      placeholder: placeholder ?? "#000000",
    }),
    [display, onChange, onBlur, onPaste, disabled, readOnly, placeholder],
  )

  const nativeProps = useMemo(
    () => ({
      type: "color" as const,
      // <input type=color> only accepts 6-digit hex; alpha would break it.
      value: hex.slice(0, 7) || "#000000",
      onChange: onNativeChange,
      disabled,
      tabIndex: -1 as const,
      // The text field is the accessible control; this is a mouse convenience,
      // so it is removed from the tab order and labelled for anyone who lands
      // on it anyway.
      "aria-label": "Pick a colour visually",
    }),
    [hex, onNativeChange, disabled],
  )

  return {
    ...field,
    rgb,
    hex,
    readableOn,
    contrast,
    swatches,
    selectSwatch,
    inputProps,
    nativeProps,
  }
}
