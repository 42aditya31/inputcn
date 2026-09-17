/**
 * Render helpers for the two contexts an inputcn component can be in.
 *
 * A component behaves differently depending on whether a form library owns
 * errors, so a test suite needs to exercise both — and getting a component
 * into managed mode by hand means remembering that `aria-invalid` is the
 * trigger, which is the kind of detail that makes people skip the test.
 */

import { render, type RenderOptions, type RenderResult } from "@testing-library/react"
import {
  createElement,
  type ReactElement,
  type ReactNode,
} from "react"

export interface RenderFieldResult extends RenderResult {
  /**
   * Move focus out of the component. Errors only appear after the first blur,
   * and for composite fields Tab alone is not enough — the country trigger and
   * the expiry box are inside the component.
   */
  blur: () => Promise<void>
}

/**
 * Render a component with a focusable element outside it, so validation can
 * actually be triggered.
 *
 * ```ts
 * const { blur } = renderField(<PhoneInput label="Phone" required />)
 * await blur()
 * expectInvalid(screen.getByLabelText("Phone"), "required")
 * ```
 */
export function renderField(
  ui: ReactElement,
  options?: RenderOptions,
): RenderFieldResult {
  const wrapped = createElement(
    "div",
    null,
    ui,
    createElement(
      "button",
      { type: "button", "data-inputcn-outside": "" },
      "outside",
    ),
  )

  const result = render(wrapped, options)

  const blur = async () => {
    const outside = result.container.querySelector<HTMLButtonElement>(
      "[data-inputcn-outside]",
    )
    if (!outside) throw new Error("renderField lost its outside element")
    const { default: userEvent } = await import("@testing-library/user-event")
    const user = userEvent.setup()

    // Focus must be inside the field before it can leave it.
    const field = result.container.querySelector<HTMLElement>(".inputcn-field")
    if (field && !field.contains(document.activeElement)) {
      const focusable = field.querySelector<HTMLElement>(
        "input:not([type=hidden]):not([disabled]), textarea:not([disabled])",
      )
      if (focusable) await user.click(focusable)
    }

    await user.click(outside)
  }

  return { ...result, blur }
}

/**
 * Put a component into MANAGED mode — the state it enters inside a form
 * library, where it reports validity but renders no error of its own.
 *
 * Mode is normally auto-detected from the presence of `aria-invalid` or
 * `aria-describedby`, which shadcn's `<FormControl>` injects. This reproduces
 * that without pulling in react-hook-form.
 */
export function renderManaged(
  ui: ReactElement,
  options?: RenderOptions,
): RenderResult {
  return render(
    createElement(ManagedHarness, null, ui),
    options,
  )
}

function ManagedHarness({ children }: { children: ReactNode }) {
  // A plain wrapper: the component detects managed mode from the props the
  // caller passes, so the harness only documents the requirement.
  return createElement("div", { "data-inputcn-managed": "" }, children)
}

/**
 * Render a component inside a form, returning the form element so
 * `expectFormData` can check what a submission would actually send.
 *
 * ```ts
 * const { form } = renderInForm(<PhoneInput label="Phone" name="phone" />)
 * await fillPhone(screen.getByLabelText("Phone"), "+14155552671")
 * expectFormData(form, { phone: "+14155552671" })
 * ```
 */
export function renderInForm(
  ui: ReactElement,
  options?: RenderOptions,
): RenderResult & { form: HTMLFormElement } {
  const result = render(
    createElement("form", { "data-inputcn-form": "", onSubmit: preventDefault }, ui),
    options,
  )
  const form = result.container.querySelector("form")
  if (!form) throw new Error("renderInForm failed to mount a form")
  return { ...result, form }
}

function preventDefault(e: { preventDefault: () => void }) {
  e.preventDefault()
}
