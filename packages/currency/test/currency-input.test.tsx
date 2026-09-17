import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useRef, useState } from "react"
import { describe, expect, it, vi } from "vitest"

import { CurrencyInput } from "../src/currency-input.js"

const label = "Amount"
const getInput = () => screen.getByLabelText(label) as HTMLInputElement
const hidden = (name: string) =>
  document.querySelector<HTMLInputElement>(`input[type="hidden"][name="${name}"]`)

describe("CurrencyInput — entry", () => {
  it("fills from the right and emits minor units", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<CurrencyInput label={label} onChange={onChange} />)

    await user.type(getInput(), "123450")

    expect(getInput().value).toBe("1,234.50")
    expect(onChange).toHaveBeenLastCalledWith(123450)
  })

  it("emits an integer, never a float", async () => {
    const user = userEvent.setup()
    const seen: number[] = []
    render(<CurrencyInput label={label} onChange={(v) => seen.push(v)} />)

    await user.type(getInput(), "199")

    expect(seen.every(Number.isInteger)).toBe(true)
    expect(seen.at(-1)).toBe(199)
  })

  it("backspace removes the right-most digit", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<CurrencyInput label={label} defaultValue={12345} onChange={onChange} />)

    await user.click(getInput())
    await user.keyboard("{Backspace}")

    expect(onChange).toHaveBeenLastCalledWith(1234)
  })

  it("ignores letters entirely", async () => {
    const user = userEvent.setup()
    render(<CurrencyInput label={label} />)

    await user.type(getInput(), "abc")
    expect(getInput().value).toBe("")
  })

  it("steps with the arrow keys by one whole unit", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<CurrencyInput label={label} defaultValue={500} onChange={onChange} />)

    await user.click(getInput())
    await user.keyboard("{ArrowUp}")
    expect(onChange).toHaveBeenLastCalledWith(600)

    await user.keyboard("{ArrowDown}")
    await user.keyboard("{ArrowDown}")
    expect(onChange).toHaveBeenLastCalledWith(400)
  })

  it("does not go negative unless allowed", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<CurrencyInput label={label} defaultValue={0} onChange={onChange} />)

    await user.click(getInput())
    await user.keyboard("{ArrowDown}")
    expect(onChange).toHaveBeenLastCalledWith(0)
  })

  it("supports negation when allowNegative is set", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <CurrencyInput label={label} defaultValue={500} allowNegative onChange={onChange} />,
    )

    await user.click(getInput())
    await user.keyboard("-")
    expect(onChange).toHaveBeenLastCalledWith(-500)
  })
})

describe("CurrencyInput — locale & currency", () => {
  it("formats for the given locale", () => {
    render(<CurrencyInput label={label} currency="EUR" locale="de-DE" defaultValue={123450} />)
    expect(getInput().value).toBe("1.234,50")
  })

  it("handles a zero-decimal currency", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<CurrencyInput label={label} currency="JPY" onChange={onChange} />)

    await user.type(getInput(), "1235")

    expect(getInput().value).toBe("1,235")
    expect(onChange).toHaveBeenLastCalledWith(1235)
  })
})

describe("CurrencyInput — smart paste", () => {
  it("parses a messy amount and reports the detected currency", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<CurrencyInput label={label} currency="EUR" onChange={onChange} />)

    await user.click(getInput())
    await user.paste("$1,234.50 USD")

    expect(onChange).toHaveBeenLastCalledWith(123450)
    expect(await screen.findByRole("status")).toHaveTextContent(/USD/)
  })

  it("undo restores the prior amount", async () => {
    const user = userEvent.setup()
    render(<CurrencyInput label={label} currency="EUR" defaultValue={999} />)

    await user.click(getInput())
    await user.paste("$1,234.50 USD")
    await user.click(screen.getByRole("button", { name: /undo/i }))

    expect(getInput().value).toBe("9.99")
  })
})

describe("CurrencyInput — validation (REQ-V)", () => {
  it("enforces `positive` with no schema", async () => {
    const user = userEvent.setup()
    render(<CurrencyInput label={label} positive allowNegative defaultValue={-100} />)

    await user.click(getInput())
    await user.tab()

    expect(await screen.findByRole("alert")).toHaveTextContent(/greater than zero/i)
  })

  it("enforces `max` and formats the bound in the message", async () => {
    const user = userEvent.setup()
    render(<CurrencyInput label={label} max={10000} defaultValue={20000} />)

    await user.click(getInput())
    await user.tab()

    expect(await screen.findByRole("alert")).toHaveTextContent("100.00")
  })

  it("enforces wholeUnitsOnly", async () => {
    const user = userEvent.setup()
    render(<CurrencyInput label={label} wholeUnitsOnly defaultValue={12345} />)

    await user.click(getInput())
    await user.tab()

    expect(await screen.findByRole("alert")).toHaveTextContent(/whole number/i)
  })

  it("passes when the value satisfies every constraint", async () => {
    const user = userEvent.setup()
    render(
      <CurrencyInput label={label} required positive max={100000} defaultValue={5000} />,
    )

    await user.click(getInput())
    await user.tab()

    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })

  it("stays silent before the first blur", async () => {
    const user = userEvent.setup()
    render(<CurrencyInput label={label} min={10000} />)

    await user.type(getInput(), "1")
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })

  it("clears live once the value becomes valid", async () => {
    const user = userEvent.setup()
    render(<CurrencyInput label={label} min={10000} />)

    await user.type(getInput(), "1")
    await user.tab()
    expect(await screen.findByRole("alert")).toBeInTheDocument()

    await user.click(getInput())
    await user.type(getInput(), "000000")
    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument())
  })
})

describe("CurrencyInput — form contract (REQ-F)", () => {
  it("submits minor units through FormData, not the display string", async () => {
    const user = userEvent.setup()
    render(
      <form data-testid="f">
        <CurrencyInput label={label} name="amount" />
      </form>,
    )

    await user.type(getInput(), "123450")

    expect(getInput().value).toBe("1,234.50")
    expect(hidden("amount")?.value).toBe("123450")

    const fd = new FormData(screen.getByTestId("f") as HTMLFormElement)
    expect(fd.get("amount")).toBe("123450")
  })

  it("forwards a working ref", async () => {
    function Harness() {
      const ref = useRef<HTMLInputElement>(null)
      return (
        <>
          <CurrencyInput label={label} ref={ref} />
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

  it("reflects an external reset", async () => {
    function Harness() {
      const [v, setV] = useState(123450)
      return (
        <>
          <CurrencyInput label={label} value={v} onChange={setV} />
          <button type="button" onClick={() => setV(0)}>
            reset
          </button>
        </>
      )
    }
    const user = userEvent.setup()
    render(<Harness />)
    expect(getInput().value).toBe("1,234.50")

    await user.click(screen.getByRole("button", { name: "reset" }))
    await waitFor(() => expect(getInput().value).toBe(""))
  })

  it("stays silent when a form owns the errors", async () => {
    const user = userEvent.setup()
    render(<CurrencyInput label={label} required aria-invalid={true} />)

    await user.click(getInput())
    await user.tab()

    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })
})

describe("CurrencyInput — layouts (PRD §6)", () => {
  it("renders the stepper layout with working buttons", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <CurrencyInput
        label={label}
        layout="stepper"
        defaultValue={25000}
        step={2500}
        onChange={onChange}
      />,
    )

    await user.click(screen.getByRole("button", { name: /increase/i }))
    expect(onChange).toHaveBeenLastCalledWith(27500)

    await user.click(screen.getByRole("button", { name: /decrease/i }))
    await user.click(screen.getByRole("button", { name: /decrease/i }))
    expect(onChange).toHaveBeenLastCalledWith(22500)
  })

  it("renders the display layout", () => {
    render(<CurrencyInput label={label} layout="display" defaultValue={123450} />)
    expect(getInput()).toHaveClass("inputcn-display-input")
    expect(getInput().value).toBe("1,234.50")
  })

  it("disables the stepper buttons when disabled", () => {
    render(<CurrencyInput label={label} layout="stepper" disabled />)
    expect(screen.getByRole("button", { name: /increase/i })).toBeDisabled()
    expect(screen.getByRole("button", { name: /decrease/i })).toBeDisabled()
  })
})
