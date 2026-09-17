import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { CronInput } from "../src/cron-input.js"

const label = "Schedule"
const expr = () => screen.getByLabelText(label) as HTMLInputElement

function withOutside(ui: React.ReactElement) {
  return (
    <>
      {ui}
      <button type="button">outside</button>
    </>
  )
}
const leaveField = async (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole("button", { name: "outside" }))

describe("CronInput — expression layout", () => {
  it("shows the plain-English reading, which is the feature", async () => {
    const user = userEvent.setup()
    render(<CronInput label={label} />)

    await user.type(expr(), "0 9 * * 1-5")
    expect(screen.getByText("At 09:00, Monday through Friday")).toBeInTheDocument()
  })

  it("updates the reading live", async () => {
    const user = userEvent.setup()
    render(<CronInput label={label} defaultValue="0 9 * * *" />)
    expect(screen.getByText("At 09:00")).toBeInTheDocument()

    await user.clear(expr())
    await user.type(expr(), "*/15 * * * *")
    await waitFor(() => expect(screen.getByText("Every 15 minutes")).toBeInTheDocument())
  })

  it("lists upcoming runs", () => {
    render(<CronInput label={label} defaultValue="0 9 * * *" />)
    expect(screen.getByText("Next runs")).toBeInTheDocument()
  })

  it("names the offending field rather than saying 'invalid'", async () => {
    const user = userEvent.setup()
    render(withOutside(<CronInput label={label} defaultValue="0 99 * * *" />))

    await user.click(expr())
    await leaveField(user)

    expect(await screen.findByRole("alert")).toHaveTextContent(/hour field/)
  })

  it("strips a trailing command from a pasted crontab line", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<CronInput label={label} onChange={onChange} />)

    await user.click(expr())
    await user.paste("0 9 * * 1-5 /usr/bin/backup.sh")
    expect(onChange).toHaveBeenLastCalledWith("0 9 * * 1-5")
  })
})

describe("CronInput — minInterval", () => {
  it("blocks a schedule that fires too often", async () => {
    const user = userEvent.setup()
    render(withOutside(<CronInput label={label} minInterval="5m" defaultValue="* * * * *" />))

    await user.click(expr())
    await leaveField(user)

    expect(await screen.findByRole("alert")).toHaveTextContent(/too often/i)
  })

  it("allows a schedule at exactly the limit", async () => {
    const user = userEvent.setup()
    render(withOutside(<CronInput label={label} minInterval="5m" defaultValue="*/5 * * * *" />))

    await user.click(expr())
    await leaveField(user)
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })
})

describe("CronInput — builder layout", () => {
  it("renders controls derived from the expression", () => {
    render(<CronInput label={label} layout="builder" defaultValue="0 9 * * 1-5" />)
    expect(screen.getByLabelText("Frequency")).toHaveValue("weekly")
    expect(screen.getByLabelText("Time of day")).toHaveValue("09:00")
    expect(screen.getByRole("button", { name: "Monday" })).toHaveAttribute(
      "aria-pressed",
      "true",
    )
    expect(screen.getByRole("button", { name: "Sunday" })).toHaveAttribute(
      "aria-pressed",
      "false",
    )
  })

  it("emits the same value shape as the expression layout", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <CronInput
        label={label}
        layout="builder"
        defaultValue="0 9 * * 1-5"
        onChange={onChange}
      />,
    )

    await user.click(screen.getByRole("button", { name: "Saturday" }))
    expect(onChange).toHaveBeenLastCalledWith("0 9 * * 1,2,3,4,5,6")
  })

  it("hides the day picker for a frequency that does not use it", async () => {
    const user = userEvent.setup()
    render(<CronInput label={label} layout="builder" defaultValue="0 9 * * 1-5" />)

    await user.selectOptions(screen.getByLabelText("Frequency"), "daily")
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "Monday" })).not.toBeInTheDocument(),
    )
  })

  it("disables the time control for an hourly schedule", async () => {
    const user = userEvent.setup()
    render(<CronInput label={label} layout="builder" defaultValue="0 9 * * *" />)

    await user.selectOptions(screen.getByLabelText("Frequency"), "hourly")
    await waitFor(() => expect(screen.getByLabelText("Time of day")).toBeDisabled())
  })

  it("says so when the schedule is beyond what the builder can show", () => {
    render(<CronInput label={label} layout="builder" defaultValue="*/15 9-17 * * *" />)
    expect(screen.getByText(/more specific than the builder/i)).toBeInTheDocument()
  })

  it("shows the current expression without rewriting it on mount", async () => {
    const user = userEvent.setup()
    render(<CronInput label={label} layout="builder" defaultValue="0 9 * * 1-5" />)

    // "1-5" and "1,2,3,4,5" are equivalent; silently rewriting the user's
    // expression just because the builder spells it differently would be
    // surprising, so the bar shows what is actually stored.
    expect(screen.getByText("0 9 * * 1-5")).toBeInTheDocument()

    // It only changes once the user actually edits something.
    await user.click(screen.getByRole("button", { name: "Saturday" }))
    await waitFor(() =>
      expect(screen.getByText("0 9 * * 1,2,3,4,5,6")).toBeInTheDocument(),
    )
  })
})

describe("CronInput — form contract", () => {
  it("submits the expression", async () => {
    const user = userEvent.setup()
    render(
      <form data-testid="f">
        <CronInput label={label} name="schedule" />
      </form>,
    )

    await user.type(expr(), "0 9 * * 1-5")
    const fd = new FormData(screen.getByTestId("f") as HTMLFormElement)
    expect(fd.get("schedule")).toBe("0 9 * * 1-5")
  })
})
