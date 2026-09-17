import type { ReactNode } from "react"

import {
  CardDemo,
  ColorDemo,
  CronDemo,
  CurrencyDemo,
  DurationDemo,
  FileSizeDemo,
  IpDemo,
  MaskedDemo,
  MentionDemo,
  PercentDemo,
  PhoneDemo,
} from "./demos.js"

export interface ComponentDoc {
  slug: string
  name: string
  pkg: string
  /** The canonical value type, as printed on the card. */
  t: string
  /** A real example of that value. */
  example: string
  tagline: string
  lede: ReactNode
  demo: () => ReactNode
  /** The label the demo renders, when it differs from the example label. */
  demoLabel?: string
  schema: string
  /** The field name used in the react-hook-form example. */
  field: string
  label: string
  /** Keyboard map — only what has an automated test behind it. */
  keys?: [string, string][]
  /** Anything a reader would otherwise find out the hard way. */
  gotchas?: ReactNode[]
}

/**
 * The component registry.
 *
 * Eleven, not the twelve in the design file — TagsInput was in the design and
 * has not been built, so it is not listed. A docs site that indexes a
 * component nobody can install is the fastest way to lose a reader.
 */
export const COMPONENTS: ComponentDoc[] = [
  {
    slug: "phone-input",
    name: "PhoneInput",
    pkg: "@inputcn/phone",
    t: "string",
    example: '"+442071234567"',
    tagline: "Country selector, per-country formatting, E.164 out.",
    label: "Phone number",
    field: "phone",
    schema: "phoneSchema",
    demo: PhoneDemo,
    lede: (
      <>
        A phone field with a searchable country selector and live per-country formatting.
        Pasting a number that starts with <code>+</code> switches the country and says so,
        with an undo. The country chip is an ISO code rather than a flag emoji, because
        Windows ships no glyphs for regional-indicator pairs and a flag degrades to two bare
        letters there.
      </>
    ),
    keys: [
      ["Tab", "Moves to the country trigger, then into the number field."],
      ["Enter / Space", "Opens the country list from the trigger."],
      ["Arrow keys", "Moves through the list; the search box filters it."],
      ["Escape", "Closes the list and returns focus to the trigger."],
    ],
    gotchas: [
      <>
        Country data is hand-maintained for 18 countries. It is accurate for those, but it
        is not libphonenumber and does not pretend to be.
      </>,
    ],
  },
  {
    slug: "currency-input",
    name: "CurrencyInput",
    pkg: "@inputcn/currency",
    t: "number",
    example: "129900",
    tagline: "Register-style entry. Integer minor units, never a float.",
    label: "Amount",
    field: "price",
    schema: "moneySchema",
    demo: CurrencyDemo,
    lede: (
      <>
        A money field that fills from the right like a cash register, so the caret can never
        drift into the middle of a number. Separators, symbol placement and the number of
        fraction digits come from <code>Intl</code> for the active locale and currency,
        including zero-decimal currencies such as JPY. The value is an integer count of
        minor units, so no float ever touches a price.
      </>
    ),
    keys: [
      ["0 – 9", "Appends a digit at the minor-unit end."],
      ["Backspace", "Removes the last digit; the value shifts one place right."],
      ["Arrow up / down", "Steps by `step`, defaulting to one major unit."],
    ],
  },
  {
    slug: "masked-input",
    name: "MaskedInput",
    pkg: "@inputcn/masked",
    t: "string",
    example: '"12345678901"',
    tagline: "A mask that survives mid-string editing and paste.",
    label: "Tax ID",
    // The demo cycles through four masks, so it cannot claim to be a tax ID.
    demoLabel: "Structured value",
    field: "taxId",
    schema: "maskedSchema",
    demo: MaskedDemo,
    lede: (
      <>
        The generic mask, and the reason the rest of the library exists. The caret is tracked
        as a count of significant characters to its left rather than as a string offset, so
        inserting a digit in the middle does not throw the cursor to the end. The emitted
        value is the raw input — the mask characters are presentation and never reach your
        state.
      </>
    ),
    keys: [
      ["Any key", "Inserts at the caret; the mask reflows around it."],
      ["Backspace", "Deletes the significant character to the left, skipping separators."],
      ["Paste", "Strips formatting, then refills the mask from the digits."],
    ],
  },
  {
    slug: "percent-input",
    name: "PercentInput",
    pkg: "@inputcn/percent",
    t: "number",
    example: "0.125",
    tagline: "Shows 12.5, emits 0.125. The confusion ends at the boundary.",
    label: "Discount rate",
    field: "rate",
    schema: "percentSchema",
    demo: PercentDemo,
    lede: (
      <>
        Users type percentages; maths wants fractions. This field shows{" "}
        <code>12.5</code> and emits <code>0.125</code>, so the ×100 that usually lives in
        four different places in a codebase lives in exactly one. <code>precision</code>{" "}
        constrains the number of decimal places on the displayed percentage, not on the
        fraction.
      </>
    ),
  },
  {
    slug: "card-input",
    name: "CardInput",
    pkg: "@inputcn/card",
    t: "string",
    example: '"4242424242424242"',
    tagline: "Brand detection, Luhn, and grouping that reflows mid-type.",
    label: "Card details",
    field: "card",
    schema: "cardSchema",
    demo: CardDemo,
    lede: (
      <>
        Number, expiry and CVC as one component with one canonical value. The grouping
        reflows as the brand is detected — 4-4-4-4 for Visa, 4-6-5 for Amex — and the CVC
        length follows it. Focus advances to the expiry only when the number is both a valid
        length for its brand <em>and</em> passes Luhn, because Visa accepts 16, 18 and 19
        digits and advancing on the first valid length strands anyone with a 16-digit card.
      </>
    ),
    keys: [
      ["Tab", "Number, then expiry, then CVC."],
      ["Auto-advance", "Number to expiry on a valid, Luhn-passing number."],
    ],
    gotchas: [
      <>
        This is not a PCI-compliant capture path on its own. It is an input; the compliance
        boundary is your payment processor iframe.
      </>,
    ],
  },
  {
    slug: "duration-input",
    name: "DurationInput",
    pkg: "@inputcn/duration",
    t: "number",
    example: "5400",
    tagline: "90m, 1:30 and 1.5h are the same number.",
    label: "Session timeout",
    field: "timeout",
    schema: "durationSchema",
    demo: DurationDemo,
    lede: (
      <>
        A duration field that accepts the three ways people actually write durations and
        emits seconds. <code>multipleOf</code> takes a duration too, so the message reads
        &ldquo;must be a multiple of 15 minutes&rdquo; rather than &ldquo;must be a multiple
        of 900&rdquo;. Segmented and preset layouts are available where a free-text field is
        the wrong shape.
      </>
    ),
    keys: [
      ["Arrow up / down", "Steps the focused unit, wrapping at the unit boundary."],
      ["Tab", "Moves between hours, minutes and seconds in the segmented layout."],
    ],
  },
  {
    slug: "color-input",
    name: "ColorInput",
    pkg: "@inputcn/color",
    t: "string",
    example: '"#CDF25C"',
    tagline: "Hex out, any format in, with a live WCAG ratio.",
    label: "Brand colour",
    field: "brand",
    schema: "colorSchema",
    demo: ColorDemo,
    lede: (
      <>
        Accepts hex, <code>rgb()</code> and <code>hsl()</code>, emits hex, and shows the
        contrast ratio against a colour you nominate. <code>minContrast</code> raises a{" "}
        <strong>warning, not an error</strong> — an unreadable brand colour is a legal value
        and blocking the form over it is the wrong call.
      </>
    ),
    keys: [
      ["Enter / Space", "Applies the focused swatch."],
      ["Tab", "Skips the native colour picker, which is a mouse affordance only."],
    ],
    gotchas: [
      <>
        HSL round-trips are lossy by ±1 in each channel because the conversion rounds to
        integers. Hex in, hex out is stable; hex → HSL → hex may move by one.
      </>,
    ],
  },
  {
    slug: "cron-input",
    name: "CronInput",
    pkg: "@inputcn/cron",
    t: "string",
    example: '"0 9 * * 1-5"',
    tagline: "Cron in, plain English and the next runs out.",
    label: "Schedule",
    field: "schedule",
    schema: "cronSchema",
    demo: CronDemo,
    lede: (
      <>
        A cron expression field that describes itself in English and previews the next few
        runs, so a five-field string stops being a guess. <code>minInterval</code> catches
        the <code>* * * * *</code> that somebody always ships by accident. An expression that
        is already equivalent is never rewritten — <code>1-5</code> stays <code>1-5</code>{" "}
        rather than being expanded to <code>1,2,3,4,5</code> the moment the field mounts.
      </>
    ),
    keys: [["Enter / Space", "Toggles a day in the builder layout."]],
  },
  {
    slug: "filesize-input",
    name: "FileSizeInput",
    pkg: "@inputcn/filesize",
    t: "number",
    example: "1048576",
    tagline: "MB and MiB are different numbers, and it keeps them different.",
    label: "Upload limit",
    field: "limit",
    schema: "fileSizeSchema",
    demo: FileSizeDemo,
    lede: (
      <>
        Emits bytes. <code>MB</code> is 1000² and <code>MiB</code> is 1024², a 4.9% gap —
        which is exactly the difference between &ldquo;a 100 MB limit&rdquo; and a user&rsquo;s
        file being rejected. The field keeps them distinct rather than quietly converting,
        and the byte count is grouped with an explicit locale so it does not render as{" "}
        <code>2,50,00,000</code> on a machine set to en-IN.
      </>
    ),
  },
  {
    slug: "ip-input",
    name: "IpInput",
    pkg: "@inputcn/ip",
    t: "string",
    example: '"10.0.0.0/24"',
    tagline: "v4, v6 and CIDR, with the host range worked out for you.",
    label: "Allowed range",
    field: "cidr",
    schema: "cidrSchema",
    demo: IpDemo,
    lede: (
      <>
        An address field that shows the computed host range for a CIDR block, so an
        allow-list entry can be checked before it is saved. <code>maxPrefix</code> is the
        constraint that earns its keep: it is what stops somebody allow-listing{" "}
        <code>0.0.0.0/0</code> by accident.
      </>
    ),
  },
  {
    slug: "mention-input",
    name: "MentionInput",
    pkg: "@inputcn/mention",
    t: "MentionValue",
    example: '{ text, ids }',
    tagline: "@-mentions whose ids track the text they came from.",
    label: "Comment",
    field: "comment",
    schema: "mentionSchema",
    demo: MentionDemo,
    lede: (
      <>
        A textarea with an @-mention picker that emits both the text and the ids present in
        it. Edit a handle away and its id goes with it, so you never notify someone whose
        name is no longer in the comment. <code>maxMentions</code> caps the blast radius
        before the notification is sent.
      </>
    ),
    keys: [
      ["@", "Opens the picker — except inside an email address."],
      ["Arrow keys", "Moves through the suggestions."],
      ["Enter", "Inserts the highlighted handle and a trailing space."],
      ["Escape", "Closes the picker and leaves the text alone."],
    ],
    gotchas: [
      <>
        The textarea is not a <code>combobox</code>. ARIA 1.2 permits that role on an{" "}
        <code>&lt;input&gt;</code>, not on a multi-line control, so the suggestion count is
        announced through a polite live region instead.
      </>,
    ],
  },
]

export const BY_SLUG = new Map(COMPONENTS.map((c) => [c.slug, c]))

/** The react-hook-form example, generated so it cannot drift from the registry. */
export function rhfExample(c: ComponentDoc): string {
  return `import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ${c.schema} } from "${c.pkg}/schema"
import { ${c.name} } from "@/components/ui/${c.slug}"
import { z } from "zod"

// The companion schema validates the CANONICAL value, so the resolver and the
// field can never disagree about what "valid" means.
const schema = z.object({ ${c.field}: ${c.schema}() })

export function Example() {
  const { control } = useForm({ resolver: zodResolver(schema) })

  return (
    <Controller
      name="${c.field}"
      control={control}
      render={({ field, fieldState }) => (
        <${c.name}
          label="${c.label}"
          {...field}
          aria-invalid={fieldState.invalid}
        />
      )}
    />
  )
}`
}

/** The Server Action example: no client component, no state. */
export function actionExample(c: ComponentDoc): string {
  const cast = c.t === "number" ? `Number(data.get("${c.field}"))` : `data.get("${c.field}")`
  return `import { ${c.name} } from "@/components/ui/${c.slug}"

export default function Page() {
  return (
    <form action={save}>
      <${c.name} name="${c.field}" label="${c.label}" />
      <button>Save</button>
    </form>
  )
}

async function save(data: FormData) {
  "use server"
  // The hidden canonical input carries the real value, not the display text.
  const ${c.field} = ${cast} // ${c.example}
}`
}
