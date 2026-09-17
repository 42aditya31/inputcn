"use client"

import { useCallback, useMemo, type ClipboardEvent } from "react"

import {
  formatMask,
  isMaskComplete,
  maskCapacity,
  maskPlaceholder,
  maskSignificance,
  parseMask,
} from "@inputcn/core/mask"
import { clipboardText, scrub } from "@inputcn/core/paste"
import type { BaseFieldProps, Rule } from "@inputcn/core/types"
import { useField, type UseFieldResult } from "@inputcn/core/use-field"
import { useMaskedValue } from "@inputcn/core/use-masked-value"
import {
  custom,
  maxLength as maxLengthRule,
  minLength as minLengthRule,
  pattern as patternRule,
  required as requiredRule,
  rules,
} from "@inputcn/core/validity"

export interface MaskedConstraints {
  /** Require every slot in the mask to be filled. */
  complete?: boolean
  minLength?: number
  maxLength?: number
  /** Tested against the RAW (unmasked) value. */
  pattern?: RegExp
}

export interface UseMaskedInputOptions
  extends BaseFieldProps<string>,
    MaskedConstraints {
  /**
   * Template. `#` digit, `A` letter, `*` alphanumeric, `\` escapes.
   * e.g. `"###.###.###-##"`, `"##/##/####"`, `"AA-####"`.
   */
  mask: string
}

export interface UseMaskedInputResult extends UseFieldResult<string> {
  /** True when every slot is filled. */
  complete: boolean
  capacity: number
  inputProps: {
    ref: React.RefObject<HTMLInputElement | null>
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    defaultValue: string
    onPaste: (e: ClipboardEvent<HTMLInputElement>) => void
    placeholder: string | undefined
    autoComplete: "off"
    disabled: boolean | undefined
    readOnly: boolean | undefined
  }
}

const EMPTY = ""

/**
 * A generic template-masked text field.
 *
 * Emits the RAW value — `"12345678901"`, not `"123.456.789-01"`. The mask is
 * presentation; the canonical value is what you store.
 */
export function useMaskedInput(options: UseMaskedInputOptions): UseMaskedInputResult {
  const {
    mask,
    complete: completeConstraint,
    minLength,
    maxLength,
    pattern,
    required,
    validate,
    disabled,
    readOnly,
    placeholder,
    ...base
  } = options

  const capacity = maskCapacity(mask)
  const significance = useMemo(() => maskSignificance(mask), [mask])

  const ruleList = useMemo<ReadonlyArray<Rule<string>>>(
    () =>
      rules<string>(
        requiredRule<string>(required),
        completeConstraint && {
          rule: "incomplete",
          test: (v: string) => isMaskComplete(v, mask),
        },
        minLengthRule(minLength),
        maxLengthRule(maxLength),
        patternRule(pattern),
        custom<string>(validate),
      ),
    [required, completeConstraint, mask, minLength, maxLength, pattern, validate],
  )

  const field = useField<string>({
    component: "MaskedInput",
    emptyValue: EMPTY,
    rules: ruleList,
    ...base,
    required,
    disabled,
    readOnly,
  })

  const { value, setValue } = field

  const format = useCallback((raw: string) => formatMask(raw, mask), [mask])
  const parse = useCallback((text: string) => parseMask(text, mask), [mask])

  const masked = useMaskedValue<string>({
    value,
    format,
    parse,
    onChange: setValue,
    isSignificant: significance,
    disabled,
    readOnly,
  })

  // Paste goes through `scrub` first so clipboard junk from Word or Notion
  // does not silently fail to match the mask's slot types.
  const onPaste = useCallback(
    (e: ClipboardEvent<HTMLInputElement>) => {
      if (disabled || readOnly) return
      const text = clipboardText(e)
      if (!text) return
      e.preventDefault()
      setValue(parseMask(scrub(text), mask))
    },
    [disabled, readOnly, mask, setValue],
  )

  const inputProps = useMemo(
    () => ({
      ...masked.inputProps,
      onPaste,
      placeholder: placeholder ?? maskPlaceholder(mask),
      autoComplete: "off" as const,
      disabled,
      readOnly,
    }),
    [masked.inputProps, onPaste, placeholder, mask, disabled, readOnly],
  )

  return {
    ...field,
    complete: isMaskComplete(value, mask),
    capacity,
    inputProps,
  }
}

/** Ready-made masks for the formats people ask for most. */
export const MASKS = {
  dateISO: "####-##-##",
  dateUS: "##/##/####",
  dateEU: "##/##/####",
  time24: "##:##",
  time24s: "##:##:##",
  zipPlus4: "#####-####",
  cpf: "###.###.###-##",
  cnpj: "##.###.###/####-##",
  ssn: "###-##-####",
  ein: "##-#######",
  ukPostcode: "AA## #AA",
  licenceKey: "****-****-****-****",
} as const satisfies Record<string, string>

export type MaskPreset = keyof typeof MASKS
