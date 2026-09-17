"use client"

import { useCallback, useMemo, useRef, type ClipboardEvent } from "react"

import { clipboardText } from "@inputcn/core/paste"
import type { BaseFieldProps, Rule } from "@inputcn/core/types"
import { useField, type UseFieldResult } from "@inputcn/core/use-field"
import { custom, required as requiredRule, rules } from "@inputcn/core/validity"

import {
  cidrRange,
  classify,
  isLoopback,
  isMulticast,
  isPrivate,
  parseIp,
  parsePastedIp,
  type ParsedIp,
  type Range,
} from "./ip.js"

export interface IpConstraints {
  /** Reject RFC 1918 private ranges. */
  noPrivate?: boolean
  /** Reject 127.0.0.0/8. */
  noLoopback?: boolean
  /** Reject 224.0.0.0/4. */
  noMulticast?: boolean
  /**
   * Smallest prefix allowed. `minPrefix={8}` rejects /0 through /7.
   * The constraint that earns its keep: it stops an admin allow-listing
   * 0.0.0.0/0 by accident.
   */
  minPrefix?: number
  /** Largest prefix allowed. `maxPrefix={24}` rejects /25 and narrower. */
  maxPrefix?: number
  /** Require an explicit /n suffix. */
  requirePrefix?: boolean
}

export interface UseIpInputOptions extends BaseFieldProps<string>, IpConstraints {}

export interface UseIpInputResult extends UseFieldResult<string> {
  parsed: ParsedIp | null
  /** Network, broadcast and usable host range. Null while unparseable. */
  range: Range | null
  /** "private", "loopback", … or null when the address is ordinary. */
  kind: string | null
  inputProps: {
    ref: React.RefObject<HTMLInputElement | null>
    value: string
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    onPaste: (e: ClipboardEvent<HTMLInputElement>) => void
    inputMode: "numeric"
    spellCheck: false
    autoComplete: "off"
    disabled: boolean | undefined
    readOnly: boolean | undefined
    placeholder: string | undefined
  }
}

const EMPTY = ""
const ALLOWED_CHARS = /^[\d./]*$/

export function useIpInput(options: UseIpInputOptions): UseIpInputResult {
  const {
    noPrivate,
    noLoopback,
    noMulticast,
    minPrefix,
    maxPrefix,
    requirePrefix,
    required,
    validate,
    disabled,
    readOnly,
    placeholder,
    ...base
  } = options

  const ruleList = useMemo<ReadonlyArray<Rule<string>>>(
    () =>
      rules<string>(
        requiredRule<string>(required),
        { rule: "ipFormat", test: (v) => parseIp(v) !== null },
        requirePrefix && {
          rule: "ipFormat",
          params: { message: "Include a CIDR suffix, e.g. /24" },
          test: (v) => parseIp(v)?.hasPrefix !== false,
        },
        (minPrefix !== undefined || maxPrefix !== undefined) && {
          rule: "ipPrefix",
          params: { minPrefix: minPrefix ?? 0, maxPrefix: maxPrefix ?? 32 },
          test: (v) => {
            const p = parseIp(v)
            if (!p) return true // the format rule owns that failure
            if (minPrefix !== undefined && p.prefix < minPrefix) return false
            if (maxPrefix !== undefined && p.prefix > maxPrefix) return false
            return true
          },
        },
        noPrivate && {
          rule: "ipPrivate",
          test: (v) => {
            const p = parseIp(v)
            return !p || !isPrivate(p)
          },
        },
        noLoopback && {
          rule: "ipLoopback",
          test: (v) => {
            const p = parseIp(v)
            return !p || !isLoopback(p)
          },
        },
        noMulticast && {
          rule: "ipFormat",
          params: { message: "Multicast addresses are not allowed" },
          test: (v) => {
            const p = parseIp(v)
            return !p || !isMulticast(p)
          },
        },
        custom<string>(validate),
      ),
    [required, requirePrefix, minPrefix, maxPrefix, noPrivate, noLoopback, noMulticast, validate],
  )

  const field = useField<string>({
    component: "IpInput",
    emptyValue: EMPTY,
    rules: ruleList,
    ...base,
    required,
    disabled,
    readOnly,
  })

  const { value, setValue } = field
  const ref = useRef<HTMLInputElement | null>(null)

  const parsed = useMemo(() => parseIp(value), [value])
  const range = useMemo(() => (parsed ? cidrRange(parsed) : null), [parsed])
  const kind = useMemo(() => (parsed ? classify(parsed) : null), [parsed])

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled || readOnly) return
      const text = e.currentTarget.value
      // Swallow anything that cannot appear in an IPv4/CIDR string, so stray
      // letters never make it into the value.
      if (!ALLOWED_CHARS.test(text)) return
      setValue(text)
    },
    [disabled, readOnly, setValue],
  )

  const onPaste = useCallback(
    (e: ClipboardEvent<HTMLInputElement>) => {
      if (disabled || readOnly) return
      const text = clipboardText(e)
      if (!text) return
      e.preventDefault()
      const found = parsePastedIp(text)
      if (found) setValue(found)
    },
    [disabled, readOnly, setValue],
  )

  const inputProps = useMemo(
    () => ({
      ref,
      value,
      onChange,
      onPaste,
      inputMode: "numeric" as const,
      spellCheck: false as const,
      autoComplete: "off" as const,
      disabled,
      readOnly,
      placeholder: placeholder ?? "10.0.0.0/24",
    }),
    [value, onChange, onPaste, disabled, readOnly, placeholder],
  )

  return { ...field, parsed, range, kind, inputProps }
}
