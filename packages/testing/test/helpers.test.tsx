import { screen } from "@testing-library/react"
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

import {
  expectFormData,
  expectInvalid,
  expectValid,
  expectValue,
  expectWarning,
  fieldRoot,
  fillCard,
  fillColor,
  fillCron,
  fillCurrency,
  fillDuration,
  fillFileSize,
  fillIp,
  fillMasked,
  fillPercent,
  fillPhone,
  findValid,
  getCanonical,
  getDisplay,
  getOptions,
  leaveField,
  mention,
  pasteInto,
  renderField,
  renderInForm,
} from "../src/index.js"

const TEAM: Person[] = [
  { id: "u1", name: "Ada Lovelace", handle: "ada" },
  { id: "u2", name: "Grace Hopper", handle: "grace" },
]

/**
 * REQ-L: "@inputcn/testing has its own suite proving each helper drives each
 * component to the correct canonical value." A helper that silently produces
 * the wrong value is worse than no helper, because every test built on it
 * passes for the wrong reason.
 */
describe("fill helpers reach the correct canonical value", () => {
  it("fillPhone", async () => {
    renderInForm(<PhoneInput label="Phone" name="phone" />)
    const el = screen.getByLabelText("Phone")

    await fillPhone(el, "+14155552671")

    expectValue(el, "+14155552671", "phone")
    // And the DISPLAY is the formatted string — the two are never the same.
    expect(getDisplay(el)).toBe("(415) 555-2671")
  })

  it("fillCurrency", async () => {
    renderInForm(<CurrencyInput label="Amount" name="amount" />)
    const el = screen.getByLabelText("Amount")

    await fillCurrency(el, 123450)

    expectValue(el, "123450", "amount")
    expect(getDisplay(el)).toBe("1,234.50")
  })

  it("fillMasked", async () => {
    renderInForm(<MaskedInput label="Tax ID" name="taxId" mask={MASKS.cpf} />)
    const el = screen.getByLabelText("Tax ID")

    await fillMasked(el, "12345678901")

    expectValue(el, "12345678901", "taxId")
    expect(getDisplay(el)).toBe("123.456.789-01")
  })

  it("fillCard", async () => {
    renderInForm(<CardInput label="Card" name="cc" />)
    const el = screen.getByLabelText("Card number")

    await fillCard(el, "4242424242424242")

    expectValue(el, "4242424242424242", "cc")
    expect(getDisplay(el)).toBe("4242 4242 4242 4242")
  })

  it("fillPercent takes the fraction, not the percentage", async () => {
    renderInForm(<PercentInput label="Rate" name="rate" />)
    const el = screen.getByLabelText("Rate")

    await fillPercent(el, 0.125)

    expectValue(el, "0.125", "rate")
    expect(getDisplay(el)).toBe("12.5")
  })

  it("fillDuration accepts seconds or human text", async () => {
    renderInForm(<DurationInput label="Timeout" name="t" />)
    const el = screen.getByLabelText("Timeout")

    await fillDuration(el, "1h 30m")
    expectValue(el, "5400", "t")

    await fillDuration(el, 5400)
    expectValue(el, "5400", "t")
  })

  it("fillColor normalises whatever format it is given", async () => {
    renderInForm(<ColorInput label="Brand" name="brand" />)
    const el = screen.getByLabelText("Brand")

    await fillColor(el, "rgb(58, 63, 214)")
    expectValue(el, "#3A3FD6", "brand")
  })

  it("fillCron", async () => {
    renderInForm(<CronInput label="Schedule" name="cron" />)
    const el = screen.getByLabelText("Schedule")

    await fillCron(el, "0 9 * * 1-5")
    expectValue(el, "0 9 * * 1-5", "cron")
  })

  it("fillFileSize", async () => {
    renderInForm(<FileSizeInput label="Cap" name="cap" />)
    const el = screen.getByLabelText("Cap")

    await fillFileSize(el, "25 MB")
    expectValue(el, "25000000", "cap")
  })

  it("fillIp", async () => {
    renderInForm(<IpInput label="Range" name="cidr" />)
    const el = screen.getByLabelText("Range")

    await fillIp(el, "10.0.0.0/24")
    expectValue(el, "10.0.0.0/24", "cidr")
  })

  it("mention picks someone from the picker", async () => {
    renderInForm(<MentionInput label="Comment" name="note" people={TEAM} />)
    const el = screen.getByLabelText("Comment")

    await mention(el, "ada")
    expect(getDisplay(el)).toContain("@ada")
  })
})

describe("pasteInto drives smart paste", () => {
  it("makes paste behaviour testable at all", async () => {
    renderInForm(<PhoneInput label="Phone" name="phone" />)
    const el = screen.getByLabelText("Phone")

    // fireEvent.paste with a hand-built event carries no clipboardData in
    // jsdom, so without this helper smart paste is untestable.
    await pasteInto(el, "Call me at (415) 555-2671")
    expectValue(el, "+14155552671", "phone")
  })
})

describe("leaveField", () => {
  it("blurs a composite component that Tab alone would not", async () => {
    renderField(<PhoneInput label="Phone" required />)
    const el = screen.getByLabelText("Phone")

    // Tab would move to the country trigger, which is INSIDE the component.
    await leaveField(el)
    expectInvalid(el, "required")
  })

  it("removes its sink, leaving no stray button behind", async () => {
    renderField(<PhoneInput label="Phone" required />)
    await leaveField(screen.getByLabelText("Phone"))
    expect(document.querySelector("[data-inputcn-test-sink]")).toBeNull()
  })
})

describe("expectInvalid asserts the rule, not the copy", () => {
  it("passes on the right rule", async () => {
    renderField(<CurrencyInput label="Amount" max={10000} defaultValue={99999} />)
    const el = screen.getByLabelText("Amount")

    await leaveField(el)
    expectInvalid(el, "max")
  })

  it("fails loudly on the wrong rule, naming both", async () => {
    renderField(<CurrencyInput label="Amount" max={10000} defaultValue={99999} />)
    const el = screen.getByLabelText("Amount")
    await leaveField(el)

    expect(() => expectInvalid(el, "min")).toThrow(/Expected rule "min".*"max" did/s)
  })

  it("survives a message rewrite, which is the whole point", async () => {
    renderField(
      <CurrencyInput
        label="Amount"
        max={10000}
        defaultValue={99999}
        messages={{ max: "Totally different copy, in another language even" }}
      />,
    )
    const el = screen.getByLabelText("Amount")

    await leaveField(el)
    // Asserting text here would break; asserting the rule does not.
    expectInvalid(el, "max")
  })

  it("explains why nothing is shown when the field has not been blurred", () => {
    renderField(<CurrencyInput label="Amount" max={10000} defaultValue={99999} />)
    const el = screen.getByLabelText("Amount")

    expect(() => expectInvalid(el)).toThrow(/only appear after the first blur/)
  })
})

describe("expectWarning distinguishes advisory from blocking", () => {
  it("passes for a warning", async () => {
    renderField(
      <ColorInput
        label="Brand"
        defaultValue="#FFF9C4"
        contrastAgainst="#FFFFFF"
        minContrast={4.5}
      />,
    )
    const el = screen.getByLabelText("Brand")

    await leaveField(el)
    expectWarning(el, "colorContrast")
  })

  it("fails when the field is showing a blocking error instead", async () => {
    renderField(<CurrencyInput label="Amount" max={10000} defaultValue={99999} />)
    const el = screen.getByLabelText("Amount")
    await leaveField(el)

    expect(() => expectWarning(el)).toThrow(/blocking error/)
  })
})

describe("expectValue", () => {
  it("names both forms when it fails, since that is the usual confusion", async () => {
    renderInForm(<PhoneInput label="Phone" name="phone" />)
    const el = screen.getByLabelText("Phone")
    await fillPhone(el, "+14155552671")

    expect(() => expectValue(el, "(415) 555-2671", "phone")).toThrow(
      /display.*canonical value are not the same thing/s,
    )
  })

  it("explains the missing name prop rather than throwing a null error", () => {
    renderField(<PhoneInput label="Phone" />)
    expect(() => getCanonical(screen.getByLabelText("Phone"))).toThrow(
      /Pass a `name` prop/,
    )
  })
})

describe("expectFormData catches the display-vs-canonical bug", () => {
  it("passes when the payload is canonical", async () => {
    const { form } = renderInForm(
      <>
        <PhoneInput label="Phone" name="phone" />
        <CurrencyInput label="Amount" name="amount" />
      </>,
    )

    await fillPhone(screen.getByLabelText("Phone"), "+14155552671")
    await fillCurrency(screen.getByLabelText("Amount"), 4900)

    expectFormData(form, { phone: "+14155552671", amount: "4900" })
  })

  it("shows the whole payload when it fails", async () => {
    const { form } = renderInForm(<PhoneInput label="Phone" name="phone" />)
    await fillPhone(screen.getByLabelText("Phone"), "+14155552671")

    expect(() => expectFormData(form, { phone: "(415) 555-2671" })).toThrow(
      /full payload/,
    )
  })
})

describe("render helpers", () => {
  it("renderField provides a blur that actually leaves the component", async () => {
    const { blur } = renderField(<PhoneInput label="Phone" required />)
    await blur()
    expectInvalid(screen.getByLabelText("Phone"), "required")
  })

  it("renderInForm exposes the form element", () => {
    const { form } = renderInForm(<PhoneInput label="Phone" name="phone" />)
    expect(form.tagName).toBe("FORM")
  })
})

describe("query helpers", () => {
  it("fieldRoot finds the component from any element inside it", () => {
    renderField(<PhoneInput label="Phone" />)
    const root = fieldRoot(screen.getByLabelText("Phone"))
    expect(root).toHaveClass("inputcn-field")
  })

  it("fieldRoot gives a useful error outside a component", () => {
    renderField(<PhoneInput label="Phone" />)
    expect(() => fieldRoot(document.body)).toThrow(/Not inside an inputcn component/)
  })

  it("getOptions reads an open picker", async () => {
    renderField(<MentionInput label="Comment" people={TEAM} />)
    const el = screen.getByLabelText("Comment")

    await pasteInto(el, "@")
    expect(getOptions(el).join(" ")).toContain("Ada Lovelace")
  })
})

describe("expectValid / findValid", () => {
  it("passes for a clean field", async () => {
    renderField(<PhoneInput label="Phone" />)
    const el = screen.getByLabelText("Phone")
    await fillPhone(el, "+14155552671")
    await leaveField(el)
    expectValid(el)
  })

  it("findValid waits for an error to clear", async () => {
    renderField(<CurrencyInput label="Amount" max={10000} />)
    const el = screen.getByLabelText("Amount")

    await fillCurrency(el, 99999)
    await leaveField(el)
    expectInvalid(el, "max")

    await fillCurrency(el, 5000)
    await findValid(el)
  })
})
