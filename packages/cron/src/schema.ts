/**
 * Zod companion for CronInput.
 *
 * Runs the same `parseCron` and `shortestInterval` the component runs, so a
 * schedule accepted by the field is never rejected by the schema.
 */

import { z } from "zod"

import { parseCron, shortestInterval } from "./cron.js"

export interface CronSchemaOptions {
  /** Reject schedules firing more often than this. Accepts "5m" or seconds. */
  minInterval?: number | string
  allowEmpty?: boolean
  message?: string
}

function toSeconds(bound: number | string | undefined): number | undefined {
  if (bound === undefined) return undefined
  if (typeof bound === "number") return bound
  const m = /^(\d+(?:\.\d+)?)\s*(s|m|h|d)?$/i.exec(bound.trim())
  if (!m) return undefined
  return Number(m[1]) * ({ s: 1, m: 60, h: 3600, d: 86_400 }[(m[2] ?? "m").toLowerCase()] ?? 60)
}

export function cronSchema(options: CronSchemaOptions = {}) {
  const { minInterval, allowEmpty = false, message } = options
  const minSeconds = toSeconds(minInterval)

  return z.string().superRefine((value, ctx) => {
    if (!value) {
      if (!allowEmpty) {
        ctx.addIssue({ code: "custom", message: message ?? "This field is required" })
      }
      return
    }

    const parsed = parseCron(value)
    if (!parsed.ok) {
      const first = parsed.errors[0]
      ctx.addIssue({
        code: "custom",
        message: message ?? (first ? `The ${first.field} field ${first.reason}` : "Invalid schedule"),
      })
      return
    }

    if (minSeconds !== undefined && shortestInterval(value) < minSeconds) {
      ctx.addIssue({
        code: "custom",
        message: message ?? `Runs too often — minimum interval is ${minInterval}`,
      })
    }
  })
}

/** The value type CronInput emits: a five-field expression. */
export type CronValue = string
