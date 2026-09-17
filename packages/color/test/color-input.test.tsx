import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { ColorInput } from "../src/color-input.js"

/**
 * ColorInput contains focusable swatch buttons, so Tab moves WITHIN the
 * component and correctly does not blur it (§10.2). These tests leave it.
 */
function withOutside(ui: React.ReactElement) {
  return (
    <>
      {ui}
      <button type="button">outside</button>
    </>
  )
}

const leaveField = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole("button", { name: "outside" }))
}

const label = "Brand colour"
const input = () => screen.getByLabelText(label) as HTMLInputElement
const hidden = (n: string) =>
  document.querySelector<HTMLInputElement>(`input[type="hidden"][name="${n}"]`)

describe("ColorInput", () => {
  it("emits canonical uppercase hex", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<ColorInput label={label} onChange={onChange} />)

    await user.type(input(), "#3a3fd6")
    expect(onChange).toHaveBeenLastCalledWith("#3A3FD6")
  })

  it("lets a partial value be typed without fighting the user", async () => {
    const user = userEvent.setup()
    render(<ColorInput label={label} />)

    // "#3" is not a colour; the field must still show it.
    await user.type(input(), "#3")
    expect(input().value).toBe("#3")
  })

  it("normalises on blur", async () => {
    const user = userEvent.setup()
    render(<ColorInput label={label} />)

    await user.type(input(), "3a3fd6")
    await user.tab()
    expect(input().value).toBe("#3A3FD6")
  })

  it("accepts rgb() and converts it", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<ColorInput label={label} onChange={onChange} />)

    await user.click(input())
    await user.paste("rgb(58, 63, 214)")
    expect(onChange).toHaveBeenLastCalledWith("#3A3FD6")
  })

  it("extracts a colour from a pasted CSS declaration", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<ColorInput label={label} onChange={onChange} />)

    await user.click(input())
    await user.paste("color: #16A34A;")
    expect(onChange).toHaveBeenLastCalledWith("#16A34A")
  })

  it("applies a swatch", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<ColorInput label={label} swatches={["#DC2626"]} onChange={onChange} />)

    await user.click(screen.getByRole("button", { name: "#DC2626" }))
    expect(onChange).toHaveBeenLastCalledWith("#DC2626")
  })

  it("can emit rgb instead of hex", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<ColorInput label={label} outputFormat="rgb" onChange={onChange} />)

    await user.click(input())
    await user.paste("#3A3FD6")
    expect(onChange).toHaveBeenLastCalledWith("rgb(58, 63, 214)")
  })
})

describe("ColorInput — contrast", () => {
  it("shows the live ratio against the reference colour", () => {
    render(<ColorInput label={label} defaultValue="#3A3FD6" contrastAgainst="#FFFFFF" />)
    // Deep blue on white clears AA.
    expect(screen.getByText(/:1$/)).toBeInTheDocument()
    expect(screen.getByText(/against #FFFFFF/)).toBeInTheDocument()
  })

  it("warns — not errors — when a brand colour fails the threshold", async () => {
    const user = userEvent.setup()
    render(
      withOutside(
      <ColorInput
        label={label}
        defaultValue="#FFF9C4"
        contrastAgainst="#FFFFFF"
        minContrast={4.5}
      />,
      ),
    )

    await user.click(input())
    await leaveField(user)

    const alert = await screen.findByRole("alert")
    // Pale yellow on white: the exact case the constraint exists to catch.
    expect(alert).toHaveTextContent(/Contrast is/)
    expect(alert).toHaveTextContent(/needs 4.5:1/)
    // A warning, so it reports the measured ratio rather than a placeholder.
    expect(alert.textContent).not.toMatch(/—:1/)
    expect(alert).toHaveClass("inputcn-warning")
  })

  it("stays quiet when the colour clears the threshold", async () => {
    const user = userEvent.setup()
    render(
      withOutside(
      <ColorInput
        label={label}
        defaultValue="#0F172A"
        contrastAgainst="#FFFFFF"
        minContrast={4.5}
      />,
      ),
    )

    await user.click(input())
    await leaveField(user)
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })
})

describe("ColorInput — validation and form", () => {
  it("rejects an unparseable colour", async () => {
    const user = userEvent.setup()
    render(withOutside(<ColorInput label={label} />))

    await user.type(input(), "reddish")
    await leaveField(user)
    expect(await screen.findByRole("alert")).toHaveTextContent(/valid colour/i)
  })

  it("enforces an allowed palette", async () => {
    const user = userEvent.setup()
    render(
      withOutside(
        <ColorInput label={label} allowed={["#DC2626", "#16A34A"]} defaultValue="#3A3FD6" />,
      ),
    )

    await user.click(input())
    await leaveField(user)
    expect(await screen.findByRole("alert")).toBeInTheDocument()
  })

  it("submits the canonical value", async () => {
    const user = userEvent.setup()
    render(
      <form data-testid="f">
        <ColorInput label={label} name="brand" />
      </form>,
    )

    await user.type(input(), "3a3fd6")

    expect(hidden("brand")?.value).toBe("#3A3FD6")
    const fd = new FormData(screen.getByTestId("f") as HTMLFormElement)
    expect(fd.get("brand")).toBe("#3A3FD6")
  })

  it("clears the error live once corrected", async () => {
    const user = userEvent.setup()
    render(withOutside(<ColorInput label={label} />))

    await user.type(input(), "nope")
    await leaveField(user)
    expect(await screen.findByRole("alert")).toBeInTheDocument()

    await user.tripleClick(input())
    await user.paste("#16A34A")
    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument())
  })
})
