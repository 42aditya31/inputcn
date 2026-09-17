/**
 * Zod companion for DurationInput.
 *
 * Validates the canonical value: SECONDS as an integer. Bounds accept the same
 * human text the component's props do, resolved through the same parser — so
 * `min: "5m"` cannot mean one thing to the schema and another to the field.
 */

import { z } from "zod"

import { formatDuration, parseDuration, type DurationUnit } from "./duration.js"

export interface DurationSchemaOptions {
  min?: number | string
  max?: number | string
  multipleOf?: number | string
  /** What a bare number in a bound means. Default "m". */
  bareUnit?: DurationUnit
  message?: string
}

function resolve(
  bound: number | string | undefined,
  bareUnit: DurationUnit,
): number | undefined {
  if (bound === undefined) return undefined
  return typeof bound === "number" ? bound : parseDuration(bound, { bareUnit })
}

export function durationSchema(options: DurationSchemaOptions = {}) {
  const { bareUnit = "m", message } = options
  const min = resolve(options.min, bareUnit)
  const max = resolve(options.max, bareUnit)
  const step = resolve(options.multipleOf, bareUnit)

  return z
    .number()
    .int("Durations are stored as whole seconds")
    .nonnegative("A duration cannot be negative")
    .superRefine((value, ctx) => {
      if (min !== undefined && value < min) {
        ctx.addIssue({
          code: "custom",
          message: message ?? `Must be ${formatDuration(min)} or more`,
        })
      }
      if (max !== undefined && value > max) {
        ctx.addIssue({
          code: "custom",
          message: message ?? `Must be ${formatDuration(max)} or less`,
        })
      }
      if (step !== undefined && step > 0 && value % step !== 0) {
        ctx.addIssue({
          code: "custom",
          message: message ?? `Must be a multiple of ${formatDuration(step)}`,
        })
      }
    })
}

/** The value type DurationInput emits: seconds. */
export type DurationValue = number
