/**
 * Zod companion for ColorInput.
 *
 * Runs the same `parseColor` and `contrastRatio` the component runs, so the
 * schema and the field cannot disagree about whether a colour is acceptable.
 */

import { z } from "zod"

import { contrastRatio, parseColor, toHex } from "./color.js"

export interface ColorSchemaOptions {
  /** Require a minimum WCAG ratio against this colour. */
  contrastAgainst?: string
  minContrast?: number
  /** Restrict to a palette. Compared as canonical hex, so case does not matter. */
  allowed?: readonly string[]
  allowEmpty?: boolean
  message?: string
}

export function colorSchema(options: ColorSchemaOptions = {}) {
  const { contrastAgainst, minContrast, allowed, allowEmpty = false, message } = options

  const against = contrastAgainst ? parseColor(contrastAgainst) : null
  const allowedSet = allowed
    ? new Set(allowed.map((c) => toHex(parseColor(c) ?? { r: 0, g: 0, b: 0, a: 1 })))
    : null

  return z.string().superRefine((value, ctx) => {
    if (!value) {
      if (!allowEmpty) {
        ctx.addIssue({ code: "custom", message: message ?? "This field is required" })
      }
      return
    }

    const parsed = parseColor(value)
    if (!parsed) {
      ctx.addIssue({ code: "custom", message: message ?? "Enter a valid colour" })
      return
    }

    if (allowedSet && !allowedSet.has(toHex(parsed))) {
      ctx.addIssue({ code: "custom", message: message ?? "Not an allowed colour" })
      return
    }

    if (against && minContrast !== undefined) {
      const ratio = contrastRatio(parsed, against)
      if (ratio < minContrast) {
        ctx.addIssue({
          code: "custom",
          message:
            message ??
            `Contrast is ${Math.round(ratio * 100) / 100}:1 against ${contrastAgainst} — needs ${minContrast}:1`,
        })
      }
    }
  })
}

/** The value type ColorInput emits. */
export type ColorValue = string
