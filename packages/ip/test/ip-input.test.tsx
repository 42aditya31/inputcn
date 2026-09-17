import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { IpInput } from "../src/ip-input.js"

const label = "Allowed range"
const input = () => screen.getByLabelText(label) as HTMLInputElement

describe("IpInput", () => {
  it("emits the address as typed", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<IpInput label={label} onChange={onChange} />)

    await user.type(input(), "10.0.0.0/24")
    expect(onChange).toHaveBeenLastCalledWith("10.0.0.0/24")
  })

  it("swallows characters that cannot appear in an address", async () => {
    const user = userEvent.setup()
    render(<IpInput label={label} />)

    await user.type(input(), "10.0.0.1abc")
    expect(input().value).toBe("10.0.0.1")
  })

  it("shows the usable host range for a CIDR block", () => {
    render(<IpInput label={label} defaultValue="10.0.0.0/24" />)
    expect(screen.getByText("10.0.0.1 – 10.0.0.254")).toBeInTheDocument()
    expect(screen.getByText("254 usable hosts")).toBeInTheDocument()
  })

  it("labels a private address", () => {
    render(<IpInput label={label} defaultValue="192.168.1.1" />)
    expect(screen.getByText("private")).toBeInTheDocument()
  })

  it("rejects a malformed address", async () => {
    const user = userEvent.setup()
    render(<IpInput label={label} />)

    await user.type(input(), "256.0.0.1")
    await user.tab()
    expect(await screen.findByRole("alert")).toHaveTextContent(/valid IPv4/i)
  })

  it("enforces maxPrefix — the 0.0.0.0/0 guard", async () => {
    const user = userEvent.setup()
    render(<IpInput label={label} minPrefix={8} defaultValue="0.0.0.0/0" />)

    await user.click(input())
    await user.tab()
    expect(await screen.findByRole("alert")).toHaveTextContent(/Prefix must be/i)
  })

  it("rejects private ranges when asked", async () => {
    const user = userEvent.setup()
    render(<IpInput label={label} noPrivate defaultValue="10.0.0.1" />)

    await user.click(input())
    await user.tab()
    expect(await screen.findByRole("alert")).toHaveTextContent(/Private ranges/i)
  })

  it("requires a CIDR suffix when asked", async () => {
    const user = userEvent.setup()
    render(<IpInput label={label} requirePrefix defaultValue="10.0.0.1" />)

    await user.click(input())
    await user.tab()
    expect(await screen.findByRole("alert")).toHaveTextContent(/CIDR suffix/i)
  })

  it("extracts an address from a pasted log line", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<IpInput label={label} onChange={onChange} />)

    await user.click(input())
    await user.paste("client 192.168.1.44 connected")
    expect(onChange).toHaveBeenLastCalledWith("192.168.1.44")
  })

  it("clears the error live once corrected", async () => {
    const user = userEvent.setup()
    render(<IpInput label={label} noPrivate />)

    await user.type(input(), "10.0.0.1")
    await user.tab()
    expect(await screen.findByRole("alert")).toBeInTheDocument()

    await user.tripleClick(input())
    await user.paste("8.8.8.8")
    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument())
  })

  it("submits the address", async () => {
    const user = userEvent.setup()
    render(
      <form data-testid="f">
        <IpInput label={label} name="cidr" />
      </form>,
    )

    await user.type(input(), "10.0.0.0/8")
    const fd = new FormData(screen.getByTestId("f") as HTMLFormElement)
    expect(fd.get("cidr")).toBe("10.0.0.0/8")
  })
})
