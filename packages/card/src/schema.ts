/**
 * Zod companion for CardInput.
 *
 * Validates the canonical value: digits only. Runs the same `luhn`,
 * `detectBrand` and `isValidLength` the component runs, so the two cannot
 * disagree about whether a number is acceptable.
 *
 * Structural validation only — whether the card has funds is your PSP's
 * question, not this one's.
 */

import { z } from "zod"

import {
  detectBrand,
  isExpired,
  isValidLength,
  luhn,
  parseExpiry,
  type CardBrand,
} from "./card.js"

export interface CardSchemaOptions {
  /** Restrict to the brands your PSP accepts. */
  brands?: readonly CardBrand[]
  allowEmpty?: boolean
  message?: string
}

/** Validates a card number. */
export function cardSchema(options: CardSchemaOptions = {}) {
  const { brands, allowEmpty = false, message } = options
  const allowed = brands ? new Set<CardBrand>(brands) : null

  return z.string().superRefine((value, ctx) => {
    if (!value) {
      if (!allowEmpty) {
        ctx.addIssue({ code: "custom", message: message ?? "This field is required" })
      }
      return
    }

    if (!/^\d+$/.test(value)) {
      ctx.addIssue({
        code: "custom",
        message: message ?? "Store the card number as digits only",
      })
      return
    }

    const brand = detectBrand(value)

    if (!isValidLength(value, brand)) {
      ctx.addIssue({
        code: "custom",
        message: message ?? "This card number is the wrong length",
      })
      return
    }

    if (!luhn(value)) {
      ctx.addIssue({
        code: "custom",
        message: message ?? "This card number is not valid",
      })
      return
    }

    if (allowed && brand && !allowed.has(brand.brand)) {
      ctx.addIssue({
        code: "custom",
        message: message ?? `We accept ${[...allowed].join(", ")}`,
      })
    }
  })
}

export interface ExpirySchemaOptions {
  /** Reject a date in the past. Default true. */
  notExpired?: boolean
  message?: string
}

/** Validates an expiry as typed: "04 / 28", "0428", "04/2028". */
export function expirySchema(options: ExpirySchemaOptions = {}) {
  const { notExpired = true, message } = options

  return z.string().superRefine((value, ctx) => {
    const parsed = parseExpiry(value)
    if (!parsed) {
      ctx.addIssue({ code: "custom", message: message ?? "Enter the expiry as MM/YY" })
      return
    }
    if (notExpired && isExpired(parsed)) {
      ctx.addIssue({ code: "custom", message: message ?? "This card has expired" })
    }
  })
}

/** Validates a CVC. Length depends on the brand, so pass it when you know it. */
export function cvcSchema(options: { brand?: CardBrand; message?: string } = {}) {
  const { brand, message } = options
  const length = brand === "amex" ? 4 : brand ? 3 : undefined

  return z.string().superRefine((value, ctx) => {
    if (!/^\d+$/.test(value)) {
      ctx.addIssue({ code: "custom", message: message ?? "Digits only" })
      return
    }
    const ok = length === undefined ? value.length === 3 || value.length === 4 : value.length === length
    if (!ok) {
      ctx.addIssue({
        code: "custom",
        message: message ?? `Must be ${length ?? "3 or 4"} digits`,
      })
    }
  })
}

/** The value type CardInput emits: digits only. */
export type CardValue = string
