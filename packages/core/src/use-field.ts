"use client"

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FocusEvent as ReactFocusEvent,
} from "react"

import { resolveMessage } from "./messages.js"
import { useInputcnContext, useFieldModeContext } from "./provider.js"
import type {
  BaseFieldProps,
  FieldMode,
  FieldSize,
  FieldVariant,
  Rule,
  ValidityState,
  Violation,
} from "./types.js"
import { useEvent } from "./use-latest.js"
import { evaluate } from "./validity.js"
import {
  createWarnScope,
  warnBothValueProps,
  warnControlledSwitch,
  warnIgnoredInManagedMode,
  type WarnScope,
} from "./warn.js"

export interface UseFieldOptions<T> extends BaseFieldProps<T> {
  /** Component display name, for dev warnings. */
  component: string
  /** Value used when neither `value` nor `defaultValue` is supplied. */
  emptyValue: T
  /** Rules built from the component's constraint props. */
  rules: ReadonlyArray<Rule<T>>
  /** Canonical value → the string placed in the hidden submission input. */
  serialize?: (value: T) => string
}

export interface UseFieldResult<T> {
  /** Current canonical value. */
  value: T
  /** Commit a new canonical value. No-op when disabled or read-only. */
  setValue: (next: T) => void

  validity: ValidityState
  /** The violation to display right now, honouring `showError` timing. */
  visible: Violation | undefined
  /** Rendered text for `visible`, or undefined. */
  errorText: string | undefined
  /** True once the field has been blurred at least once. */
  touched: boolean
  /** Clears value-independent UI state. Used by form resets. */
  reset: () => void

  mode: FieldMode
  /** True when this component should render its own error text. */
  ownsErrorUI: boolean

  /**
   * Spread onto the wrapper element. Carries component-level blur handling
   * plus the presentation axes the stylesheet keys off.
   */
  containerProps: {
    onBlur: (e: ReactFocusEvent<HTMLElement>) => void
    onFocus: () => void
    "data-variant": FieldVariant | undefined
    "data-size": FieldSize | undefined
    "data-disabled": "" | undefined
  }
  /** Spread onto the visible input. */
  ariaProps: {
    "aria-invalid": boolean | undefined
    "aria-describedby": string | undefined
    "aria-required": boolean | undefined
  }
  /** Props for the hidden input that carries the canonical value to FormData. */
  hiddenInputProps:
    | { type: "hidden"; name: string; value: string; readOnly: true }
    | undefined
  /** Stable id for the error element. */
  errorId: string
  warnScope: WarnScope
}

/**
 * The engine behind every component.
 *
 * Validity is computed DURING RENDER from the current value — never stored in
 * state, never produced by an effect. That removes the entire class of bugs
 * where the displayed error lags a keystroke behind the value.
 */
export function useField<T>(options: UseFieldOptions<T>): UseFieldResult<T> {
  const {
    component,
    emptyValue,
    rules,
    serialize,
    value: controlledValue,
    defaultValue,
    onChange,
    onBlur,
    onValidityChange,
    name,
    disabled,
    readOnly,
    required,
    messages,
    showError = "touched",
    mode: modeProp,
    id: idProp,
    variant,
    size,
    "aria-describedby": describedByProp,
    "aria-invalid": ariaInvalidProp,
  } = options

  const ctx = useInputcnContext()
  const contextMode = useFieldModeContext()

  // Lazy init — the Set is never allocated in production builds.
  const [warnScope] = useState(createWarnScope)

  const reactId = useId()
  const errorId = `${idProp ?? reactId}-error`

  /* ---------------- controlled / uncontrolled ---------------- */

  const isControlled = controlledValue !== undefined
  const [uncontrolled, setUncontrolled] = useState<T>(
    () => defaultValue ?? emptyValue,
  )
  const value = isControlled ? controlledValue : uncontrolled

  const wasControlled = useRef(isControlled)
  if (process.env.NODE_ENV !== "production") {
    if (wasControlled.current !== isControlled) {
      warnControlledSwitch(warnScope, component, wasControlled.current, isControlled)
      wasControlled.current = isControlled
    }
    if (isControlled && defaultValue !== undefined) {
      warnBothValueProps(warnScope, component)
    }
  }

  const emitChange = useEvent(onChange)

  const setValue = useCallback(
    (next: T) => {
      if (disabled || readOnly) return
      if (!isControlled) setUncontrolled(next)
      emitChange(next)
    },
    [disabled, readOnly, isControlled, emitChange],
  )

  /* ---------------- mode detection (PRD §9.1) ---------------- */

  // Detected, never configured. shadcn's <FormControl> always injects
  // aria-describedby and aria-invalid, which makes them a reliable signal
  // without taking a dependency on react-hook-form.
  const mode: FieldMode =
    modeProp ??
    contextMode ??
    ctx.mode ??
    (ariaInvalidProp !== undefined || describedByProp !== undefined
      ? "managed"
      : "standalone")

  const ownsErrorUI = mode === "standalone" && showError !== "never"

  if (process.env.NODE_ENV !== "production" && mode === "managed") {
    const ignored: string[] = []
    if (required) ignored.push("required")
    if (options.validate) ignored.push("validate")
    warnIgnoredInManagedMode(warnScope, component, ignored)
  }

  /* ---------------- validity, derived during render ---------------- */

  const validity = useMemo(() => evaluate(value, rules), [value, rules])

  /* ---------------- error visibility timing (PRD §9.4) ---------------- */

  const [touched, setTouched] = useState(false)
  // Once an error has been shown, keep validating live so the message clears
  // the instant the user fixes it. This is the half everyone forgets.
  const [revealed, setRevealed] = useState(false)

  const shouldShow =
    showError === "never"
      ? false
      : showError === "change"
        ? true
        : showError === "blur"
          ? touched
          : touched || revealed

  if (shouldShow && !revealed && !validity.valid) {
    // Safe during render: same-render state bump, React re-renders immediately
    // without committing the intermediate tree.
    setRevealed(true)
  }

  const visible = shouldShow
    ? (validity.error ?? validity.warning)
    : validity.warning && showError !== "never"
      ? validity.warning
      : undefined

  const errorText = visible
    ? resolveMessage(visible, messages, ctx.messages)
    : undefined

  /* ---------------- component-level blur ---------------- */

  const emitBlur = useEvent(onBlur)
  const focusWithin = useRef(false)

  const handleFocus = useCallback(() => {
    focusWithin.current = true
  }, [])

  // Fires only when focus leaves the whole component — moving between a
  // country trigger and its number field must not count as a blur.
  const handleBlur = useCallback(
    (e: ReactFocusEvent<HTMLElement>) => {
      const next = e.relatedTarget as Node | null
      if (next && e.currentTarget.contains(next)) return
      focusWithin.current = false
      setTouched(true)
      emitBlur()
    },
    [emitBlur],
  )

  const reset = useCallback(() => {
    setTouched(false)
    setRevealed(false)
    if (!isControlled) setUncontrolled(defaultValue ?? emptyValue)
  }, [isControlled, defaultValue, emptyValue])

  /* ---------------- report validity upward ---------------- */

  const emitValidity = useEvent(onValidityChange)
  // Primitive deps only: re-notify when the verdict or the failing rule
  // changes, not on every new violations array (rerender-dependencies).
  const verdict = validity.valid
  const ruleName = validity.error?.rule ?? validity.warning?.rule
  const validityRef = useRef(validity)
  validityRef.current = validity

  useEffect(() => {
    emitValidity(validityRef.current)
  }, [verdict, ruleName, emitValidity])

  /* ---------------- derived prop bags ---------------- */

  const containerProps = useMemo(
    () => ({
      onBlur: handleBlur,
      onFocus: handleFocus,
      // Omitted at the default so the attribute selector stays cheap and the
      // DOM stays readable.
      "data-variant": variant && variant !== "outline" ? variant : undefined,
      "data-size": size && size !== "default" ? size : undefined,
      "data-disabled": disabled ? ("" as const) : undefined,
    }),
    [handleBlur, handleFocus, variant, size, disabled],
  )

  const showingError = Boolean(visible && !visible.warning)

  const ariaProps = useMemo(
    () => ({
      "aria-invalid":
        ariaInvalidProp !== undefined
          ? ariaInvalidProp === true || ariaInvalidProp === "true"
          : showingError || undefined,
      "aria-describedby":
        [describedByProp, ownsErrorUI && errorText ? errorId : undefined]
          .filter(Boolean)
          .join(" ") || undefined,
      "aria-required": required ? true : undefined,
    }),
    [ariaInvalidProp, showingError, describedByProp, ownsErrorUI, errorText, errorId, required],
  )

  const serialized = serialize ? serialize(value) : stringify(value)

  const hiddenInputProps = name
    ? ({ type: "hidden" as const, name, value: serialized, readOnly: true as const })
    : undefined

  return {
    value,
    setValue,
    validity,
    visible,
    errorText,
    touched,
    reset,
    mode,
    ownsErrorUI,
    containerProps,
    ariaProps,
    hiddenInputProps,
    errorId,
    warnScope,
  }
}

/** Default canonical serialisation for the hidden submission input. */
function stringify(v: unknown): string {
  if (v === null || v === undefined) return ""
  if (typeof v === "string") return v
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : ""
  if (typeof v === "boolean") return v ? "true" : "false"
  return JSON.stringify(v)
}
