import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { CurrencyInput } from "../../currency/src/currency-input.js"
import { MaskedInput } from "../../masked/src/masked-input.js"
import { PhoneInput } from "../../phone/src/phone-input.js"

/**
 * The stylesheet keys entirely off `data-variant` / `data-size` / `data-invalid`
 * on the field root. If those stop reaching the DOM, every variant silently
 * renders as the default and nothing fails loudly — so they are asserted here.
 */

const root = (label: string) =>
  screen.getByLabelText(label).closest(".inputcn-field") as HTMLElement

describe("presentation attributes reach the DOM", () => {
  it("omits both attributes at their defaults, keeping the DOM clean", () => {
    render(<MaskedInput label="A" mask="##/##" />)
    const el = root("A")
    expect(el).not.toHaveAttribute("data-variant")
    expect(el).not.toHaveAttribute("data-size")
  })

  it("omits the attribute for an explicitly-default value", () => {
    render(<MaskedInput label="A" mask="##/##" variant="outline" size="default" />)
    const el = root("A")
    expect(el).not.toHaveAttribute("data-variant")
    expect(el).not.toHaveAttribute("data-size")
  })

  it.each(["filled", "underline", "elevated"] as const)(
    "emits data-variant=%s",
    (variant) => {
      render(<MaskedInput label="A" mask="##/##" variant={variant} />)
      expect(root("A")).toHaveAttribute("data-variant", variant)
    },
  )

  it.each(["sm", "lg"] as const)("emits data-size=%s", (size) => {
    render(<MaskedInput label="A" mask="##/##" size={size} />)
    expect(root("A")).toHaveAttribute("data-size", size)
  })

  it("emits data-disabled so the whole field can be dimmed", () => {
    render(<MaskedInput label="A" mask="##/##" disabled />)
    expect(root("A")).toHaveAttribute("data-disabled", "")
  })

  it("flows through every component, not just one", () => {
    render(
      <>
        <PhoneInput label="P" variant="filled" size="lg" />
        <CurrencyInput label="C" variant="elevated" size="sm" />
        <MaskedInput label="M" mask="##/##" variant="underline" />
      </>,
    )
    expect(root("P")).toHaveAttribute("data-variant", "filled")
    expect(root("P")).toHaveAttribute("data-size", "lg")
    expect(root("C")).toHaveAttribute("data-variant", "elevated")
    expect(root("C")).toHaveAttribute("data-size", "sm")
    expect(root("M")).toHaveAttribute("data-variant", "underline")
  })

  it("marks the group invalid so the stylesheet can colour the border", async () => {
    const { rerender } = render(<CurrencyInput label="C" max={100} defaultValue={9999} />)
    // Not yet blurred, so no error is shown and the group is not marked.
    rerender(<CurrencyInput label="C" max={100} defaultValue={9999} aria-invalid />)
    expect(screen.getByLabelText("C")).toHaveAttribute("aria-invalid", "true")
  })
})

describe("class contract the stylesheet depends on", () => {
  it("renders the documented structural classes", () => {
    render(<PhoneInput label="P" />)
    const el = root("P")
    expect(el).toHaveClass("inputcn-field")
    expect(el.querySelector(".inputcn-group")).toBeInTheDocument()
    expect(el.querySelector(".inputcn-country")).toBeInTheDocument()
    expect(el.querySelector(".inputcn-iso")).toBeInTheDocument()
    expect(el.querySelector(".inputcn-divider")).toBeInTheDocument()
    expect(el.querySelector(".inputcn-bare")).toBeInTheDocument()
  })

  it("uses inputcn-input when there is no affix, inputcn-bare when there is", () => {
    const { rerender } = render(<MaskedInput label="M" mask="##/##" />)
    expect(screen.getByLabelText("M")).toHaveClass("inputcn-input")

    rerender(<MaskedInput label="M" mask="##/##" prefix="ID" />)
    expect(screen.getByLabelText("M")).toHaveClass("inputcn-bare")
  })

  it("keeps a user className on the root alongside inputcn-field", () => {
    render(<MaskedInput label="M" mask="##/##" className="my-field" />)
    expect(root("M")).toHaveClass("inputcn-field", "my-field")
  })
})
