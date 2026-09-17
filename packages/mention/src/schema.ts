/**
 * Zod companion for MentionInput.
 * Validates the { text, ids } shape the component emits.
 */

import { z } from "zod"

export interface MentionSchemaOptions {
  maxLength?: number
  minMentions?: number
  maxMentions?: number
  allowEmpty?: boolean
  message?: string
}

export function mentionSchema(options: MentionSchemaOptions = {}) {
  const { maxLength, minMentions, maxMentions, allowEmpty = false, message } = options

  return z
    .object({ text: z.string(), ids: z.array(z.string()) })
    .superRefine((value, ctx) => {
      if (!value.text) {
        if (!allowEmpty) {
          ctx.addIssue({ code: "custom", message: message ?? "This field is required" })
        }
        return
      }
      if (maxLength !== undefined && value.text.length > maxLength) {
        ctx.addIssue({
          code: "custom",
          message: message ?? `Must be ${maxLength} characters or fewer`,
        })
      }
      if (minMentions !== undefined && value.ids.length < minMentions) {
        ctx.addIssue({
          code: "custom",
          message: message ?? `Mention at least ${minMentions} ${minMentions === 1 ? "person" : "people"}`,
        })
      }
      if (maxMentions !== undefined && value.ids.length > maxMentions) {
        ctx.addIssue({
          code: "custom",
          message: message ?? `Mention no more than ${maxMentions} people`,
        })
      }
    })
}

/** The value type MentionInput emits. */
export type { MentionValue } from "./mention.js"
