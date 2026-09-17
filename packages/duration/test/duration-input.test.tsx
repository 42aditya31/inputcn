import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { DurationInput } from "../src/duration-input.js"

const label = "Timeout"
const getInput = () => screen.getByLabelText(label) as HTMLInputElement

describe("DurationInput — text layout", () => {
  it("emits seconds", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<DurationInput label={label} onChange={onChange} />)

    await user.type(getInput(), "2h 30m")
    expect(onChange).toHaveBeenLastCalledWith(9000)
  })

  it("shows exactly what was typed while typing", async () => {
    const user = userEvent.setup()
    render(<DurationInput label={label} />)

    // Reformatting "2h 3" into "2h 3m" mid-keystroke would send the next
    // character to the wrong place.
    await user.type(getInput(), "2h 3")
    expect(getInput().value).toBe("2h 3")
  })

  it("normalises on blur", async () => {
    const user = userEvent.setup()
    render(<DurationInput label={label} />)

    await user.type(getInput(), "90m")
    await user.tab()
    expect(getInput().value).toBe("1h 30m")
  })

  it("accepts every equivalent spelling", async () => {
    for (const text of ["90m", "1:30", "1.5h"]) {
      const user = userEvent.setup()
      const onChange = vi.fn()
      const { unmount } = render(<DurationInput label={label} onChange={onChange} />)
      await user.type(getInput(), text)
      expect(onChange, text).toHaveBeenLastCalledWith(5400)
      unmount()
    }
  })

  it("enforces a min written as human text", async () => {
    const user = userEvent.setup()
    render(<DurationInput label={label} min="5m" />)

    await user.type(getInput(), "1m")
    await user.tab()

    expect(await screen.findByRole("alert")).toHaveTextContent("5m")
  })

  it("enforces multipleOf", async () => {
    const user = userEvent.setup()
    render(<DurationInput label={label} multipleOf="15m" defaultValue={600} />)

    await user.click(getInput())
    await user.tab()

    expect(await screen.findByRole("alert")).toHaveTextContent(/multiple of 15m/i)
  })

  it("submits seconds", async () => {
    const user = userEvent.setup()
    render(
      <form data-testid="f">
        <DurationInput label={label} name="timeout" />
      </form>,
    )

    await user.type(getInput(), "2h 30m")

    const fd = new FormData(screen.getByTestId("f") as HTMLFormElement)
    expect(fd.get("timeout")).toBe("9000")
  })
})

describe("DurationInput — segmented layout", () => {
  it("splits the value across three boxes", () => {
    render(<DurationInput label={label} layout="segmented" defaultValue={5445} />)
    expect(screen.getByLabelText("hours")).toHaveValue("01")
    expect(screen.getByLabelText("minutes")).toHaveValue("30")
    expect(screen.getByLabelText("seconds")).toHaveValue("45")
  })

  it("recombines edits into seconds", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <DurationInput label={label} layout="segmented" defaultValue={0} onChange={onChange} />,
    )

    await user.clear(screen.getByLabelText("minutes"))
    await user.type(screen.getByLabelText("minutes"), "45")

    expect(onChange).toHaveBeenLastCalledWith(2700)
  })

  it("steps with the arrow keys and wraps at the unit boundary", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <DurationInput label={label} layout="segmented" defaultValue={59} onChange={onChange} />,
    )

    const seconds = screen.getByLabelText("seconds")
    await user.click(seconds)
    await user.keyboard("{ArrowUp}")
    // 59 + 1 wraps to 0, not 60.
    expect(onChange).toHaveBeenLastCalledWith(0)
  })

  it("clamps a segment to its maximum", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <DurationInput label={label} layout="segmented" defaultValue={0} onChange={onChange} />,
    )

    await user.type(screen.getByLabelText("minutes"), "99")
    // 99 minutes is not a thing in a segmented clock; it clamps to 59.
    expect(onChange).toHaveBeenLastCalledWith(59 * 60)
  })
})

describe("DurationInput — presets layout", () => {
  it("applies a preset", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<DurationInput label={label} layout="presets" onChange={onChange} />)

    await user.click(screen.getByRole("button", { name: "1h" }))
    expect(onChange).toHaveBeenLastCalledWith(3600)
  })

  it("marks the matching preset as pressed", async () => {
    const user = userEvent.setup()
    render(<DurationInput label={label} layout="presets" defaultValue={1800} />)

    expect(screen.getByRole("button", { name: "30m" })).toHaveAttribute(
      "aria-pressed",
      "true",
    )
    expect(screen.getByRole("button", { name: "1h" })).toHaveAttribute(
      "aria-pressed",
      "false",
    )

    await user.click(screen.getByRole("button", { name: "1h" }))
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "1h" })).toHaveAttribute(
        "aria-pressed",
        "true",
      ),
    )
  })

  it("accepts a custom value alongside the presets", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<DurationInput label={label} layout="presets" onChange={onChange} />)

    await user.type(screen.getByLabelText("Custom duration"), "3h")
    expect(onChange).toHaveBeenLastCalledWith(10_800)
  })
})
