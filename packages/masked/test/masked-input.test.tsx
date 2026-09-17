import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useState } from "react"
import { describe, expect, it, vi } from "vitest"

import { MASKS, MaskedInput } from "../src/index.js"

const label = "Tax ID"
const getInput = () => screen.getByLabelText(label) as HTMLInputElement
const CPF = MASKS.cpf // "###.###.###-##"

describe("MaskedInput — formatting", () => {
  it("applies the mask while typing and emits the raw value", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<MaskedInput label={label} mask={CPF} onChange={onChange} />)

    await user.type(getInput(), "12345678901")

    expect(getInput().value).toBe("123.456.789-01")
    expect(onChange).toHaveBeenLastCalledWith("12345678901")
  })

  it("never emits the formatted string", async () => {
    const user = userEvent.setup()
    const seen: string[] = []
    render(<MaskedInput label={label} mask={CPF} onChange={(v) => seen.push(v)} />)

    await user.type(getInput(), "12345")

    expect(seen.every((v) => /^\d*$/.test(v))).toBe(true)
  })

  it("derives a placeholder from the mask", () => {
    render(<MaskedInput label={label} mask={CPF} />)
    expect(getInput()).toHaveAttribute("placeholder", "000.000.000-00")
  })

  it("stops at the mask's capacity", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<MaskedInput label={label} mask={CPF} onChange={onChange} />)

    await user.type(getInput(), "123456789019999")

    expect(onChange).toHaveBeenLastCalledWith("12345678901")
  })

  it("holds the caret when typing into the middle", async () => {
    const user = userEvent.setup()
    render(<MaskedInput label={label} mask={CPF} defaultValue="12345678901" />)
    const el = getInput()
    expect(el.value).toBe("123.456.789-01")

    // Caret after "123", type a digit — it must land 4th, not at the end.
    await user.type(el, "9", { initialSelectionStart: 3, initialSelectionEnd: 3 })

    expect(el.value.replace(/\D/g, "").startsWith("1239")).toBe(true)
    expect(el.selectionStart).toBeLessThan(el.value.length)
  })

  it("supports letter and alphanumeric slots", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<MaskedInput label="Plate" mask="AA-####" onChange={onChange} />)

    await user.type(screen.getByLabelText("Plate"), "ab1234")

    expect(screen.getByLabelText("Plate")).toHaveValue("ab-1234")
    expect(onChange).toHaveBeenLastCalledWith("ab1234")
  })

  it("reformats when the mask prop changes", async () => {
    function Harness() {
      const [mask, setMask] = useState<string>(CPF)
      return (
        <>
          <MaskedInput label={label} mask={mask} defaultValue="12345678901" />
          <button type="button" onClick={() => setMask("###-###-###-##")}>
            swap
          </button>
        </>
      )
    }
    const user = userEvent.setup()
    render(<Harness />)
    expect(getInput().value).toBe("123.456.789-01")

    await user.click(screen.getByRole("button", { name: "swap" }))
    await waitFor(() => expect(getInput().value).toBe("123-456-789-01"))
  })
})

describe("MaskedInput — paste", () => {
  it("accepts an already-formatted paste", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<MaskedInput label={label} mask={CPF} onChange={onChange} />)

    await user.click(getInput())
    await user.paste("123.456.789-01")

    expect(onChange).toHaveBeenLastCalledWith("12345678901")
    expect(getInput().value).toBe("123.456.789-01")
  })

  it("accepts an unformatted paste", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<MaskedInput label={label} mask={CPF} onChange={onChange} />)

    await user.click(getInput())
    await user.paste("12345678901")

    expect(onChange).toHaveBeenLastCalledWith("12345678901")
  })

  it("strips clipboard junk from Word and Google Docs", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<MaskedInput label={label} mask={CPF} onChange={onChange} />)

    await user.click(getInput())
    // zero-width space, non-breaking space, en dash
    await user.paste("​123.456.789 –01")

    expect(onChange).toHaveBeenLastCalledWith("12345678901")
  })
})

describe("MaskedInput — validation", () => {
  it("enforces `complete`", async () => {
    const user = userEvent.setup()
    render(<MaskedInput label={label} mask={CPF} complete />)

    await user.type(getInput(), "123")
    await user.tab()

    expect(await screen.findByRole("alert")).toHaveTextContent(/finish filling/i)
  })

  it("passes when the mask is fully filled", async () => {
    const user = userEvent.setup()
    render(<MaskedInput label={label} mask={CPF} complete />)

    await user.type(getInput(), "12345678901")
    await user.tab()

    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })

  it("tests `pattern` against the raw value, not the display string", async () => {
    const user = userEvent.setup()
    render(<MaskedInput label={label} mask={CPF} pattern={/^\d{11}$/} />)

    await user.type(getInput(), "12345678901")
    await user.tab()

    // Would fail if the pattern saw "123.456.789-01".
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })

  it("enforces required", async () => {
    const user = userEvent.setup()
    render(<MaskedInput label={label} mask={CPF} required />)

    await user.click(getInput())
    await user.tab()

    expect(await screen.findByRole("alert")).toHaveTextContent(/required/i)
  })
})

describe("MaskedInput — form contract", () => {
  it("submits the raw value through FormData", async () => {
    const user = userEvent.setup()
    render(
      <form data-testid="f">
        <MaskedInput label={label} mask={CPF} name="taxId" />
      </form>,
    )

    await user.type(getInput(), "12345678901")

    const fd = new FormData(screen.getByTestId("f") as HTMLFormElement)
    expect(fd.get("taxId")).toBe("12345678901")
    expect(getInput().value).toBe("123.456.789-01")
  })

  it("reflects an external reset", async () => {
    function Harness() {
      const [v, setV] = useState("12345678901")
      return (
        <>
          <MaskedInput label={label} mask={CPF} value={v} onChange={setV} />
          <button type="button" onClick={() => setV("")}>
            reset
          </button>
        </>
      )
    }
    const user = userEvent.setup()
    render(<Harness />)
    expect(getInput().value).toBe("123.456.789-01")

    await user.click(screen.getByRole("button", { name: "reset" }))
    await waitFor(() => expect(getInput().value).toBe(""))
  })

  it("renders prefix and suffix affixes", () => {
    render(<MaskedInput label={label} mask={CPF} prefix="ID" suffix="BR" />)
    expect(screen.getByText("ID")).toBeInTheDocument()
    expect(screen.getByText("BR")).toBeInTheDocument()
  })
})
