/**
 * Shared types for every inputcn component.
 *
 * The single most important contract in this library:
 *   `value` and `onChange` always carry the CANONICAL value.
 *   The formatted string the user sees never leaves the component.
 */

/** A rule that failed, identified by name so assertions survive copy changes. */
export interface Violation {
  /** Stable rule identifier, e.g. `"required"`, `"max"`, `"luhn"`. */
  rule: string
  /** Interpolation params for the message resolver. */
  params?: Record<string, unknown>
  /** Advisory only — reports `valid: true` but still renders a message. */
  warning?: boolean
}

export interface ValidityState {
  /** False only when a non-warning violation is present. */
  valid: boolean
  /** All violations, in declaration order. */
  violations: Violation[]
  /** First blocking violation, or undefined. */
  error?: Violation
  /** First advisory violation, or undefined. */
  warning?: Violation
}

/**
 * A single validation rule.
 * `test` returns true when the value is ACCEPTABLE.
 */
export interface Rule<T> {
  rule: string
  test: (value: T) => boolean
  params?: Record<string, unknown>
  warning?: boolean
  /** Skipped when the value is empty — all rules except `required`. */
  skipWhenEmpty?: boolean
}

/** Resolves a violation into human text. */
export type MessageResolver = (violation: Violation) => string

export type MessageValue = string | ((params: Record<string, unknown>) => string)
export type MessageMap = Record<string, MessageValue>

/** When error text becomes visible in standalone mode. */
export type ShowError = "touched" | "change" | "blur" | "never"

/** Which side of the field owns error rendering. */
export type FieldMode = "standalone" | "managed"

/**
 * How the field surface is drawn. Orthogonal to `layout`, which is
 * per-component and changes structure rather than surface.
 */
export type FieldVariant = "outline" | "filled" | "underline" | "elevated"

/** Density. The metrics are CSS variables, so this is three rules. */
export type FieldSize = "sm" | "default" | "lg"

/** Props every inputcn component accepts. See PRD §9 and §10. */
export interface BaseFieldProps<T> {
  /** Canonical value. Controlled mode. */
  value?: T
  /** Canonical value. Uncontrolled mode. Mutually exclusive with `value`. */
  defaultValue?: T
  /** Emits the canonical value — never a DOM event. */
  onChange?: (value: T) => void
  /** Fires when focus leaves the whole component, not between its parts. */
  onBlur?: () => void
  /** Applied to the hidden canonical input so FormData carries the real value. */
  name?: string
  disabled?: boolean
  readOnly?: boolean
  required?: boolean | string
  /** Custom synchronous rule. Return true, or the message to display. */
  validate?: (value: T) => true | string
  /** Override built-in messages by rule name. */
  messages?: MessageMap
  /** Default `"touched"`. */
  showError?: ShowError
  /** Reports validity upward regardless of mode. */
  onValidityChange?: (state: ValidityState) => void
  /** Force a mode instead of auto-detecting. Escape hatch only. */
  mode?: FieldMode
  /** Surface treatment. Default `"outline"`. */
  variant?: FieldVariant
  /** Density. Default `"default"` (32px). */
  size?: FieldSize

  id?: string
  className?: string
  placeholder?: string
  autoFocus?: boolean
  "aria-label"?: string
  "aria-labelledby"?: string
  "aria-describedby"?: string
  "aria-invalid"?: boolean | "true" | "false"
}

/** Result of a smart-paste attempt. */
export interface PasteResult<T> {
  /** Parsed canonical value, or null when nothing usable was found. */
  value: T | null
  /**
   * A side effect the paste caused beyond this field's own value —
   * e.g. switching country or currency. Must be surfaced and undoable.
   */
  sideEffect?: { kind: string; from: string; to: string; label: string }
}
