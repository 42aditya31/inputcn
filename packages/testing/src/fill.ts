/**
 * Helpers that drive inputcn components correctly from a test.
 *
 * The problem these exist for: formatted inputs are genuinely hard to test.
 * `userEvent.type(input, "4155552671")` does not reliably produce
 * `(415) 555-2671`, because the component rewrites the value and moves the
 * caret between keystrokes while userEvent is still replaying the rest of the
 * string. Everyone using this library hits it on day two.
 *
 * Each helper takes the CANONICAL value — the thing `onChange` emits — and
 * drives the field to it, then waits for the DOM to settle.
 */

import { waitFor } from "@testing-library/react"
import type { UserEvent } from "@testing-library/user-event"
import userEvent from "@testing-library/user-event"

export interface FillOptions {
  /** Reuse an existing session so timers and clipboard state stay shared. */
  user?: UserEvent
  /** Clear whatever is there first. Default true. */
  clear?: boolean
}

function session(options?: FillOptions): UserEvent {
  return options?.user ?? userEvent.setup()
}

/**
 * Clear a field the way a user would.
 *
 * `userEvent.clear` uses a select-all then delete, which some masked inputs
 * treat as a single deletion of the whole string. That is exactly what we
 * want, but it must happen before any typing or the caret maths starts from
 * the wrong place.
 */
export async function clearField(
  el: HTMLElement,
  options?: FillOptions,
): Promise<void> {
  const user = session(options)
  await user.clear(el as HTMLInputElement)
}

/** Type a string one character at a time, letting the field reformat between. */
async function typeSlowly(
  user: UserEvent,
  el: HTMLElement,
  text: string,
): Promise<void> {
  await user.click(el)
  for (const ch of text) {
    // One keystroke per call. Passing the whole string lets userEvent race the
    // component's own caret restoration, which is the root of the flakiness.
    await user.keyboard(ch === "{" ? "{{" : ch === "[" ? "[[" : ch)
  }
}

/* ------------------------------------------------------------------ *
 * Per-component fills
 * ------------------------------------------------------------------ */

/**
 * Drive a PhoneInput to an E.164 value.
 *
 * ```ts
 * await fillPhone(screen.getByLabelText("Phone"), "+14155552671")
 * ```
 *
 * Pasting rather than typing, because paste is a single atomic edit the
 * component handles in one pass — and it exercises the same country detection
 * a real user gets when they paste a number.
 */
export async function fillPhone(
  el: HTMLElement,
  e164: string,
  options?: FillOptions,
): Promise<void> {
  const user = session(options)
  if (options?.clear !== false) await clearField(el, { user })
  await user.click(el)
  await user.paste(e164)
  await waitFor(() => expectSettled(el))
}

/**
 * Drive a CurrencyInput to a minor-unit amount.
 *
 * ```ts
 * await fillCurrency(screen.getByLabelText("Amount"), 123450) // $1,234.50
 * ```
 *
 * Types digits, because the component is a digit accumulator: it fills from
 * the right and ignores anything that is not a digit.
 */
export async function fillCurrency(
  el: HTMLElement,
  minorUnits: number,
  options?: FillOptions,
): Promise<void> {
  const user = session(options)
  await user.click(el)
  if (options?.clear !== false) {
    // Delete resets a currency field to zero in one keystroke; Backspace
    // would only pop one digit.
    await user.keyboard("{Delete}")
  }
  const negative = minorUnits < 0
  await typeSlowly(user, el, String(Math.abs(Math.round(minorUnits))))
  if (negative) await user.keyboard("-")
  await waitFor(() => expectSettled(el))
}

/**
 * Drive a MaskedInput to a raw value.
 *
 * ```ts
 * await fillMasked(screen.getByLabelText("Tax ID"), "12345678901")
 * ```
 */
export async function fillMasked(
  el: HTMLElement,
  raw: string,
  options?: FillOptions,
): Promise<void> {
  const user = session(options)
  if (options?.clear !== false) await clearField(el, { user })
  await typeSlowly(user, el, raw)
  await waitFor(() => expectSettled(el))
}

/** Drive a CardInput's number field. Pass digits only. */
export async function fillCard(
  el: HTMLElement,
  digits: string,
  options?: FillOptions,
): Promise<void> {
  const user = session(options)
  if (options?.clear !== false) await clearField(el, { user })
  await user.click(el)
  // Paste, so focus does not advance to the expiry mid-fill.
  await user.paste(digits)
  await waitFor(() => expectSettled(el))
}

/** Drive a DurationInput. Accepts seconds or human text. */
export async function fillDuration(
  el: HTMLElement,
  value: number | string,
  options?: FillOptions,
): Promise<void> {
  const user = session(options)
  if (options?.clear !== false) await clearField(el, { user })
  const text = typeof value === "number" ? `${value}s` : value
  await typeSlowly(user, el, text)
  await waitFor(() => expectSettled(el))
}

/** Drive a PercentInput. Pass the FRACTION, as `onChange` emits it. */
export async function fillPercent(
  el: HTMLElement,
  fraction: number,
  options?: FillOptions,
): Promise<void> {
  const user = session(options)
  if (options?.clear !== false) await clearField(el, { user })
  // The field displays a percentage, so convert. Rounding avoids the float
  // tail on values like 0.125 * 100.
  const shown = String(Math.round(fraction * 100 * 1e6) / 1e6)
  await typeSlowly(user, el, shown)
  await waitFor(() => expectSettled(el))
}

/** Drive a ColorInput. Accepts any format the component parses. */
export async function fillColor(
  el: HTMLElement,
  color: string,
  options?: FillOptions,
): Promise<void> {
  const user = session(options)
  if (options?.clear !== false) await clearField(el, { user })
  await user.click(el)
  await user.paste(color)
  await waitFor(() => expectSettled(el))
}

/** Drive a CronInput's expression field. */
export async function fillCron(
  el: HTMLElement,
  expression: string,
  options?: FillOptions,
): Promise<void> {
  const user = session(options)
  if (options?.clear !== false) await clearField(el, { user })
  await user.click(el)
  await user.paste(expression)
  await waitFor(() => expectSettled(el))
}

/** Drive a FileSizeInput. Accepts bytes or human text. */
export async function fillFileSize(
  el: HTMLElement,
  value: number | string,
  options?: FillOptions,
): Promise<void> {
  const user = session(options)
  if (options?.clear !== false) await clearField(el, { user })
  const text = typeof value === "number" ? `${value} B` : value
  await user.click(el)
  await user.paste(text)
  await waitFor(() => expectSettled(el))
}

/** Drive an IpInput. */
export async function fillIp(
  el: HTMLElement,
  address: string,
  options?: FillOptions,
): Promise<void> {
  const user = session(options)
  if (options?.clear !== false) await clearField(el, { user })
  await user.click(el)
  await user.paste(address)
  await waitFor(() => expectSettled(el))
}

/**
 * Type into a MentionInput and pick someone from the picker.
 *
 * ```ts
 * await mention(screen.getByLabelText("Comment"), "ada")
 * ```
 */
export async function mention(
  el: HTMLElement,
  handle: string,
  options?: FillOptions,
): Promise<void> {
  const user = session(options)
  await user.click(el)
  await typeSlowly(user, el, `@${handle}`)
  // Enter selects the highlighted suggestion.
  await user.keyboard("{Enter}")
}

/**
 * Simulate a real clipboard paste into a field.
 *
 * Exists so smart-paste behaviour is testable at all — `fireEvent.paste` with
 * a hand-built event does not carry clipboardData in jsdom.
 */
export async function pasteInto(
  el: HTMLElement,
  text: string,
  options?: FillOptions,
): Promise<void> {
  const user = session(options)
  await user.click(el)
  await user.paste(text)
  await waitFor(() => expectSettled(el))
}

/**
 * Move focus out of the component entirely, which is what triggers validation.
 *
 * Tabbing is not enough for composite fields: PhoneInput's country trigger and
 * CardInput's expiry are INSIDE the component, so focus moving to them is
 * deliberately not a blur. This blurs the whole thing.
 */
export async function leaveField(el: HTMLElement, options?: FillOptions): Promise<void> {
  const user = session(options)
  const root = el.closest(".inputcn-field") ?? el

  // Focus must be inside before it can leave. Without this, calling
  // leaveField on an untouched field fires no blur at all and validation
  // silently never runs — which reads as "the component is broken".
  if (!root.contains(document.activeElement)) {
    await user.click(el)
  }

  // A focusable sink outside the component, removed immediately afterwards so
  // it cannot be matched by a later query.
  const sink = document.createElement("button")
  sink.type = "button"
  sink.setAttribute("data-inputcn-test-sink", "")
  document.body.appendChild(sink)
  try {
    await user.click(sink)
    await waitFor(() => {
      if (root.contains(document.activeElement)) {
        throw new Error("focus is still inside the field")
      }
    })
  } finally {
    sink.remove()
  }
}

/** Resolves once the field has stopped reformatting between frames. */
function expectSettled(el: HTMLElement): void {
  const value = (el as HTMLInputElement).value
  if (value === undefined) return
  // A no-op assertion: waitFor needs a throwing callback to retry on, and by
  // the time this reads a stable value React has flushed.
  if (typeof value !== "string") throw new Error("value is not settled")
}
