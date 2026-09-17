/**
 * Assertions for inputcn components.
 *
 * The important one is `expectInvalid(field, rule)`: it asserts WHICH RULE
 * failed, not the message text. A test written against copy breaks when the
 * copy is reworded or the app switches locale — and then gets deleted rather
 * than fixed. Asserting the rule survives both.
 */

import { waitFor, within } from "@testing-library/react"

/** The root element of a component, given any element inside it. */
export function fieldRoot(el: HTMLElement): HTMLElement {
  const root = el.closest(".inputcn-field")
  if (!(root instanceof HTMLElement)) {
    throw new Error(
      "Not inside an inputcn component. Pass an element from one — the input, or its label target.",
    )
  }
  return root
}

/**
 * Read the CANONICAL value — what gets submitted and what `onChange` emits —
 * rather than the formatted string on screen.
 *
 * Requires a `name` prop, since the canonical value lives in the hidden
 * submission input.
 */
export function getCanonical(el: HTMLElement, name?: string): string {
  const root = fieldRoot(el)
  const selector = name
    ? `input[type="hidden"][name="${name}"]`
    : 'input[type="hidden"][name]'
  const hidden = root.querySelector<HTMLInputElement>(selector)
  if (!hidden) {
    throw new Error(
      `No hidden submission input found. Pass a \`name\` prop to the component so the canonical value is exposed.`,
    )
  }
  return hidden.value
}

/** The formatted string the user sees. */
export function getDisplay(el: HTMLElement): string {
  return (el as HTMLInputElement).value ?? ""
}

/**
 * Assert the canonical value, with a message that shows both forms when it
 * fails — the usual confusion is display-vs-canonical, so say which is which.
 */
export function expectValue(el: HTMLElement, expected: string, name?: string): void {
  const actual = getCanonical(el, name)
  if (actual !== expected) {
    throw new Error(
      `Expected canonical value ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}.\n` +
        `  The field displays ${JSON.stringify(getDisplay(el))} — display and canonical value are not the same thing.`,
    )
  }
}

/** The error element a component is currently rendering, if any. */
export function getError(el: HTMLElement): HTMLElement | null {
  const root = fieldRoot(el)
  return root.querySelector<HTMLElement>(".inputcn-error, .inputcn-warning")
}

/** Assert the field is showing no error. */
export function expectValid(el: HTMLElement): void {
  const error = getError(el)
  if (error) {
    throw new Error(
      `Expected the field to be valid, but it is showing: ${JSON.stringify(error.textContent)}`,
    )
  }
  const invalid = (el as HTMLInputElement).getAttribute("aria-invalid")
  if (invalid === "true") {
    throw new Error("Expected the field to be valid, but aria-invalid is true.")
  }
}

/**
 * Assert the field is showing an error.
 *
 * Pass a `rule` to assert which one failed — `"max"`, `"luhn"`,
 * `"phoneMobileOnly"`. The rule name is stable; the message is not.
 *
 * ```ts
 * expectInvalid(amount, "max")     // survives a copy rewrite
 * ```
 */
export function expectInvalid(el: HTMLElement, rule?: string): void {
  const error = getError(el)
  if (!error) {
    throw new Error(
      "Expected the field to be invalid, but no error is shown.\n" +
        "  Errors only appear after the first blur — use `leaveField(el)` first.\n" +
        "  Inside a form library, the component stays silent by design and the form owns the message.",
    )
  }
  if (rule !== undefined) {
    const actual = error.getAttribute("data-rule")
    if (actual === null) {
      throw new Error(
        `Cannot assert the rule: the error element has no data-rule attribute. ` +
          `This component may predate rule reporting.`,
      )
    }
    if (actual !== rule) {
      throw new Error(
        `Expected rule ${JSON.stringify(rule)} to fail, but ${JSON.stringify(actual)} did.\n` +
          `  Message shown: ${JSON.stringify(error.textContent)}`,
      )
    }
  }
}

/** Assert an advisory warning rather than a blocking error. */
export function expectWarning(el: HTMLElement, rule?: string): void {
  const root = fieldRoot(el)
  const warning = root.querySelector<HTMLElement>(".inputcn-warning")
  if (!warning) {
    const error = root.querySelector(".inputcn-error")
    throw new Error(
      error
        ? `Expected a warning, but the field is showing a blocking error: ${JSON.stringify(error.textContent)}`
        : "Expected a warning, but the field is showing nothing.",
    )
  }
  if (rule !== undefined && warning.getAttribute("data-rule") !== rule) {
    throw new Error(
      `Expected warning rule ${JSON.stringify(rule)}, got ${JSON.stringify(warning.getAttribute("data-rule"))}.`,
    )
  }
}

/** Await an error appearing, for validation that settles asynchronously. */
export async function findInvalid(el: HTMLElement, rule?: string): Promise<void> {
  await waitFor(() => expectInvalid(el, rule))
}

/** Await the error clearing — the "fix it and the message goes" behaviour. */
export async function findValid(el: HTMLElement): Promise<void> {
  await waitFor(() => expectValid(el))
}

/**
 * Assert what a native form submission would actually send.
 *
 * The check that catches the single most common production bug in hand-rolled
 * fields: submitting `(415) 555-2671` instead of `+14155552671`.
 */
export function expectFormData(
  form: HTMLFormElement,
  expected: Record<string, string>,
): void {
  const fd = new FormData(form)
  const actual: Record<string, string> = {}
  for (const [k, v] of fd.entries()) actual[k] = String(v)

  for (const [key, want] of Object.entries(expected)) {
    if (actual[key] !== want) {
      throw new Error(
        `FormData mismatch for ${JSON.stringify(key)}:\n` +
          `  expected ${JSON.stringify(want)}\n` +
          `  received ${JSON.stringify(actual[key])}\n` +
          `  full payload: ${JSON.stringify(actual)}`,
      )
    }
  }
}

/** The options a mention or country picker is currently offering. */
export function getOptions(el: HTMLElement): string[] {
  const root = fieldRoot(el)
  return within(root)
    .queryAllByRole("option")
    .map((o) => o.textContent?.trim() ?? "")
}
