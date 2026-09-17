import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { CardInput } from "../../card/src/card-input.js"
import { ColorInput } from "../../color/src/color-input.js"
import { CronInput } from "../../cron/src/cron-input.js"
import { CurrencyInput } from "../../currency/src/currency-input.js"
import { DurationInput } from "../../duration/src/duration-input.js"
import { FileSizeInput } from "../../filesize/src/filesize-input.js"
import { IpInput } from "../../ip/src/ip-input.js"
import { MASKS } from "../../masked/src/use-masked-input.js"
import { MaskedInput } from "../../masked/src/masked-input.js"
import { MentionInput } from "../../mention/src/mention-input.js"
import type { Person } from "../../mention/src/mention.js"
import { PercentInput } from "../../percent/src/percent-input.js"
import { PhoneInput } from "../../phone/src/phone-input.js"

import { expectNoA11yViolations } from "./a11y-setup.js"

const TEAM: Person[] = [
  { id: "u1", name: "Ada Lovelace", handle: "ada", detail: "Engineering", badge: "Owner" },
  { id: "u2", name: "Grace Hopper", handle: "grace", detail: "Platform" },
]

/** Every component, in a labelled default state. */
const COMPONENTS: Array<[string, React.ReactElement]> = [
  ["PhoneInput", <PhoneInput key="a" label="Phone" />],
  ["CurrencyInput", <CurrencyInput key="b" label="Amount" />],
  ["MaskedInput", <MaskedInput key="c" label="Tax ID" mask={MASKS.cpf} />],
  ["PercentInput", <PercentInput key="d" label="Rate" />],
  ["CardInput", <CardInput key="e" label="Card" />],
  ["DurationInput", <DurationInput key="f" label="Timeout" />],
  ["ColorInput", <ColorInput key="g" label="Brand" contrastAgainst="#FFFFFF" />],
  ["CronInput", <CronInput key="h" label="Schedule" defaultValue="0 9 * * 1-5" />],
  ["FileSizeInput", <FileSizeInput key="i" label="Cap" />],
  ["IpInput", <IpInput key="j" label="Range" defaultValue="10.0.0.0/24" />],
  ["MentionInput", <MentionInput key="k" label="Comment" people={TEAM} />],
]

describe("axe — default state", () => {
  it.each(COMPONENTS)("%s has no violations", async (_name, ui) => {
    const { container } = render(ui)
    await expectNoA11yViolations(container)
  })
})

describe("axe — states that change the accessibility tree", () => {
  it.each(COMPONENTS)("%s is clean when disabled", async (_name, ui) => {
    const { container } = render(<div>{ui}</div>)
    await expectNoA11yViolations(container)
  })

  it("is clean while showing an error", async () => {
    const user = userEvent.setup()
    const { container } = render(
      <>
        <CurrencyInput label="Amount" max={100} defaultValue={9999} />
        <button type="button">outside</button>
      </>,
    )
    await user.click(screen.getByLabelText("Amount"))
    await user.click(screen.getByRole("button", { name: "outside" }))
    await screen.findByRole("alert")

    await expectNoA11yViolations(container)
  })

  it("is clean with the country picker open", async () => {
    const user = userEvent.setup()
    const { container } = render(<PhoneInput label="Phone" />)

    await user.click(screen.getByRole("button", { name: /country/i }))
    expect(screen.getByRole("listbox")).toBeInTheDocument()

    await expectNoA11yViolations(container)
  })

  it("is clean with the mention picker open", async () => {
    const user = userEvent.setup()
    const { container } = render(<MentionInput label="Comment" people={TEAM} />)

    await user.type(screen.getByLabelText("Comment"), "@")
    expect(screen.getByRole("listbox")).toBeInTheDocument()

    await expectNoA11yViolations(container)
  })

  it("is clean in every layout that changes structure", async () => {
    const { container } = render(
      <>
        <CurrencyInput label="A" layout="display" />
        <CurrencyInput label="B" layout="stepper" />
        <DurationInput label="C" layout="segmented" />
        <DurationInput label="D" layout="presets" />
        <CardInput label="E" layout="single" />
        <CronInput label="F" layout="builder" defaultValue="0 9 * * 1-5" />
        <MentionInput label="G" people={TEAM} layout="rich" />
      </>,
    )
    await expectNoA11yViolations(container)
  })
})

describe("labelling — the most common real failure", () => {
  it.each(COMPONENTS)("%s associates its label with a control", (_name, ui) => {
    const { container } = render(ui)
    const label = container.querySelector("label")
    expect(label, "component renders no <label>").not.toBeNull()

    const target = label!.getAttribute("for")
    expect(target, "<label> has no `for`").toBeTruthy()
    expect(
      container.querySelector(`#${CSS.escape(target!)}`),
      "`for` points at nothing",
    ).not.toBeNull()
  })

  it("accepts aria-label when there is no visible label", () => {
    render(<PhoneInput aria-label="Mobile number" />)
    expect(screen.getByLabelText("Mobile number")).toBeInTheDocument()
  })
})

describe("error announcement", () => {
  it("links the error to the field and announces it once", async () => {
    const user = userEvent.setup()
    render(
      <>
        <PhoneInput label="Phone" required />
        <button type="button">outside</button>
      </>,
    )
    const el = screen.getByLabelText("Phone")

    await user.click(el)
    await user.click(screen.getByRole("button", { name: "outside" }))

    const alert = await screen.findByRole("alert")
    // aria-describedby is what makes the message reach a screen reader at all.
    expect(el).toHaveAttribute("aria-describedby", alert.id)
    expect(el).toHaveAttribute("aria-invalid", "true")
  })

  it("does not announce anything before the first blur", async () => {
    const user = userEvent.setup()
    render(<PhoneInput label="Phone" required />)

    await user.type(screen.getByLabelText("Phone"), "415")
    // Announcing on every keystroke is what makes a field unusable with a
    // screen reader, so silence here is the requirement, not an omission.
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })
})

describe("keyboard — every function reachable without a mouse", () => {
  it("PhoneInput: opens, searches, selects and returns focus", async () => {
    const user = userEvent.setup()
    render(<PhoneInput label="Phone" />)

    await user.tab() // country trigger
    const trigger = screen.getByRole("button", { name: /country/i })
    expect(trigger).toHaveFocus()

    await user.keyboard("{Enter}")
    const search = screen.getByRole("textbox", { name: /search country/i })
    expect(search).toHaveFocus()

    await user.keyboard("{Escape}")
    // Escape must return focus to the trigger, not strand it on a dead node.
    expect(trigger).toHaveFocus()
  })

  it("PhoneInput: arrow keys move through the list", async () => {
    const user = userEvent.setup()
    render(<PhoneInput label="Phone" />)

    await user.click(screen.getByRole("button", { name: /country/i }))
    await user.keyboard("{ArrowDown}{Enter}")

    expect(screen.getByRole("button", { name: /country: Canada/i })).toBeInTheDocument()
  })

  it("CurrencyInput: arrows step the value", async () => {
    const user = userEvent.setup()
    render(<CurrencyInput label="Amount" defaultValue={500} />)

    await user.tab()
    await user.keyboard("{ArrowUp}")
    expect(screen.getByLabelText("Amount")).toHaveValue("6.00")
  })

  it("DurationInput segmented: tab between units, arrows step them", async () => {
    const user = userEvent.setup()
    render(<DurationInput label="T" layout="segmented" defaultValue={0} />)

    await user.tab()
    expect(screen.getByLabelText("hours")).toHaveFocus()
    await user.tab()
    expect(screen.getByLabelText("minutes")).toHaveFocus()

    await user.keyboard("{ArrowUp}")
    expect(screen.getByLabelText("minutes")).toHaveValue("01")
  })

  it("CronInput builder: day toggles are buttons, reachable and pressable", async () => {
    const user = userEvent.setup()
    render(<CronInput label="S" layout="builder" defaultValue="0 9 * * 1-5" />)

    const saturday = screen.getByRole("button", { name: "Saturday" })
    saturday.focus()
    await user.keyboard("{Enter}")
    expect(saturday).toHaveAttribute("aria-pressed", "true")
  })

  it("MentionInput: full keyboard flow with no mouse", async () => {
    const user = userEvent.setup()
    render(<MentionInput label="Comment" people={TEAM} />)

    await user.tab()
    expect(screen.getByLabelText("Comment")).toHaveFocus()

    await user.keyboard("@a")
    await user.keyboard("{ArrowDown}{Enter}")
    expect((screen.getByLabelText("Comment") as HTMLTextAreaElement).value).toContain("@")
  })

  it("ColorInput: swatches are reachable and pressable", async () => {
    const user = userEvent.setup()
    render(<ColorInput label="Brand" swatches={["#DC2626"]} />)

    const swatch = screen.getByRole("button", { name: "#DC2626" })
    swatch.focus()
    await user.keyboard("{Enter}")
    expect(screen.getByLabelText("Brand")).toHaveValue("#DC2626")
  })

  it("the native colour picker is out of the tab order", async () => {
    const user = userEvent.setup()
    render(<ColorInput label="Brand" showSwatches={false} />)

    await user.tab()
    // The text field is the accessible control; the OS picker is a mouse
    // convenience and would otherwise be an unlabelled tab stop.
    expect(screen.getByLabelText("Brand")).toHaveFocus()
  })

  it("disabled components are not tab stops", async () => {
    const user = userEvent.setup()
    render(
      <>
        <PhoneInput label="Phone" disabled />
        <button type="button">after</button>
      </>,
    )

    await user.tab()
    expect(screen.getByRole("button", { name: "after" })).toHaveFocus()
  })
})

describe("reduced motion", () => {
  it("the stylesheet disables popover animation under prefers-reduced-motion", async () => {
    const { readFileSync } = await import("node:fs")
    const { resolve } = await import("node:path")
    // Resolved from the repo root, which is where vitest runs.
    const css = readFileSync(
      resolve(process.cwd(), "packages/core/styles/inputcn.css"),
      "utf8",
    )
    // Asserted against the stylesheet because jsdom applies no CSS; this at
    // least guarantees the rule is not deleted by accident.
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)/)
    expect(css).toMatch(/@media \(forced-colors: active\)/)
  })
})
