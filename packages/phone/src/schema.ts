/**
 * Zod companion for PhoneInput. PRD §10.5.
 *
 * Separate entry point (`@inputcn/phone/schema`) so a consumer who never
 * imports it pays zero bytes for Zod. Shipped in the same package as the
 * component precisely so the validator and the emitter cannot drift — the
 * checks below call the SAME functions the component calls.
 */

import { z } from "zod"

import { countryByIso } from "./countries.js"
import { fromE164, isMobile, isValidLength } from "./phone.js"

export interface PhoneSchemaOptions {
  /** Require the number to belong to this country. */
  country?: string
  /** Restrict to a set of ISO codes. */
  countries?: readonly string[]
  /** Reject numbers that look like landlines. */
  mobileOnly?: boolean
  /** Allow "" to pass. Default false — wrap in `.optional()` yourself instead. */
  allowEmpty?: boolean
  message?: string
}

/**
 * Validates the canonical value PhoneInput emits: E.164.
 *
 * ```ts
 * const schema = z.object({ phone: phoneSchema({ country: "US" }) })
 * type Values = z.infer<typeof schema>   // { phone: string }
 * ```
 */
export function phoneSchema(options: PhoneSchemaOptions = {}) {
  const { country, countries, mobileOnly, allowEmpty = false, message } = options

  const allowed = countries
    ? new Set(countries.map((c) => c.toUpperCase()))
    : null

  return z.string().superRefine((value, ctx) => {
    if (!value) {
      if (!allowEmpty) {
        ctx.addIssue({
          code: "custom",
          message: message ?? "This field is required",
        })
      }
      return
    }

    const parsed = fromE164(value, countryByIso(country))

    if (!parsed.country) {
      ctx.addIssue({
        code: "custom",
        message: message ?? "Enter a valid phone number",
      })
      return
    }

    if (!isValidLength(parsed.national, parsed.country)) {
      ctx.addIssue({
        code: "custom",
        message: message ?? `Not a valid ${parsed.country.iso} number`,
      })
      return
    }

    if (country && parsed.country.iso !== country.toUpperCase()) {
      ctx.addIssue({
        code: "custom",
        message: message ?? `Enter a ${country.toUpperCase()} number`,
      })
      return
    }

    if (allowed && !allowed.has(parsed.country.iso)) {
      ctx.addIssue({
        code: "custom",
        message:
          message ?? `Only ${[...allowed].join(", ")} numbers are accepted`,
      })
      return
    }

    if (mobileOnly && !isMobile(parsed.national, parsed.country)) {
      ctx.addIssue({
        code: "custom",
        message:
          message ?? "Enter a mobile number — this one looks like a landline",
      })
    }
  })
}

/** The value type PhoneInput emits. Keeps `z.infer` and the component aligned. */
export type PhoneValue = string
