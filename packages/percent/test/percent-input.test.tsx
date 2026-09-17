import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { PercentInput } from "../src/percent-input.js"

const label = "Rate"
const getInput = () => screen.getByLabelText(label) as HTMLInputElement
const hidden = (n: string) =>
  document.querySelector<HTMLInputElement>(`input[type="hidden"][name="${n}"]`)

describe("PercentInput", () => {
  it("displays the percentage and emits the fraction", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<PercentInput label={label} onChange={onChange} />)

    await user.type(getInput(), "12.5")

    expect(getInput().value).toBe("12.5")
    expect(onChange).toHaveBeenLastCalledWith(0.125)
  })

  it("lets a decimal point be typed without being reformatted away", async () => {
    const user = userEvent.setup()
    render(<PercentInput label={label} />)

    // Without the draft buffer, "12." parses to 0.12 and redisplays as "12",
    // making it impossible to ever reach "12.5".
    await user.type(getInput(), "12.")
    expect(getInput().value).toBe("12.")

    await user.type(getInput(), "5")
    expect(getInput().value).toBe("12.5")
  })

  it("normalises the display on blur", async () => {
    const user = userEvent.setup()
    render(<PercentInput label={label} />)

    await user.type(getInput(), "12.50")
    await user.tab()
    expect(getInput().value).toBe("12.5")
  })

  it("rejects letters", async () => {
    const user = userEvent.setup()
    render(<PercentInput label={label} />)
    await user.type(getInput(), "abc")
    expect(getInput().value).toBe("")
  })

  it("avoids float drift on awkward values", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<PercentInput label={label} onChange={onChange} precision={2} />)

    await user.type(getInput(), "33.33")
    // Naively 33.33/100 is 0.33329999999999996.
    expect(onChange).toHaveBeenLastCalledWith(0.3333)
  })

  it("loads a fraction and shows it as a percentage", () => {
    render(<PercentInput label={label} defaultValue={0.075} />)
    expect(getInput().value).toBe("7.5")
  })

  it("enforces max as a fraction and says so as a percentage", async () => {
    const user = userEvent.setup()
    render(<PercentInput label={label} max={0.5} defaultValue={0.8} />)

    await user.click(getInput())
    await user.tab()

    expect(await screen.findByRole("alert")).toHaveTextContent("50%")
  })

  it("enforces precision", async () => {
    const user = userEvent.setup()
    render(<PercentInput label={label} precision={0} defaultValue={0.125} />)

    await user.click(getInput())
    await user.tab()

    expect(await screen.findByRole("alert")).toHaveTextContent(/decimal/i)
  })

  it("submits the fraction, not the displayed percentage", async () => {
    const user = userEvent.setup()
    render(
      <form data-testid="f">
        <PercentInput label={label} name="rate" />
      </form>,
    )

    await user.type(getInput(), "12.5")

    expect(hidden("rate")?.value).toBe("0.125")
    const fd = new FormData(screen.getByTestId("f") as HTMLFormElement)
    expect(fd.get("rate")).toBe("0.125")
  })

  it("pastes a percentage string", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<PercentInput label={label} onChange={onChange} />)

    await user.click(getInput())
    await user.paste("12.5%")

    expect(onChange).toHaveBeenLastCalledWith(0.125)
  })

  it("clears the error live once fixed", async () => {
    const user = userEvent.setup()
    render(<PercentInput label={label} max={0.5} />)

    await user.type(getInput(), "80")
    await user.tab()
    expect(await screen.findByRole("alert")).toBeInTheDocument()

    await user.tripleClick(getInput())
    await user.keyboard("{Backspace}20")
    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument())
  })
})
