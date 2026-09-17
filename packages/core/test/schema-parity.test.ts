import { describe, expect, it } from "vitest"

import { evaluate, max, positive, required, rules } from "../src/validity.js"
import { moneySchema } from "../../currency/src/schema.js"
import { maskedSchema } from "../../masked/src/schema.js"
import { phoneSchema } from "../../phone/src/schema.js"
import { fromE164, isMobile, isValidLength } from "../../phone/src/phone.js"
import { countryByIso } from "../../phone/src/countries.js"
import { isMaskComplete } from "../src/mask.js"

/**
 * REQ-V parity (PRD §9.7).
 *
 * A component's constraint props and its shipped Zod schema are two
 * independent implementations of the same rule. They will drift unless
 * something forces them together. This is that something: a shared fixture
 * table asserted against BOTH paths, so a change to one that is not mirrored
 * in the other fails here rather than in a user's production form.
 */

type Fixture<T> = { value: T; valid: boolean; why: string }

/** Runs a fixture table against the prop-driven rules and the Zod schema. */
function assertParity<T>(
  fixtures: ReadonlyArray<Fixture<T>>,
  viaProps: (value: T) => boolean,
  viaSchema: { safeParse: (v: unknown) => { success: boolean } },
) {
  for (const { value, valid, why } of fixtures) {
    const propResult = viaProps(value)
    const schemaResult = viaSchema.safeParse(value).success

    expect(propResult, `props disagreed on ${why}`).toBe(valid)
    expect(schemaResult, `schema disagreed on ${why}`).toBe(valid)
    expect(
      propResult,
      `props and schema DISAGREED on ${why} — one was changed without the other`,
    ).toBe(schemaResult)
  }
}

describe("phone — props vs phoneSchema", () => {
  const US = countryByIso("US")

  const fixtures: Fixture<string>[] = [
    { value: "+14155552671", valid: true, why: "a valid US number" },
    { value: "+1415555267", valid: false, why: "one digit short" },
    { value: "+141555526711", valid: false, why: "one digit long" },
    { value: "", valid: false, why: "empty when required" },
    { value: "+9999999999999", valid: false, why: "unknown dial code" },
  ]

  it("agree on required + format", () => {
    const list = rules<string>(required<string>(true), {
      rule: "phoneFormat",
      test: (v) => {
        const p = fromE164(v, US)
        return isValidLength(p.national, p.country)
      },
    })

    assertParity(
      fixtures,
      (v) => evaluate(v, list).valid,
      phoneSchema({ country: "US" }),
    )
  })

  it("agree on mobileOnly", () => {
    const GB = countryByIso("GB")
    const mobileFixtures: Fixture<string>[] = [
      { value: "+447911123456", valid: true, why: "a GB mobile" },
      { value: "+442071234567", valid: false, why: "a London landline" },
    ]

    const list = rules<string>(
      required<string>(true),
      {
        rule: "phoneFormat",
        test: (v) => {
          const p = fromE164(v, GB)
          return isValidLength(p.national, p.country)
        },
      },
      {
        rule: "phoneMobileOnly",
        test: (v) => {
          const p = fromE164(v, GB)
          return isMobile(p.national, p.country)
        },
      },
    )

    assertParity(
      mobileFixtures,
      (v) => evaluate(v, list).valid,
      phoneSchema({ country: "GB", mobileOnly: true }),
    )
  })
})

describe("currency — props vs moneySchema", () => {
  const fixtures: Fixture<number>[] = [
    { value: 5000, valid: true, why: "inside the range" },
    { value: 100000, valid: true, why: "exactly at max" },
    { value: 100001, valid: false, why: "one minor unit over max" },
    { value: 0, valid: false, why: "zero fails positive" },
    { value: -100, valid: false, why: "negative fails positive" },
  ]

  it("agree on positive + max", () => {
    const list = rules<number>(positive(true), max(100000))

    assertParity(
      fixtures,
      (v) => evaluate(v, list).valid,
      moneySchema({ positive: true, max: 100000 }),
    )
  })

  it("both treat bounds as MINOR units, not major", () => {
    // If one side ever interpreted `max: 100000` as $100,000 rather than
    // $1,000.00, this is where it would surface.
    expect(moneySchema({ max: 100000 }).safeParse(100001).success).toBe(false)
    expect(evaluate(100001, rules<number>(max(100000))).valid).toBe(false)
  })
})

describe("masked — props vs maskedSchema", () => {
  const MASK = "###.###.###-##"

  const fixtures: Fixture<string>[] = [
    { value: "12345678901", valid: true, why: "all 11 slots filled" },
    { value: "1234567890", valid: false, why: "one slot short" },
    { value: "", valid: false, why: "empty when required" },
  ]

  it("agree on required + complete", () => {
    const list = rules<string>(required<string>(true), {
      rule: "incomplete",
      test: (v) => isMaskComplete(v, MASK),
    })

    assertParity(
      fixtures,
      (v) => evaluate(v, list).valid,
      maskedSchema({ mask: MASK, complete: true }),
    )
  })
})

describe("empty-value semantics are shared", () => {
  it("skips non-required rules on an empty value, in both paths", () => {
    // An optional field left blank is valid. Showing "must be at least X" on
    // an untouched empty box is the classic false positive.
    expect(evaluate("", rules<string>({ rule: "x", test: () => false })).valid).toBe(true)
    expect(maskedSchema({ mask: "###", allowEmpty: true }).safeParse("").success).toBe(true)
    expect(phoneSchema({ allowEmpty: true }).safeParse("").success).toBe(true)
  })
})
