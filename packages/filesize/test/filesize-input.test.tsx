import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { FileSizeInput } from "../src/filesize-input.js"

const label = "Max upload"
const input = () => screen.getByLabelText(label) as HTMLInputElement

describe("FileSizeInput", () => {
  it("emits bytes", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<FileSizeInput label={label} onChange={onChange} />)

    await user.type(input(), "25 MB")
    expect(onChange).toHaveBeenLastCalledWith(25_000_000)
  })

  it("keeps MB and MiB distinct", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const { unmount } = render(<FileSizeInput label={label} onChange={onChange} />)
    await user.type(input(), "1 MiB")
    expect(onChange).toHaveBeenLastCalledWith(1_048_576)
    unmount()

    const onChange2 = vi.fn()
    render(<FileSizeInput label={label} onChange={onChange2} />)
    await user.type(input(), "1 MB")
    expect(onChange2).toHaveBeenLastCalledWith(1_000_000)
  })

  it("applies the bare unit to a lone number", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<FileSizeInput label={label} bareUnit="MB" onChange={onChange} />)

    await user.type(input(), "25")
    expect(onChange).toHaveBeenLastCalledWith(25_000_000)
  })

  it("shows the byte count alongside", () => {
    render(<FileSizeInput label={label} defaultValue={25_000_000} />)
    expect(screen.getByText("25,000,000 B")).toBeInTheDocument()
  })

  it("normalises on blur", async () => {
    const user = userEvent.setup()
    render(<FileSizeInput label={label} />)

    await user.type(input(), "25000 KB")
    await user.tab()
    expect(input().value).toBe("25 MB")
  })

  it("keeps the last good value while a unit is half-typed", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<FileSizeInput label={label} onChange={onChange} />)

    await user.type(input(), "25 M")
    // "25 M" is a valid abbreviation; the point is the field does not zero out.
    expect(onChange).toHaveBeenLastCalledWith(25_000_000)
    expect(input().value).toBe("25 M")
  })

  it("enforces max written as human text", async () => {
    const user = userEvent.setup()
    render(<FileSizeInput label={label} max="100MB" defaultValue={200_000_000} />)

    await user.click(input())
    await user.tab()
    expect(await screen.findByRole("alert")).toHaveTextContent("100 MB")
  })

  it("clears the error live once corrected", async () => {
    const user = userEvent.setup()
    render(<FileSizeInput label={label} max="100MB" />)

    await user.type(input(), "200 MB")
    await user.tab()
    expect(await screen.findByRole("alert")).toBeInTheDocument()

    await user.clear(input())
    await user.type(input(), "50 MB")
    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument())
  })

  it("submits bytes", async () => {
    const user = userEvent.setup()
    render(
      <form data-testid="f">
        <FileSizeInput label={label} name="limit" />
      </form>,
    )

    await user.type(input(), "25 MB")
    const fd = new FormData(screen.getByTestId("f") as HTMLFormElement)
    expect(fd.get("limit")).toBe("25000000")
  })
})
