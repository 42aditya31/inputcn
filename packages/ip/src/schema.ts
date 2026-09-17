/**
 * Zod companion for IpInput.
 * Runs the same parser and classifiers the component runs.
 */

import { z } from "zod"

import { isLoopback, isMulticast, isPrivate, parseIp } from "./ip.js"

export interface CidrSchemaOptions {
  noPrivate?: boolean
  noLoopback?: boolean
  noMulticast?: boolean
  minPrefix?: number
  maxPrefix?: number
  requirePrefix?: boolean
  allowEmpty?: boolean
  message?: string
}

export function cidrSchema(options: CidrSchemaOptions = {}) {
  const {
    noPrivate,
    noLoopback,
    noMulticast,
    minPrefix,
    maxPrefix,
    requirePrefix,
    allowEmpty = false,
    message,
  } = options

  return z.string().superRefine((value, ctx) => {
    if (!value) {
      if (!allowEmpty) {
        ctx.addIssue({ code: "custom", message: message ?? "This field is required" })
      }
      return
    }

    const parsed = parseIp(value)
    if (!parsed) {
      ctx.addIssue({ code: "custom", message: message ?? "Enter a valid IPv4 address" })
      return
    }

    if (requirePrefix && !parsed.hasPrefix) {
      ctx.addIssue({ code: "custom", message: message ?? "Include a CIDR suffix, e.g. /24" })
      return
    }
    if (minPrefix !== undefined && parsed.prefix < minPrefix) {
      ctx.addIssue({ code: "custom", message: message ?? `Prefix must be /${minPrefix} or narrower` })
      return
    }
    if (maxPrefix !== undefined && parsed.prefix > maxPrefix) {
      ctx.addIssue({ code: "custom", message: message ?? `Prefix must be /${maxPrefix} or wider` })
      return
    }
    if (noPrivate && isPrivate(parsed)) {
      ctx.addIssue({ code: "custom", message: message ?? "Private ranges are not allowed" })
      return
    }
    if (noLoopback && isLoopback(parsed)) {
      ctx.addIssue({ code: "custom", message: message ?? "Loopback addresses are not allowed" })
      return
    }
    if (noMulticast && isMulticast(parsed)) {
      ctx.addIssue({ code: "custom", message: message ?? "Multicast addresses are not allowed" })
    }
  })
}

/** The value type IpInput emits. */
export type IpValue = string
