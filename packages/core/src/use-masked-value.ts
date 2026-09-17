"use client"

import { useCallback, useLayoutEffect, useRef, type ChangeEvent } from "react"

import { applyFormatted, isDeletingEvent, type SignificantFn } from "./caret.js"

export interface UseMaskedValueOptions<T> {
  /** Canonical value. */
  value: T
  /** Canonical → what the user sees. */
  format: (value: T) => string
  /** What the user typed → canonical. Must tolerate partial input. */
  parse: (text: string) => T
  onChange: (value: T) => void
  /** Which characters count for caret math. Defaults to digits. */
  isSignificant?: SignificantFn
  disabled?: boolean
  readOnly?: boolean
}

export interface UseMaskedValueResult {
  ref: React.RefObject<HTMLInputElement | null>
  /** Spread onto the visible <input>. */
  inputProps: {
    ref: React.RefObject<HTMLInputElement | null>
    onChange: (e: ChangeEvent<HTMLInputElement>) => void
    defaultValue: string
  }
  /** Force the DOM back in sync — used after a paste or a programmatic set. */
  sync: () => void
}

/**
 * Binds a canonical value to a formatted <input> without losing the caret.
 *
 * The input is UNCONTROLLED at the DOM level on purpose. A controlled
 * `value={formatted}` makes React rewrite the node after the browser has
 * already moved the caret, producing the one-frame jump you see in most
 * masked inputs. Instead we own the DOM value directly and restore the caret
 * in the same synchronous task as the edit.
 */
export function useMaskedValue<T>({
  value,
  format,
  parse,
  onChange,
  isSignificant,
  disabled,
  readOnly,
}: UseMaskedValueOptions<T>): UseMaskedValueResult {
  const ref = useRef<HTMLInputElement | null>(null)
  const formatted = format(value)

  // Keep the latest formatting fns reachable without re-creating handlers.
  const fns = useRef({ format, parse, onChange })
  fns.current = { format, parse, onChange }

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const el = e.currentTarget
      if (disabled || readOnly) return

      const typed = el.value
      const next = fns.current.parse(typed)
      const nextText = fns.current.format(next)

      applyFormatted(el, nextText, {
        isSignificant,
        deleting: isDeletingEvent(e.nativeEvent, typed.length, nextText.length),
      })

      fns.current.onChange(next)
    },
    [disabled, readOnly, isSignificant],
  )

  const sync = useCallback(() => {
    const el = ref.current
    if (!el) return
    const text = fns.current.format(
      fns.current.parse(el.value),
    )
    if (el.value !== text) applyFormatted(el, text, { isSignificant })
  }, [isSignificant])

  // Reconcile the DOM when the canonical value changes from OUTSIDE — a form
  // reset, setValue(), or a paste handler. Layout effect so the user never
  // sees the stale string paint. Skipped when the DOM already agrees, which
  // is the common case during typing.
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    if (el.value === formatted) return
    // While focused, only overwrite when the canonical value genuinely differs
    // from what the field currently represents — otherwise we would fight the
    // user's caret on every keystroke.
    if (document.activeElement === el) {
      const current = fns.current.format(fns.current.parse(el.value))
      if (current === formatted) return
    }
    applyFormatted(el, formatted, { isSignificant })
  }, [formatted, isSignificant])

  return {
    ref,
    inputProps: { ref, onChange: handleChange, defaultValue: formatted },
    sync,
  }
}
