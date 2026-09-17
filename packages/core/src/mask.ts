/**
 * Template mask engine.
 *
 * A mask is a string of slot tokens and literal separators:
 *
 *   "(###) ###-####"   →  (415) 555-2671
 *   "##/##/####"       →  04/28/2026
 *   "AA-####"          →  US-1234
 *
 * Tokens
 *   #  a digit          [0-9]
 *   A  a letter         [A-Za-z]
 *   *  alphanumeric     [A-Za-z0-9]
 *   \  escapes the next character into a literal
 *
 * Everything else is a literal that the engine inserts for the user and
 * strips back out when parsing. Parsing is always lossless in the direction
 * that matters: format(parse(x)) is stable.
 */

import { isAlnum, isDigit, type SignificantFn } from "./caret.js"

export type MaskToken = "#" | "A" | "*"

const TOKEN_TEST: Record<MaskToken, RegExp> = {
  // Hoisted — never construct a RegExp per keystroke.
  "#": /[0-9]/,
  A: /[a-z]/i,
  "*": /[a-z0-9]/i,
}

const TOKEN_CHARS = new Set<string>(["#", "A", "*"])

interface CompiledMask {
  /** One entry per mask position. `null` means a literal. */
  slots: Array<MaskToken | null>
  /** Literal characters, indexed to match `slots`. */
  literals: Array<string | null>
  /** Count of fillable slots. */
  capacity: number
  /** Predicate for caret math — digits only when every slot is `#`. */
  isSignificant: SignificantFn
}

// Compiling a mask is pure and masks are few, so cache forever.
// (js-cache-function-results: module-level Map, bounded by distinct masks.)
const cache = new Map<string, CompiledMask>()

export function compileMask(mask: string): CompiledMask {
  const hit = cache.get(mask)
  if (hit) return hit

  const slots: Array<MaskToken | null> = []
  const literals: Array<string | null> = []
  let capacity = 0
  let digitsOnly = true

  for (let i = 0; i < mask.length; i++) {
    const ch = mask[i]!
    if (ch === "\\" && i + 1 < mask.length) {
      slots.push(null)
      literals.push(mask[++i]!)
      continue
    }
    if (TOKEN_CHARS.has(ch)) {
      slots.push(ch as MaskToken)
      literals.push(null)
      capacity++
      if (ch !== "#") digitsOnly = false
    } else {
      slots.push(null)
      literals.push(ch)
    }
  }

  const compiled: CompiledMask = {
    slots,
    literals,
    capacity,
    isSignificant: digitsOnly ? isDigit : isAlnum,
  }
  cache.set(mask, compiled)
  return compiled
}

/** How many characters the mask can hold. */
export function maskCapacity(mask: string): number {
  return compileMask(mask).capacity
}

/** Caret predicate matching the mask's slot types. */
export function maskSignificance(mask: string): SignificantFn {
  return compileMask(mask).isSignificant
}

/**
 * Strip a display string down to the characters the mask would accept.
 * Tolerant by design: it is fed pasted text as often as typed text.
 */
export function parseMask(input: string, mask: string): string {
  const { slots, capacity } = compileMask(mask)
  if (!input) return ""

  const out: string[] = []
  let slotIndex = 0

  for (const ch of input) {
    // Advance past literal positions to find the next fillable slot.
    while (slotIndex < slots.length && slots[slotIndex] === null) slotIndex++
    if (slotIndex >= slots.length || out.length >= capacity) break

    const token = slots[slotIndex] as MaskToken
    if (TOKEN_TEST[token].test(ch)) {
      out.push(ch)
      slotIndex++
    }
    // A character that does not fit the current slot is dropped rather than
    // shifting everything right — that is what makes pasting "+1 (415)…"
    // into a US mask produce the same result as typing it.
  }
  return out.join("")
}

/**
 * Render raw characters through the mask.
 * Trailing literals are only emitted once the following slot is filled, so the
 * field never shows a dangling "(" or "-" ahead of the user's typing.
 */
export function formatMask(raw: string, mask: string): string {
  if (!raw) return ""
  const { slots, literals } = compileMask(mask)

  let out = ""
  let i = 0

  for (let s = 0; s < slots.length && i < raw.length; s++) {
    const token = slots[s]
    if (token === null) {
      out += literals[s]!
      continue
    }
    out += raw[i++]!
  }
  return out
}

/** True when every slot in the mask is filled. */
export function isMaskComplete(raw: string, mask: string): boolean {
  return raw.length === compileMask(mask).capacity
}

/**
 * Placeholder derived from the mask, e.g. "(###) ###-####" → "(000) 000-0000".
 * Saves callers from writing the same string twice and letting it drift.
 */
export function maskPlaceholder(mask: string, fill = "0"): string {
  const { slots, literals } = compileMask(mask)
  let out = ""
  for (let s = 0; s < slots.length; s++) {
    out += slots[s] === null ? literals[s]! : fill
  }
  return out
}
