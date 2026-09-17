/**
 * The prose that goes in each package README.
 *
 * Kept as plain data so `build-readmes.mjs` can render it, and kept in ONE
 * file so thirteen READMEs cannot slowly disagree with each other about what
 * the library does. Everything factual — the prop tables, the types — is read
 * from the source interfaces instead of being written here.
 */

export const META = {
  core: {
    tagline: "The engine behind every inputcn field.",
    blurb: [
      "Caret-safe masking, validity rules, smart paste and dev-mode warnings. You rarely install this directly — every inputcn component depends on it, and the shadcn registry adds it for you.",
      "It is a real npm dependency rather than copied source, because nobody wants to fork a caret engine, and a bug fixed here should reach you through `npm update`.",
    ],
    example: `import { useField } from "@inputcn/core"
import { nextCaretPosition } from "@inputcn/core/caret"
import "@inputcn/core/styles.css"`,
    highlights: [
      ["Caret preservation", "The caret is tracked as a count of significant characters to its left, not a string offset, so reformatting mid-type never throws the cursor to the end."],
      ["Validity during render", "Computed from the current value on every render, never stored in state and never produced by an effect — so the displayed error can never lag a keystroke behind."],
      ["Two modes, auto-detected", "A field owns its error message standalone, and goes quiet inside a form library. Detected from `aria-invalid`, `aria-describedby` or a form context."],
      ["Token-driven styles", "One stylesheet that reads your shadcn CSS variables. No hardcoded colour, radius or font."],
    ],
    noProps: true,
    entryPoints: {
      caret: "Caret tracking: `nextCaretPosition`, the core of the whole library",
      mask: "Template masking primitives",
      paste: "Clipboard normalisation — zero-width spaces, smart quotes, NBSP",
      validity: "Rule builders: `min`, `max`, `multipleOf`, `pattern` and friends",
      messages: "Message resolution and the built-in English defaults",
      provider: "`InputcnProvider` — optional; the defaults work without it",
      "use-field": "The hook every component is built on",
      "use-masked-value": "Masked value state with caret preservation",
      "use-latest": "`useEvent` — a stable callback reference",
      warn: "Dev-mode warnings, stripped in production",
      types: "Shared types, including `BaseFieldProps`",
      "styles.css": "The stylesheet. Import once.",
    },
  },

  phone: {
    tagline: "Searchable country selector, live formatting, E.164 out.",
    blurb: [
      "Pasting a number that starts with `+` switches the country and says so, with an undo. The country chip is an ISO code rather than a flag emoji, because Windows ships no glyphs for regional-indicator pairs and a flag degrades to two bare letters there.",
    ],
    example: `<PhoneInput
  label="Phone number"
  value={phone}        // "+442071234567" — always E.164
  onChange={setPhone}  // never the formatted string
  required
  mobileOnly
  countries={["GB", "US", "IN"]}
/>`,
    highlights: [
      ["Trunk prefixes handled", "A UK number typed as `020 7123 4567` emits `+442071234567`. The leading zero is dropped before the length cap, not after."],
      ["Paste detection", "`+44 20 7123 4567` sets the value and the country together, and offers an undo."],
      ["Landline rejection", "`mobileOnly` checks the prefix, so `2071234567` is refused and `7911123456` is not."],
    ],
    gotcha:
      "Country data is hand-maintained for 18 countries. Accurate for those, but it is not libphonenumber and does not pretend to be. If you need all 250, wrap this component or open an issue.",
  },

  currency: {
    tagline: "Register-style entry. Integer minor units, never a float.",
    blurb: [
      "Digits fill from the right like a cash register, so the caret can never drift into the middle of a number. Separators, symbol placement and fraction digits come from `Intl` for the active locale and currency — including zero-decimal currencies such as JPY.",
    ],
    example: `<CurrencyInput
  label="Price"
  value={price}        // 129900 — an integer count of minor units
  onChange={setPrice}
  currency="GBP"
  positive
  max={100000}         // also in minor units: £1,000.00
/>`,
    highlights: [
      ["No float, ever", "Parsing, stepping and formatting all operate on the integer. `0.1 + 0.2` never gets near a price."],
      ["Locale-correct", "`1.234,50` and `$1,234.50` both parse. The separator convention is detected, not assumed."],
      ["Three layouts", "`inline`, `display` for pricing pages, `stepper` for quantities."],
    ],
  },

  masked: {
    tagline: "A mask that survives mid-string editing and paste.",
    blurb: [
      "The generic mask, and the reason the rest of the library exists. Insert a digit in the middle of a formatted value and the caret stays where you put it.",
      "The emitted value is the raw input — mask characters are presentation and never reach your state.",
    ],
    example: `import { MaskedInput, MASKS } from "@inputcn/masked"

<MaskedInput
  label="Tax ID"
  mask={MASKS.cpf}     // or "###.###.###-##"
  value={taxId}        // "12345678901" — no mask characters
  onChange={setTaxId}
  complete
/>`,
    highlights: [
      ["Tokens", "`#` digit, `A` letter, `*` alphanumeric. Everything else is a literal."],
      ["12 presets", "CPF, CNPJ, SSN, EIN, UK postcode, ISO/US/EU dates, licence keys and more."],
      ["Backspace skips separators", "Deleting removes the significant character to the left, not the punctuation next to it."],
    ],
  },

  percent: {
    tagline: "Shows 12.5, emits 0.125. The confusion ends at the boundary.",
    blurb: [
      "Users type percentages; maths wants fractions. The ×100 that usually lives in four different places in a codebase lives in exactly one here.",
    ],
    example: `<PercentInput
  label="Discount rate"
  value={rate}         // 0.125
  onChange={setRate}   // the field shows 12.5
  max={0.5}
  precision={2}
/>`,
    highlights: [
      ["One conversion point", "The component is the only place the factor of 100 exists."],
      ["Precision is on the display", "`precision` limits decimal places on the shown percentage, not on the stored fraction."],
    ],
  },

  card: {
    tagline: "Brand detection, Luhn, and grouping that reflows mid-type.",
    blurb: [
      "Number, expiry and CVC as one component with one canonical value. Grouping reflows as the brand is detected — 4-4-4-4 for Visa, 4-6-5 for Amex — and the CVC length follows it.",
    ],
    example: `<CardInput
  label="Card details"
  value={card}         // "4242424242424242" — digits only
  onChange={setCard}
  name="card"
  expiryName="exp"
  cvcName="cvc"
  brands={["visa", "mastercard"]}
  notExpired
/>`,
    highlights: [
      ["Focus advances correctly", "Only when the number is a valid length for its brand **and** passes Luhn. Visa accepts 16, 18 and 19 digits, so advancing on the first valid length strands anyone with a 16-digit card."],
      ["Rejects by name", "`brands` produces “We do not accept American Express”, not “invalid card”."],
    ],
    gotcha:
      "This is not a PCI-compliant capture path on its own. It is an input; the compliance boundary is your payment processor iframe.",
  },

  duration: {
    tagline: "90m, 1:30 and 1.5h are the same number.",
    blurb: [
      "Accepts the three ways people actually write durations and emits seconds. `multipleOf` takes a duration too, so the message reads “must be a multiple of 15 minutes” rather than “must be a multiple of 900”.",
    ],
    example: `<DurationInput
  label="Session timeout"
  value={seconds}      // 5400
  onChange={setSeconds}
  min="30s"
  max="4h"
  multipleOf="15m"
  layout="segmented"   // or "text" | "presets"
/>`,
    highlights: [
      ["Three input styles", "Free text, segmented h/m/s, or preset pills."],
      ["ISO 8601 out too", "The hook exposes `PT1H30M` alongside the seconds."],
    ],
  },

  color: {
    tagline: "Hex out, any format in, with a live WCAG ratio.",
    blurb: [
      "Accepts hex, `rgb()` and `hsl()`, emits hex, and shows the contrast ratio against a colour you nominate.",
    ],
    example: `<ColorInput
  label="Brand colour"
  value={brand}        // "#CDF25C"
  onChange={setBrand}
  contrastAgainst="#FFFFFF"
  minContrast={4.5}
  swatches={["#CDF25C", "#3A3FD6"]}
/>`,
    highlights: [
      ["Contrast warns, it does not block", "An unreadable brand colour is a legal value. `minContrast` raises a warning, not an error."],
      ["Tested against the reference values", "The WCAG luminance maths is unit-tested — black on white is 21:1."],
    ],
    gotcha:
      "HSL round-trips are lossy by ±1 per channel because the conversion rounds to integers. Hex in, hex out is stable; hex → HSL → hex may move by one.",
  },

  cron: {
    tagline: "Cron in, plain English and the next runs out.",
    blurb: [
      "Describes the expression in English and previews the next few runs, so a five-field string stops being a guess. An expression that is already equivalent is never rewritten — `1-5` stays `1-5` rather than becoming `1,2,3,4,5` the moment the field mounts.",
    ],
    example: `<CronInput
  label="Schedule"
  value={cron}         // "0 9 * * 1-5"
  onChange={setCron}
  minInterval="5m"
  layout="builder"     // or "expression"
  showUpcoming
/>`,
    highlights: [
      ["Human description", "“At 09:00, Monday to Friday.”"],
      ["Catches the accident", "`minInterval` is what stops `* * * * *` reaching production."],
      ["Builder layout", "Frequency, time and day toggles, for people who do not write cron."],
    ],
  },

  filesize: {
    tagline: "MB and MiB are different numbers, and it keeps them different.",
    blurb: [
      "Emits bytes. `MB` is 1000² and `MiB` is 1024² — a 4.9% gap, which is exactly the difference between “a 100 MB limit” and a user's file being rejected.",
    ],
    example: `<FileSizeInput
  label="Upload limit"
  value={bytes}        // 1048576
  onChange={setBytes}
  max="500 MB"
  binary={false}       // MB (1000²) rather than MiB (1024²)
/>`,
    highlights: [
      ["No silent conversion", "The two unit systems stay distinct rather than being quietly normalised."],
      ["Locale-safe grouping", "The byte count is grouped with an explicit locale, so it does not render as `2,50,00,000` on a machine set to en-IN."],
    ],
  },

  ip: {
    tagline: "v4, v6 and CIDR, with the host range worked out for you.",
    blurb: [
      "Shows the computed host range for a CIDR block, so an allow-list entry can be checked before it is saved.",
    ],
    example: `<IpInput
  label="Allowed range"
  value={cidr}         // "10.0.0.0/24"
  onChange={setCidr}
  requirePrefix
  maxPrefix={24}
  noPrivate
/>`,
    highlights: [
      ["maxPrefix earns its keep", "It is what stops somebody allow-listing `0.0.0.0/0` by accident."],
      ["Paste a log line", "The address is extracted from surrounding text."],
    ],
  },

  mention: {
    tagline: "@-mentions whose ids track the text they came from.",
    blurb: [
      "Emits both the text and the ids present in it. Edit a handle away and its id goes with it, so you never notify someone whose name is no longer in the comment.",
    ],
    example: `<MentionInput
  label="Comment"
  people={team}
  value={comment}      // { text: "hi @ada", ids: ["u1"] }
  onChange={setComment}
  maxMentions={3}
  layout="rich"
/>`,
    highlights: [
      ["Ids follow the text", "Deleting a handle removes its id from the value, so the notification list cannot go stale."],
      ["Not inside an email", "`user@example` does not open the picker."],
      ["Blast-radius cap", "`maxMentions` limits the notification before it is sent."],
    ],
    gotcha:
      "The textarea is not a `combobox`. ARIA 1.2 permits that role on an `<input>`, not on a multi-line control, so the suggestion count is announced through a polite live region instead.",
  },

  testing: {
    tagline: "Drive an inputcn field from a test the way a user would.",
    blurb: [
      "Typing into a masked field from a test is its own small nightmare. These helpers do it properly — keystroke by keystroke, through the component's own handlers.",
    ],
    example: `import { fillCurrency, leaveField, expectInvalid } from "@inputcn/testing"

it("rejects a budget over the cap", async () => {
  const { field } = renderField(<CurrencyInput label="Budget" max={100000} />)

  await fillCurrency(field, 250000)
  await leaveField(field)

  // Asserts the RULE, not the sentence. Rewording the copy cannot break this.
  expectInvalid(field, "max")
})`,
    highlights: [
      ["11 fill helpers", "One per component, each driving it to a canonical value."],
      ["Rule-based assertions", "`expectInvalid(field, \"max\")` reads the `data-rule` attribute, so tests survive a copy change."],
      ["Three render modes", "`renderField`, `renderInForm` and `renderManaged` — standalone, native form, and form-library."],
    ],
    noProps: true,
    entryPoints: {
      fill: "The 11 `fill*` helpers and `pasteInto`",
      assert: "`expectValue`, `expectInvalid`, `expectWarning`, `expectFormData`",
      render: "`renderField`, `renderInForm`, `renderManaged`",
    },
  },
}
