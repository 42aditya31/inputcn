/**
 * Zod companion for MaskedInput. PRD §10.5.
 *
 * Validates the canonical value the component emits: the RAW string, with no
 * mask separators. `"12345678901"`, never `"123.456.789-01"`.
 *
 * The completeness check calls the same `isMaskComplete` the component calls,
 * so the schema and the component cannot disagree about what "filled in"
 * means — which is what makes REQ-V's parity test possible.
 */

import { isMaskComplete, maskCapacity } from "@inputcn/core/mask"
import { z } from "zod"

export interface MaskedSchemaOptions {
  /** The same mask string passed to the component. */
  mask: string
  /** Require every slot to be filled. Default true — usually what you mean. */
  complete?: boolean
  minLength?: number
  maxLength?: number
  /** Tested against the raw value. */
  pattern?: RegExp
  /** Allow "" to pass. Default false. */
  allowEmpty?: boolean
  message?: string
}

/**
 * ```ts
 * const schema = z.object({
 *   taxId: maskedSchema({ mask: "###.###.###-##" }),
 * })
 * type Values = z.infer<typeof schema>   // { taxId: string }
 * ```
 */
export function maskedSchema(options: MaskedSchemaOptions) {
  const {
    mask,
    complete = true,
    minLength,
    maxLength,
    pattern,
    allowEmpty = false,
    message,
  } = options

  const capacity = maskCapacity(mask)

  return z.string().superRefine((value, ctx) => {
    if (!value) {
      if (!allowEmpty) {
        ctx.addIssue({ code: "custom", message: message ?? "This field is required" })
      }
      return
    }

    if (complete && !isMaskComplete(value, mask)) {
      ctx.addIssue({
        code: "custom",
        message: message ?? `Enter all ${capacity} characters`,
      })
      return
    }

    if (minLength !== undefined && value.length < minLength) {
      ctx.addIssue({
        code: "custom",
        message: message ?? `Must be at least ${minLength} characters`,
      })
    }

    if (maxLength !== undefined && value.length > maxLength) {
      ctx.addIssue({
        code: "custom",
        message: message ?? `Must be ${maxLength} characters or fewer`,
      })
    }

    if (pattern) {
      // A /g regex carries mutable lastIndex, so repeated validation would
      // flip between pass and fail. Clone without the flag.
      const safe = pattern.global
        ? new RegExp(pattern.source, pattern.flags.replace("g", ""))
        : pattern
      if (!safe.test(value)) {
        ctx.addIssue({ code: "custom", message: message ?? "Invalid format" })
      }
    }
  })
}

/** The value type MaskedInput emits: the raw, unmasked string. */
export type MaskedValue = string
