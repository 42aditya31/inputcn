/**
 * Zod companion for PercentInput.
 *
 * Validates the canonical value: a FRACTION. `max: 1` means 100%, not 1%.
 * Bounds are expressed the same way the component's props are, which is what
 * lets the parity test assert both paths against one fixture table.
 */

import { z } from "zod"

import { formatPercent, withinPrecision } from "./percent.js"

export interface PercentSchemaOptions {
  /** As a fraction. */
  min?: number
  /** As a fraction. */
  max?: number
  positive?: boolean
  /** Maximum decimal places in the displayed percentage. Default 2. */
  precision?: number
  message?: string
}

export function percentSchema(options: PercentSchemaOptions = {}) {
  const { min, max, positive, precision = 2, message } = options
  const show = (f: number) => `${formatPercent(f, { precision })}%`

  return z.number().superRefine((value, ctx) => {
    if (positive && value <= 0) {
      ctx.addIssue({ code: "custom", message: message ?? "Must be greater than zero" })
    }
    if (min !== undefined && value < min) {
      ctx.addIssue({ code: "custom", message: message ?? `Must be ${show(min)} or more` })
    }
    if (max !== undefined && value > max) {
      ctx.addIssue({ code: "custom", message: message ?? `Must be ${show(max)} or less` })
    }
    if (!withinPrecision(value, precision)) {
      ctx.addIssue({
        code: "custom",
        message: message ?? `Use at most ${precision} decimal places`,
      })
    }
  })
}

/** The value type PercentInput emits: a fraction. */
export type PercentValue = number
