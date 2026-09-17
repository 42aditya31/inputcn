/**
 * Rule engine. PRD §9.
 *
 * Rules are plain data, evaluated top to bottom during render. Nothing here
 * touches React — validity is DERIVED, never stored in state and never
 * computed in an effect (rerender-derived-state-no-effect).
 */

import type { Rule, ValidityState, Violation } from "./types.js"

const EMPTY_VIOLATIONS: readonly Violation[] = Object.freeze([])

/** Shared "no problems" result — a stable reference, so memo comparisons hold. */
export const VALID: ValidityState = Object.freeze({
  valid: true,
  violations: EMPTY_VIOLATIONS as Violation[],
})

/** Is this canonical value "empty" for the purposes of `required`? */
export function isEmptyValue(value: unknown): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === "string") return value.length === 0
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === "number") return Number.isNaN(value)
  return false
}

/**
 * Run rules in order and collect violations.
 *
 * Every rule except `required` is skipped while the value is empty — an
 * optional field left blank is valid, and showing "must be at least 5" on an
 * untouched empty box is the classic false positive.
 */
export function evaluate<T>(value: T, rules: ReadonlyArray<Rule<T>>): ValidityState {
  if (rules.length === 0) return VALID

  const empty = isEmptyValue(value)
  let violations: Violation[] | null = null

  for (let i = 0; i < rules.length; i++) {
    const r = rules[i]!
    if (empty && r.skipWhenEmpty !== false) continue
    if (r.test(value)) continue

    const v: Violation = { rule: r.rule }
    if (r.params) v.params = r.params
    if (r.warning) v.warning = true
    ;(violations ??= []).push(v)
  }

  if (!violations) return VALID

  let error: Violation | undefined
  let warning: Violation | undefined
  for (let i = 0; i < violations.length; i++) {
    const v = violations[i]!
    if (v.warning) warning ??= v
    else error ??= v
  }

  return { valid: !error, violations, error, warning }
}

/* ------------------------------------------------------------------ *
 * Rule builders — shared across components so semantics can't drift.
 * Each returns `undefined` when the prop was not supplied, letting the
 * caller build a rule list with `.filter(Boolean)` and no branching.
 * ------------------------------------------------------------------ */

type Maybe<T> = Rule<T> | undefined

export function required<T>(on: boolean | string | undefined): Maybe<T> {
  if (!on) return undefined
  return {
    rule: "required",
    skipWhenEmpty: false,
    test: (v) => !isEmptyValue(v),
    ...(typeof on === "string" ? { params: { message: on } } : {}),
  }
}

export function min(n: number | undefined, format?: (n: number) => string): Maybe<number> {
  if (n === undefined) return undefined
  return { rule: "min", params: { min: n, formatted: format?.(n) }, test: (v) => v >= n }
}

export function max(n: number | undefined, format?: (n: number) => string): Maybe<number> {
  if (n === undefined) return undefined
  return { rule: "max", params: { max: n, formatted: format?.(n) }, test: (v) => v <= n }
}

export function positive(on: boolean | undefined): Maybe<number> {
  if (!on) return undefined
  return { rule: "positive", test: (v) => v > 0 }
}

export function negative(on: boolean | undefined): Maybe<number> {
  if (!on) return undefined
  return { rule: "negative", test: (v) => v < 0 }
}

export function nonZero(on: boolean | undefined): Maybe<number> {
  if (!on) return undefined
  return { rule: "nonZero", test: (v) => v !== 0 }
}

export function integer(on: boolean | undefined): Maybe<number> {
  if (!on) return undefined
  return { rule: "integer", test: (v) => Number.isInteger(v) }
}

export function multipleOf(
  step: number | undefined,
  format?: (n: number) => string,
): Maybe<number> {
  if (step === undefined || step === 0) return undefined
  return {
    rule: "multipleOf",
    params: { step, formatted: format?.(step) },
    // Integer arithmetic avoids the float drift of `v % step`.
    test: (v) => Math.abs(Math.round(v / step) * step - v) < 1e-9,
  }
}

export function minLength(n: number | undefined): Maybe<string> {
  if (n === undefined) return undefined
  return { rule: "minLength", params: { minLength: n }, test: (v) => v.length >= n }
}

export function maxLength(n: number | undefined): Maybe<string> {
  if (n === undefined) return undefined
  return { rule: "maxLength", params: { maxLength: n }, test: (v) => v.length <= n }
}

export function pattern(re: RegExp | undefined): Maybe<string> {
  if (!re) return undefined
  // A /g regex carries mutable lastIndex; clone without the flag so repeated
  // evaluation is deterministic (js-hoist-regexp, the global-state warning).
  const safe = re.global ? new RegExp(re.source, re.flags.replace("g", "")) : re
  return { rule: "pattern", params: { pattern: safe.source }, test: (v) => safe.test(v) }
}

export function minItems<T>(n: number | undefined): Maybe<T[]> {
  if (n === undefined) return undefined
  return { rule: "minItems", params: { minItems: n }, test: (v) => v.length >= n }
}

export function maxItems<T>(n: number | undefined): Maybe<T[]> {
  if (n === undefined) return undefined
  return { rule: "maxItems", params: { maxItems: n }, test: (v) => v.length <= n }
}

export function unique(on: boolean | undefined): Maybe<string[]> {
  if (!on) return undefined
  return { rule: "unique", test: (v) => new Set(v).size === v.length }
}

export function oneOf<T extends string>(allowed: readonly T[] | undefined): Maybe<T> {
  if (!allowed) return undefined
  const set = new Set<string>(allowed) // O(1) lookups — js-set-map-lookups
  return { rule: "oneOf", params: { allowed }, test: (v) => set.has(v) }
}

/** Wraps the user's `validate` prop. Its returned string becomes the message. */
export function custom<T>(fn: ((value: T) => true | string) | undefined): Maybe<T> {
  if (!fn) return undefined
  let last: string | undefined
  return {
    rule: "custom",
    // The message is captured on the failing call and read back via params.
    get params() {
      return last === undefined ? undefined : { message: last }
    },
    test: (v) => {
      const r = fn(v)
      if (r === true) return true
      last = typeof r === "string" ? r : undefined
      return false
    },
  } as Rule<T>
}

/**
 * Drop the falsy entries a builder list produces, so callers can write
 * `rules(required(x), cond && {...})` with no branching.
 */
export function rules<T>(
  ...list: Array<Rule<T> | undefined | null | false | 0 | "">
): Rule<T>[] {
  const out: Rule<T>[] = []
  for (const r of list) if (r) out.push(r)
  return out
}
