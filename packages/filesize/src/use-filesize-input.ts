"use client"

import { useCallback, useMemo, useRef, useState, type ClipboardEvent } from "react"

import { clipboardText } from "@inputcn/core/paste"
import type { BaseFieldProps, Rule } from "@inputcn/core/types"
import { useField, type UseFieldResult } from "@inputcn/core/use-field"
import {
  custom,
  max as maxRule,
  min as minRule,
  required as requiredRule,
  rules,
} from "@inputcn/core/validity"

import {
  formatFileSize,
  groupBytes,
  parseFileSize,
  parsePastedFileSize,
  type ParseOptions,
} from "./filesize.js"

/** Bounds accept human text so the prop reads like the rule: max="100MB". */
export type SizeBound = number | string

export interface FileSizeConstraints {
  min?: SizeBound
  max?: SizeBound
}

export interface UseFileSizeInputOptions
  extends BaseFieldProps<number>,
    FileSizeConstraints {
  /** Use KiB/MiB/GiB and read ambiguous units as powers of 1024. Default false. */
  binary?: boolean
  /** Unit assumed when the user types a bare number. Default "MB". */
  bareUnit?: string
  /** Decimals when formatting. Default 2. */
  precision?: number
  /** Grouping locale for the raw byte readout. Default "en-US". */
  locale?: string
}

export interface UseFileSizeInputResult extends UseFieldResult<number> {
  /** Normalised human text for the current value. */
  display: string
  /** The byte count, for a secondary readout. */
  bytes: number
  /** The byte count, grouped deterministically for display. */
  bytesLabel: string
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

function toBytes(bound: SizeBound | undefined, opts: ParseOptions): number | undefined {
  if (bound === undefined) return undefined
  if (typeof bound === "number") return bound
  return parseFileSize(bound, opts) ?? undefined
}

export function useFileSizeInput(
  options: UseFileSizeInputOptions,
): UseFileSizeInputResult {
  const {
    binary = false,
    bareUnit = "MB",
    precision = 2,
    locale = "en-US",
    min,
    max,
    required,
    validate,
    disabled,
    readOnly,
    placeholder,
    ...base
  } = options

  const parseOpts = useMemo<ParseOptions>(() => ({ binary, bareUnit }), [binary, bareUnit])
  const fmt = useCallback(
    (b: number) => formatFileSize(b, { binary, precision }),
    [binary, precision],
  )

  const minB = useMemo(() => toBytes(min, parseOpts), [min, parseOpts])
  const maxB = useMemo(() => toBytes(max, parseOpts), [max, parseOpts])

  const ruleList = useMemo<ReadonlyArray<Rule<number>>>(
    () =>
      rules<number>(
        requiredRule<number>(required),
        minRule(minB, fmt),
        maxRule(maxB, fmt),
        custom<number>(validate),
      ),
    [required, minB, maxB, fmt, validate],
  )

  const field = useField<number>({
    component: "FileSizeInput",
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

  // Draft keeps what was typed; without it "25 M" would reformat mid-word.
  const [draft, setDraft] = useState<string | null>(null)
  const normalised = value === 0 ? "" : fmt(value)
  const display = draft ?? normalised

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled || readOnly) return
      const text = e.currentTarget.value
      setDraft(text)
      const parsed = parseFileSize(text, parseOpts)
      // null means unparseable — keep the last good value rather than zeroing
      // it, so a half-typed unit does not wipe the field.
      if (parsed !== null) setValue(parsed)
      else if (text.trim() === "") setValue(0)
    },
    [disabled, readOnly, setValue, parseOpts],
  )

  const onBlur = useCallback(() => setDraft(null), [])

  const onPaste = useCallback(
    (e: ClipboardEvent<HTMLInputElement>) => {
      if (disabled || readOnly) return
      const text = clipboardText(e)
      if (!text) return
      e.preventDefault()
      const parsed = parsePastedFileSize(text, parseOpts)
      if (parsed === null) return
      setDraft(null)
      setValue(parsed)
    },
    [disabled, readOnly, setValue, parseOpts],
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
      placeholder: placeholder ?? (binary ? "25 MiB" : "25 MB"),
    }),
    [display, onChange, onBlur, onPaste, disabled, readOnly, placeholder, binary],
  )

  return {
    ...field,
    display: normalised,
    bytes: value,
    bytesLabel: groupBytes(value, locale),
    inputProps,
  }
}
