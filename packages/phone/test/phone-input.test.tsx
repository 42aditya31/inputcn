import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useRef, useState } from "react"
import { describe, expect, it, vi } from "vitest"

import { PhoneInput } from "../src/phone-input.js"

const label = "Phone"
const getInput = () => screen.getByLabelText(label) as HTMLInputElement
const hidden = (name: string) =>
  document.querySelector<HTMLInputElement>(`input[type="hidden"][name="${name}"]`)

describe("PhoneInput — formatting", () => {
  it("formats while typing and emits E.164", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<PhoneInput label={label} onChange={onChange} />)

    await user.type(getInput(), "4155552671")

    expect(getInput().value).toBe("(415) 555-2671")
    expect(onChange).toHaveBeenLastCalledWith("+14155552671")
  })

  it("never emits the display string", async () => {
    const user = userEvent.setup()
    const seen: string[] = []
    render(<PhoneInput label={label} onChange={(v) => seen.push(v)} />)

    await user.type(getInput(), "415")

    expect(seen.every((v) => /^\+\d*$/.test(v))).toBe(true)
  })

  it("keeps the caret when typing into the middle", async () => {
    const user = userEvent.setup()
    render(<PhoneInput label={label} defaultValue="+14155552671" />)
    const el = getInput()
    expect(el.value).toBe("(415) 555-2671")

    // Place the caret after the area code's "415" and type a digit.
    el.setSelectionRange(4, 4)
    await user.type(el, "9", { initialSelectionStart: 4, initialSelectionEnd: 4 })

    // The new digit is the 4th; the caret must sit right after it, not at the end.
    expect(el.value.replace(/\D/g, "").startsWith("4159")).toBe(true)
    expect(el.selectionStart).toBeLessThan(el.value.length)
  })

  it("backspace removes a digit rather than stalling on a separator", async () => {
    const user = userEvent.setup()
    render(<PhoneInput label={label} defaultValue="+1415555267" />)
    const el = getInput()
    el.focus()
    el.setSelectionRange(el.value.length, el.value.length)

    await user.keyboard("{Backspace}")
    expect(el.value.replace(/\D/g, "")).toBe("41555526")
  })
})

describe("PhoneInput — smart paste (PRD §11.2)", () => {
  it("extracts a number from a sentence", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<PhoneInput label={label} onChange={onChange} />)

    await user.click(getInput())
    await user.paste("Call me at (415) 555-2671")

    expect(onChange).toHaveBeenLastCalledWith("+14155552671")
  })

  it("switches country and surfaces it as an undoable notice", async () => {
    const user = userEvent.setup()
    render(<PhoneInput label={label} defaultValue="" />)

    await user.click(getInput())
    await user.paste("+442071234567")

    const notice = await screen.findByRole("status")
    expect(notice).toHaveTextContent(/Switched to United Kingdom/i)
    expect(getInput().value).toBe("2071 234567")

    await user.click(screen.getByRole("button", { name: /undo/i }))
    expect(screen.queryByRole("status")).not.toBeInTheDocument()
    expect(getInput().value).toBe("")
  })

  it("does not announce a switch when the country is unchanged", async () => {
    const user = userEvent.setup()
    render(<PhoneInput label={label} defaultCountry="US" />)

    await user.click(getInput())
    await user.paste("+1 415 555 2671")

    expect(screen.queryByRole("status")).not.toBeInTheDocument()
  })
})

describe("PhoneInput — validation (REQ-V)", () => {
  it("zero-config: validates with only constraint props, no schema or form", async () => {
    const user = userEvent.setup()
    render(<PhoneInput label={label} required />)

    await user.click(getInput())
    await user.tab()

    expect(await screen.findByRole("alert")).toHaveTextContent(/required/i)
  })

  it("stays silent before the first blur", async () => {
    const user = userEvent.setup()
    render(<PhoneInput label={label} required />)

    await user.type(getInput(), "415")
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })

  it("shows on blur, then clears live once fixed", async () => {
    const user = userEvent.setup()
    render(<PhoneInput label={label} required />)

    await user.type(getInput(), "415")
    await user.tab()
    expect(await screen.findByRole("alert")).toBeInTheDocument()

    await user.type(getInput(), "5552671")
    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument())
  })

  it("enforces mobileOnly", async () => {
    const user = userEvent.setup()
    render(<PhoneInput label={label} defaultCountry="GB" mobileOnly />)

    await user.type(getInput(), "2071234567") // London landline
    await user.tab()

    expect(await screen.findByRole("alert")).toHaveTextContent(/landline/i)
  })

  it("accepts a mobile when mobileOnly is set", async () => {
    const user = userEvent.setup()
    render(<PhoneInput label={label} defaultCountry="GB" mobileOnly />)

    await user.type(getInput(), "7911123456")
    await user.tab()

    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })

  it("honours a custom required message", async () => {
    const user = userEvent.setup()
    render(<PhoneInput label={label} required="We need a number to text you" />)

    await user.click(getInput())
    await user.tab()

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "We need a number to text you",
    )
  })

  it("instance messages beat built-in defaults", async () => {
    const user = userEvent.setup()
    render(
      <PhoneInput label={label} required messages={{ required: "Required, sorry" }} />,
    )

    await user.click(getInput())
    await user.tab()

    expect(await screen.findByRole("alert")).toHaveTextContent("Required, sorry")
  })

  it("links the error to the input via aria-describedby", async () => {
    const user = userEvent.setup()
    render(<PhoneInput label={label} required />)

    await user.click(getInput())
    await user.tab()

    const alert = await screen.findByRole("alert")
    expect(getInput()).toHaveAttribute("aria-describedby", alert.id)
    expect(getInput()).toHaveAttribute("aria-invalid", "true")
  })
})

describe("PhoneInput — mode detection (PRD §9.1)", () => {
  it("renders its own error in standalone mode", async () => {
    const user = userEvent.setup()
    render(<PhoneInput label={label} required />)
    await user.click(getInput())
    await user.tab()
    expect(await screen.findByRole("alert")).toBeInTheDocument()
  })

  it("renders NO error when a form supplies aria-invalid", async () => {
    const user = userEvent.setup()
    render(<PhoneInput label={label} required aria-invalid={true} />)

    await user.click(getInput())
    await user.tab()

    // The host form owns the message; the component must stay silent.
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
    expect(getInput()).toHaveAttribute("aria-invalid", "true")
  })

  it("renders NO error when a form supplies aria-describedby", async () => {
    const user = userEvent.setup()
    render(<PhoneInput label={label} required aria-describedby="form-msg" />)

    await user.click(getInput())
    await user.tab()

    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })
})

describe("PhoneInput — form contract (REQ-F)", () => {
  it("submits the canonical value through FormData, not the display string", async () => {
    const user = userEvent.setup()
    render(
      <form data-testid="f">
        <PhoneInput label={label} name="phone" />
      </form>,
    )

    await user.type(getInput(), "4155552671")

    expect(getInput().value).toBe("(415) 555-2671")
    expect(hidden("phone")?.value).toBe("+14155552671")

    const fd = new FormData(screen.getByTestId("f") as HTMLFormElement)
    expect(fd.get("phone")).toBe("+14155552671")
  })

  it("forwards a ref whose focus() reaches the number input", async () => {
    function Harness() {
      const ref = useRef<HTMLInputElement>(null)
      return (
        <>
          <PhoneInput label={label} ref={ref} />
          <button type="button" onClick={() => ref.current?.focus()}>
            focus
          </button>
        </>
      )
    }
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByRole("button", { name: "focus" }))
    expect(document.activeElement).toBe(getInput())
  })

  it("reflects an external value change, as form.reset() would", async () => {
    function Harness() {
      const [v, setV] = useState("+14155552671")
      return (
        <>
          <PhoneInput label={label} value={v} onChange={setV} />
          <button type="button" onClick={() => setV("")}>
            reset
          </button>
        </>
      )
    }
    const user = userEvent.setup()
    render(<Harness />)
    expect(getInput().value).toBe("(415) 555-2671")

    await user.click(screen.getByRole("button", { name: "reset" }))
    await waitFor(() => expect(getInput().value).toBe(""))
  })

  it("does not fire onBlur when focus moves within the component", async () => {
    const user = userEvent.setup()
    const onBlur = vi.fn()
    render(<PhoneInput label={label} onBlur={onBlur} />)

    await user.click(getInput())
    await user.click(screen.getByRole("button", { name: /country/i }))
    expect(onBlur).not.toHaveBeenCalled()
  })

  it("fires onBlur when focus leaves the component", async () => {
    const user = userEvent.setup()
    const onBlur = vi.fn()
    render(
      <>
        <PhoneInput label={label} onBlur={onBlur} />
        <button type="button">outside</button>
      </>,
    )

    await user.click(getInput())
    await user.click(screen.getByRole("button", { name: "outside" }))
    expect(onBlur).toHaveBeenCalledTimes(1)
  })

  it("disables every sub-control, including the country trigger", () => {
    render(<PhoneInput label={label} disabled />)
    expect(getInput()).toBeDisabled()
    expect(screen.getByRole("button", { name: /country/i })).toBeDisabled()
  })

  it("reports validity upward via onValidityChange", async () => {
    const user = userEvent.setup()
    const onValidityChange = vi.fn()
    render(<PhoneInput label={label} required onValidityChange={onValidityChange} />)

    await user.type(getInput(), "4155552671")

    await waitFor(() =>
      expect(onValidityChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ valid: true }),
      ),
    )
  })
})

describe("PhoneInput — country selector", () => {
  it("opens, filters, and selects with the keyboard", async () => {
    const user = userEvent.setup()
    render(<PhoneInput label={label} />)

    await user.click(screen.getByRole("button", { name: /country/i }))
    const search = screen.getByRole("textbox", { name: /search country/i })
    await user.type(search, "United King")
    await user.keyboard("{Enter}")

    expect(screen.getByRole("button", { name: /country: United Kingdom/i })).toBeInTheDocument()
  })

  it("closes on Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup()
    render(<PhoneInput label={label} />)

    const trigger = screen.getByRole("button", { name: /country/i })
    await user.click(trigger)
    await user.keyboard("{Escape}")

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    expect(document.activeElement).toBe(trigger)
  })

  it("restricts the list when `countries` is given", async () => {
    const user = userEvent.setup()
    render(<PhoneInput label={label} countries={["US", "CA"]} />)

    await user.click(screen.getByRole("button", { name: /country/i }))
    expect(screen.getAllByRole("option")).toHaveLength(2)
  })

  it("keeps typed digits when the country changes", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<PhoneInput label={label} onChange={onChange} />)

    await user.type(getInput(), "4155552671")
    await user.click(screen.getByRole("button", { name: /country/i }))
    await user.click(screen.getByRole("option", { name: /United Kingdom/i }))

    expect(onChange).toHaveBeenLastCalledWith("+444155552671")
  })
})
