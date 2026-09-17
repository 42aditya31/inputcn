/**
 * Zod companion for FileSizeInput. Validates bytes.
 * Bounds accept the same human text the component's props do, resolved
 * through the same parser.
 */

import { z } from "zod"

import { formatFileSize, parseFileSize } from "./filesize.js"

export interface FileSizeSchemaOptions {
  min?: number | string
  max?: number | string
  binary?: boolean
  message?: string
}

function toBytes(bound: number | string | undefined, binary: boolean): number | undefined {
  if (bound === undefined) return undefined
  if (typeof bound === "number") return bound
  return parseFileSize(bound, { binary }) ?? undefined
}

export function fileSizeSchema(options: FileSizeSchemaOptions = {}) {
  const { binary = false, message } = options
  const min = toBytes(options.min, binary)
  const max = toBytes(options.max, binary)
  const show = (b: number) => formatFileSize(b, { binary })

  return z
    .number()
    .int("Sizes are stored as whole bytes")
    .nonnegative("A size cannot be negative")
    .superRefine((value, ctx) => {
      if (min !== undefined && value < min) {
        ctx.addIssue({ code: "custom", message: message ?? `Must be ${show(min)} or more` })
      }
      if (max !== undefined && value > max) {
        ctx.addIssue({ code: "custom", message: message ?? `Must be ${show(max)} or less` })
      }
    })
}

/** The value type FileSizeInput emits: bytes. */
export type FileSizeValue = number
