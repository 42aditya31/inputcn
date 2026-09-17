import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { CardInput } from "../src/card-input.js"

/**
 * CardInput is a composite: number, expiry and CVC live inside one field.
 * Tabbing between them is NOT a blur of the component — that is the whole
 * point of component-level blur — so these helpers leave it entirely.
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

const VISA = "4242424242424242"
const AMEX = "378282246310005"

const number = () => screen.getByLabelText("Card number") as HTMLInputElement
const hidden = (n: string) =>
  document.querySelector<HTMLInputElement>(`input[type="hidden"][name="${n}"]`)

describe("CardInput — number", () => {
  it("groups in fours and emits digits only", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<CardInput label="Card" onChange={onChange} />)

    await user.type(number(), VISA)

    expect(number().value).toBe("4242 4242 4242 4242")
    expect(onChange).toHaveBeenLastCalledWith(VISA)
  })

  it("reflows the grouping when the brand changes", async () => {
    const user = userEvent.setup()
    render(<CardInput label="Card" />)

    await user.type(number(), AMEX)
    // Amex is 4-6-5, not 4-4-4-4.
    expect(number().value).toBe("3782 822463 10005")
  })

  it("shows the detected brand", async () => {
    const user = userEvent.setup()
    render(<CardInput label="Card" />)

    await user.type(number(), "4242")
    expect(screen.getByText("Visa")).toBeInTheDocument()
  })

  it("caps at the brand's length", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<CardInput label="Card" onChange={onChange} />)

    await user.type(number(), AMEX + "9999")
    expect(onChange).toHaveBeenLastCalledWith(AMEX)
  })

  it("accepts a punctuated paste", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<CardInput label="Card" onChange={onChange} />)

    await user.click(number())
    await user.paste("4242-4242-4242-4242")

    expect(onChange).toHaveBeenLastCalledWith(VISA)
  })
})

describe("CardInput — validation", () => {
  it("rejects a failed Luhn check", async () => {
    const user = userEvent.setup()
    render(withOutside(<CardInput label="Card" defaultValue="4242424242424243" />))

    await user.click(number())
    await leaveField(user)

    expect(await screen.findByRole("alert")).toHaveTextContent(/not valid/i)
  })

  it("accepts a valid number", async () => {
    const user = userEvent.setup()
    render(withOutside(<CardInput label="Card" defaultValue={VISA} />))

    await user.click(number())
    await leaveField(user)

    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })

  it("rejects a brand the PSP does not accept", async () => {
    const user = userEvent.setup()
    render(
      withOutside(
        <CardInput label="Card" brands={["visa", "mastercard"]} defaultValue={AMEX} />,
      ),
    )

    await user.click(number())
    await leaveField(user)

    expect(await screen.findByRole("alert")).toHaveTextContent(/Visa, Mastercard/i)
  })

  it("rejects an expired card when notExpired is set", async () => {
    const user = userEvent.setup()
    render(
      withOutside(
        <CardInput label="Card" notExpired defaultValue={VISA} defaultExpiry="01 / 20" />,
      ),
    )

    await user.click(number())
    await leaveField(user)

    expect(await screen.findByRole("alert")).toHaveTextContent(/expired/i)
  })

  it("does not fail on an empty expiry — that is `required`'s job", async () => {
    const user = userEvent.setup()
    render(withOutside(<CardInput label="Card" notExpired defaultValue={VISA} />))

    await user.click(number())
    await leaveField(user)

    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })

  it("clears the error live once the number is corrected", async () => {
    const user = userEvent.setup()
    render(withOutside(<CardInput label="Card" />))

    await user.type(number(), "4242424242424243")
    await leaveField(user)
    expect(await screen.findByRole("alert")).toBeInTheDocument()

    await user.click(number())
    await user.keyboard("{Backspace}2")
    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument())
  })
})

describe("CardInput — expiry and CVC", () => {
  it("formats the expiry as it is typed", async () => {
    const user = userEvent.setup()
    render(<CardInput label="Card" />)

    const exp = screen.getByLabelText(/expiry/i)
    await user.type(exp, "0428")
    expect(exp).toHaveValue("04 / 28")
  })

  it("sizes the CVC to the brand", async () => {
    const user = userEvent.setup()
    const { rerender } = render(<CardInput label="Card" />)
    expect(screen.getByLabelText(/CVC|security code/i)).toHaveAttribute("maxLength", "3")

    rerender(<CardInput label="Card" value={AMEX} onChange={() => {}} />)
    await waitFor(() =>
      expect(screen.getByLabelText(/CVC|security code/i)).toHaveAttribute("maxLength", "4"),
    )
  })

  it("advances focus from a full number to the expiry", async () => {
    const user = userEvent.setup()
    render(<CardInput label="Card" />)

    await user.type(number(), VISA)
    await waitFor(() =>
      expect(document.activeElement).toBe(screen.getByLabelText(/expiry/i)),
    )
  })

  it("advances focus from a full expiry to the CVC", async () => {
    const user = userEvent.setup()
    render(<CardInput label="Card" />)

    await user.type(screen.getByLabelText(/expiry/i), "0428")
    await waitFor(() =>
      expect(document.activeElement).toBe(screen.getByLabelText(/CVC|security code/i)),
    )
  })
})

describe("CardInput — form contract", () => {
  it("submits digits only, plus expiry and cvc when named", async () => {
    const user = userEvent.setup()
    render(
      <form data-testid="f">
        <CardInput label="Card" name="cc" expiryName="ccExp" cvcName="ccCvc" />
      </form>,
    )

    await user.type(number(), VISA)
    await user.type(screen.getByLabelText(/expiry/i), "0428")
    await user.type(screen.getByLabelText(/CVC|security code/i), "123")

    expect(hidden("cc")?.value).toBe(VISA)
    const fd = new FormData(screen.getByTestId("f") as HTMLFormElement)
    expect(fd.get("cc")).toBe(VISA)
    expect(fd.get("ccExp")).toBe("04 / 28")
    expect(fd.get("ccCvc")).toBe("123")
  })

  it("renders the single-row layout", () => {
    render(<CardInput label="Card" layout="single" defaultValue={VISA} />)
    expect(number()).toHaveClass("inputcn-cc-number")
    expect(screen.getByLabelText(/expiry/i)).toHaveClass("inputcn-cc-exp")
  })

  it("disables every sub-field", () => {
    render(<CardInput label="Card" disabled />)
    expect(number()).toBeDisabled()
    expect(screen.getByLabelText(/expiry/i)).toBeDisabled()
    expect(screen.getByLabelText(/CVC|security code/i)).toBeDisabled()
  })
})
