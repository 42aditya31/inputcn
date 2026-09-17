import { describe, expect, it } from "vitest"

import { dependencies, generate, installCommands } from "../src/generate.js"
import { COMPONENTS, FIELD_TYPES, validate, type FormSpec } from "../src/spec.js"

const VENDOR: FormSpec = {
  name: "VendorOnboarding",
  form: "react-hook-form",
  fields: [
    { type: "phone", name: "phone", label: "Mobile", mobileOnly: true, countries: ["GB", "US"] },
    {
      type: "currency",
      name: "budget",
      label: "Budget",
      currency: "GBP",
      locale: "en-GB",
      positive: true,
      max: 1_000_000,
    },
  ],
}

describe("validation — the reason the format exists", () => {
  it("accepts a well-formed spec", () => {
    expect(validate(VENDOR).problems).toEqual([])
  })

  it("refuses a prop the component does not have, and says what it meant", () => {
    const { problems } = validate({
      name: "F",
      fields: [{ type: "phone", name: "p", mobilOnly: true }],
    })

    expect(problems).toHaveLength(1)
    expect(problems[0]!.message).toContain('PhoneInput has no prop "mobilOnly"')
    // The suggestion is the whole point: a model that typos gets corrected
    // rather than shipping JSX with an ignored prop.
    expect(problems[0]!.hint).toContain("mobileOnly")
  })

  it("refuses a prop that belongs to a different component", () => {
    // maxPrefix is real — on IpInput, not PhoneInput.
    const { problems } = validate({
      name: "F",
      fields: [{ type: "phone", name: "p", maxPrefix: 24 }],
    })
    expect(problems[0]!.message).toContain('has no prop "maxPrefix"')
  })

  it("accepts every shared prop on every component", () => {
    for (const type of FIELD_TYPES) {
      const { problems } = validate({
        name: "F",
        fields: [{ type, name: "x", required: true, disabled: false, variant: "filled" }],
      })
      expect(problems, `${type} rejected a shared prop`).toEqual([])
    }
  })

  it("catches an unknown field type with a suggestion", () => {
    const { problems } = validate({ name: "F", fields: [{ type: "currancy", name: "x" }] })
    expect(problems[0]!.message).toContain('Unknown field type "currancy"')
    expect(problems[0]!.hint).toContain("currency")
  })

  it("catches duplicate field names", () => {
    const { problems } = validate({
      name: "F",
      fields: [
        { type: "phone", name: "same" },
        { type: "ip", name: "same" },
      ],
    })
    expect(problems.some((p) => p.message.includes("Duplicate"))).toBe(true)
  })

  it("rejects a component name React cannot use", () => {
    const { problems } = validate({ name: "my form", fields: [{ type: "ip", name: "a" }] })
    expect(problems[0]!.message).toContain("not a valid React component name")
  })
})

describe("generated react-hook-form output", () => {
  const code = generate(VENDOR)

  it("imports each component and its companion schema", () => {
    expect(code).toContain('import { PhoneInput } from "@inputcn/phone"')
    expect(code).toContain('import { phoneSchema } from "@inputcn/phone/schema"')
    expect(code).toContain('import { moneySchema } from "@inputcn/currency/schema"')
  })

  it("puts the constraints in the schema, not just on the component", () => {
    expect(code).toContain("phone: phoneSchema({ mobileOnly: true, countries: [\"GB\", \"US\"] })")
  })

  it("mirrors formatting options into the schema", () => {
    // The trap: currency is for message formatting and defaults to USD, so a
    // GBP field would otherwise report its cap in dollars. The generator
    // carries it across so nobody has to remember.
    const call = code.match(/budget: moneySchema\(\{[^}]*\}\)/)![0]
    expect(call).toContain('currency: "GBP"')
    expect(call).toContain('locale: "en-GB"')
    expect(call).toContain("max: 1000000")
  })

  it("gives numeric fields a numeric default", () => {
    expect(code).toContain("budget: 0,")
    expect(code).toContain('phone: "",')
  })

  it("documents the canonical value of every field", () => {
    expect(code).toContain("budget — integer minor units")
    expect(code).toContain("phone — E.164 string")
  })

  it("is plausible TSX", () => {
    expect(code).toContain("export function VendorOnboarding(")
    expect(code).toContain("<Controller")
    expect(code.match(/<Controller/g)).toHaveLength(2)
    expect(code).toContain("aria-invalid={fieldState.invalid}")
  })
})

describe("generated standalone output", () => {
  const code = generate({ ...VENDOR, form: "none", submitLabel: "Create" })

  it("pulls in no form library", () => {
    expect(code).not.toContain("react-hook-form")
    expect(code).not.toContain("zod")
    expect(code).not.toContain("Schema")
  })

  it("names every field so FormData carries it", () => {
    expect(code).toContain('name="phone"')
    expect(code).toContain('name="budget"')
  })

  it("keeps the constraints as props", () => {
    expect(code).toContain("mobileOnly")
    expect(code).toContain("max={1000000}")
  })

  it("documents how a Server Action reads each value", () => {
    expect(code).toContain('Number(data.get("budget"))')
    expect(code).toContain('data.get("phone")')
  })
})

describe("what the CLI tells you to install", () => {
  it("lists the registry items and the packages", () => {
    expect(installCommands(VENDOR, "https://x.dev")).toEqual([
      "npx shadcn@latest add https://x.dev/r/phone-input.json",
      "npx shadcn@latest add https://x.dev/r/currency-input.json",
    ])
    expect(dependencies(VENDOR)).toContain("react-hook-form")
    expect(dependencies({ ...VENDOR, form: "none" })).not.toContain("react-hook-form")
  })
})

describe("coverage", () => {
  it("every field type generates something for both wirings", () => {
    for (const type of FIELD_TYPES) {
      const spec: FormSpec = { name: "T", fields: [{ type, name: "f", label: "L" }] }
      for (const form of ["react-hook-form", "none"] as const) {
        const out = generate({ ...spec, form })
        expect(out, `${type} / ${form}`).toContain(COMPONENTS[type].component)
        expect(out.length).toBeGreaterThan(200)
      }
    }
  })
})
