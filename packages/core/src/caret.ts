/**
 * Caret-preserving reformat.
 *
 * This is the hardest thing in the library and the reason most hand-rolled
 * masked inputs are subtly broken. When you reformat a value as the user
 * types, the string length changes underneath the caret. Naively restoring
 * `selectionStart` puts the caret in the wrong place; doing nothing sends it
 * to the end of the field.
 *
 * The fix: the caret's meaningful position is not a string offset, it is
 * "how many SIGNIFICANT characters are to my left". Significant characters
 * are the ones that survive parsing — digits, usually. Separators inserted by
 * the mask are noise and must not move the caret.
 *
 * Algorithm:
 *   1. Before reformatting, count significant chars left of the caret.
 *   2. Reformat.
 *   3. Walk the new string until that many significant chars have passed.
 *   4. Place the caret immediately after.
 */

/** Returns true when the character contributes to the canonical value. */
export type SignificantFn = (char: string) => boolean

const DIGIT_RE = /\d/
const ALNUM_RE = /[a-z0-9]/i

export const isDigit: SignificantFn = (c) => DIGIT_RE.test(c)
export const isAlnum: SignificantFn = (c) => ALNUM_RE.test(c)

/** How many significant characters appear before `index`. */
export function countSignificantBefore(
  text: string,
  index: number,
  isSignificant: SignificantFn = isDigit,
): number {
  const stop = Math.min(index, text.length)
  let n = 0
  for (let i = 0; i < stop; i++) {
    // Non-null: i < stop <= text.length
    if (isSignificant(text[i]!)) n++
  }
  return n
}

/**
 * The offset in `text` immediately after the `count`-th significant character.
 * When `count` is 0 the caret belongs before any leading separators.
 */
export function offsetAfterSignificant(
  text: string,
  count: number,
  isSignificant: SignificantFn = isDigit,
): number {
  if (count <= 0) {
    // Skip nothing — sit at the very start so typing prepends correctly.
    return 0
  }
  let seen = 0
  for (let i = 0; i < text.length; i++) {
    if (isSignificant(text[i]!)) {
      seen++
      if (seen === count) return i + 1
    }
  }
  return text.length
}

export interface ReformatArgs {
  /** The element's value BEFORE we rewrite it (i.e. what the user just typed into). */
  previousText: string
  /** Caret offset within `previousText`. */
  previousCaret: number
  /** The fully reformatted string we are about to write. */
  nextText: string
  isSignificant?: SignificantFn
  /**
   * True when the edit removed characters (Backspace/Delete). Deletions need
   * the caret to land BEFORE the separator that follows, otherwise a second
   * Backspace appears to do nothing.
   */
  deleting?: boolean
}

/** Where the caret should sit in `nextText`. */
export function nextCaretPosition({
  previousText,
  previousCaret,
  nextText,
  isSignificant = isDigit,
  deleting = false,
}: ReformatArgs): number {
  const significantBefore = countSignificantBefore(
    previousText,
    previousCaret,
    isSignificant,
  )
  let pos = offsetAfterSignificant(nextText, significantBefore, isSignificant)

  if (!deleting) {
    // After inserting, hop over any separators the mask added so the next
    // keystroke lands on a real slot rather than pushing against punctuation.
    while (pos < nextText.length && !isSignificant(nextText[pos]!)) pos++
  }
  return pos
}

/**
 * Rewrite an input's value while keeping the caret meaningful.
 *
 * Setting `.value` on a focused input always collapses the selection to the
 * end, so the caret must be restored in the same synchronous task — doing it
 * in an effect produces a visible jump.
 */
export function applyFormatted(
  el: HTMLInputElement,
  nextText: string,
  opts: { isSignificant?: SignificantFn; deleting?: boolean } = {},
): void {
  const previousText = el.value
  if (previousText === nextText) return

  const previousCaret = el.selectionStart ?? previousText.length
  const caret = nextCaretPosition({
    previousText,
    previousCaret,
    nextText,
    ...opts,
  })

  el.value = nextText

  // Only a focused element has a meaningful selection, and setSelectionRange
  // throws on input types that do not support it (email, number, …).
  if (document.activeElement === el) {
    try {
      el.setSelectionRange(caret, caret)
    } catch {
      /* unsupported input type — caret handling is a no-op, not an error */
    }
  }
}

/**
 * True when a native input event removed characters. `inputType` is part of
 * the InputEvent spec; the fallback covers jsdom and synthetic events.
 */
export function isDeletingEvent(
  nativeEvent: unknown,
  previousLength: number,
  nextLength: number,
): boolean {
  const type = (nativeEvent as { inputType?: string } | null)?.inputType
  if (typeof type === "string") return type.startsWith("delete")
  return nextLength < previousLength
}
