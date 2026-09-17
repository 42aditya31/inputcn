/**
 * Zod companion for CurrencyInput. PRD §10.5.
 *
 * Validates the canonical value the component emits: an INTEGER count of
 * minor units. Bounds are expressed in minor units too, so the schema and the
 * component's constraint props take identical numbers — that is what makes
 * REQ-V's parity test possible.
 */

import { z } from "zod"

import { formatMinor, fractionDigits } from "./currency.js"

export interface MoneySchemaOptions {
  /** Minor units. */
  min?: number
  /** Minor units. */
  max?: number
  positive?: boolean
  nonZero?: boolean
  /** Reject fractional currency units. */
  wholeUnitsOnly?: boolean
  /** For message formatting only. Default "USD". */
  currency?: string
  locale?: string
  message?: string
}

export function moneySchema(options: MoneySchemaOptions = {}) {
  const {
    min,
    max,
    positive,
    nonZero,
    wholeUnitsOnly,
    currency = "USD",
    locale = "en-US",
    message,
  } = options

  const show = (minor: number) => formatMinor(minor, currency, { locale, withSymbol: true })
  const factor = 10 ** fractionDigits(currency, locale)

  return z
    .number()
    .int("Amounts are stored as whole minor units")
    .superRefine((value, ctx) => {
      if (positive && value <= 0) {
        ctx.addIssue({ code: "custom", message: message ?? "Must be greater than zero" })
      }
      if (nonZero && value === 0) {
        ctx.addIssue({ code: "custom", message: message ?? "Cannot be zero" })
      }
      if (min !== undefined && value < min) {
        ctx.addIssue({ code: "custom", message: message ?? `Must be ${show(min)} or more` })
      }
      if (max !== undefined && value > max) {
        ctx.addIssue({ code: "custom", message: message ?? `Must be ${show(max)} or less` })
      }
      if (wholeUnitsOnly && value % factor !== 0) {
        ctx.addIssue({ code: "custom", message: message ?? "Must be a whole amount" })
      }
    })
}

/** The value type CurrencyInput emits: minor units. */
export type MoneyValue = number
