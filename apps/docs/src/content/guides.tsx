import { Link } from "../router.js"
import { installCmd, REPO_URL, SITE_URL } from "../site.js"
import type { GuidePage } from "./types.js"

/**
 * The guide pages.
 *
 * Every claim here is one the test suite or the published audit backs. Where
 * something is not done — screen readers, the server package — the page says
 * so rather than leaving the reader to find out.
 */
export const GUIDES: GuidePage[] = [
  {
    slug: "introduction",
    group: "Getting started",
    label: "Introduction",
    title: "Introduction",
    lede: (
      <>
        Eleven input components for the fields shadcn/ui does not ship. Each one keeps the
        caret where you left it, emits a canonical value rather than a formatted string, and
        validates from props alone.
      </>
    ),
    blocks: [
      {
        kind: "prose",
        id: "why",
        heading: "Why this exists",
        body: [
          <>
            shadcn/ui gives you an <code>&lt;Input&gt;</code>. What it does not give you is a
            phone field that knows about countries, a money field that cannot lose a cent to
            a float, or a cron field that tells you what the expression means. Everyone
            builds those, badly, once per project.
          </>,
          <>
            The hard part is never the markup. It is the caret jumping to the end when you
            insert a digit in the middle, the paste from a spreadsheet that arrives with a
            non-breaking space in it, and the fact that <code>0.1 + 0.2</code> is not{" "}
            <code>0.3</code> and your invoice total is now wrong by a cent.
          </>,
        ],
      },
      {
        kind: "prose",
        id: "contract",
        heading: "One contract",
        body: [
          <>
            Every component follows the same rule:{" "}
            <strong>
              <code>onChange</code> emits the canonical value, never the display string.
            </strong>{" "}
            A phone field emits E.164. A money field emits an integer count of minor units. A
            duration field emits seconds. What you store, validate and send over the wire is
            always the same shape, whatever the field happens to be showing.
          </>,
          <>
            See <Link to="/docs/value-semantics">Value semantics</Link> for the full table,
            and <Link to="/docs/props-contract">The props contract</Link> for the eleven
            props every component implements identically.
          </>,
        ],
      },
      {
        kind: "table",
        id: "state",
        heading: "What is actually built",
        cols: ["AREA", "STATE", "EVIDENCE"],
        rows: [
          ["Components", "11 shipped", "Every one live on its own page"],
          ["Tests", "498 passing", "27 files, run on every commit"],
          ["Accessibility", "Automated only", "50 axe-core checks; screen readers not yet run"],
          ["Registry", "12 items", "Built from source by a script, so it cannot drift"],
          ["Published", "npm + Vercel", "Live at @inputcn on npm, docs and registry on Vercel"],
          ["@inputcn/server", "Not built", "Planned — the same validators, server-side"],
        ],
      },
    ],
    note: "Version 1.0 is not released yet — the API is stable in practice but not yet frozen, so treat a minor bump as potentially breaking until it is.",
  },

  {
    slug: "installation",
    group: "Getting started",
    label: "Installation",
    title: "Installation",
    lede: (
      <>
        Same model as shadcn/ui: the component source is copied into your repo, where you can
        read it and change it. One small package stays a dependency.
      </>
    ),
    blocks: [
      {
        kind: "prose",
        id: "hybrid",
        heading: "Why it is a hybrid",
        body: [
          <>
            The component file lands in <code>components/ui/</code> and is yours. The caret,
            mask and validity engine stays in <code>@inputcn/core</code> as a real dependency,
            because eleven copied components should not carry eleven copies of the same
            caret-tracking code, and a bug fix in it should reach you through{" "}
            <code>npm update</code> rather than eleven re-copies.
          </>,
        ],
      },
      {
        kind: "code",
        id: "add",
        heading: "Add a component",
        code: `# one component
${installCmd("phone-input")}

# the base layer, if you want it explicitly
${installCmd("inputcn-base")}`,
        caption: (
          <>
            The registry is built from source by <code>pnpm registry</code>, so a component
            and its registry entry cannot disagree.
          </>
        ),
      },
      {
        kind: "code",
        id: "styles",
        heading: "Import the stylesheet once",
        code: `// app/layout.tsx
import "@inputcn/core/styles.css"`,
      },
      {
        kind: "prose",
        id: "tokens",
        heading: "No configuration",
        body: [
          <>
            There is no config file, no provider to mount and no Tailwind plugin. The
            stylesheet reads the shadcn CSS variables your app already defines —{" "}
            <code>--primary</code>, <code>--ring</code>, <code>--border</code>,{" "}
            <code>--radius</code> — so the components match your theme the moment they render.
          </>,
        ],
      },
    ],
    note: `The registry is served from ${SITE_URL}/r/, and every package is on npm under the @inputcn scope.`,
  },

  {
    slug: "value-semantics",
    group: "Getting started",
    label: "Value semantics",
    title: "Value semantics",
    lede: (
      <>
        The display string is a view. The canonical value is the thing you store. They are
        never the same object, and <code>onChange</code> only ever gives you the second one.
      </>
    ),
    blocks: [
      {
        kind: "table",
        id: "types",
        heading: "Canonical types",
        cols: ["COMPONENT", "T", "EXAMPLE"],
        rows: [
          ["PhoneInput", "string", '"+442071234567"'],
          ["CurrencyInput", "number", "129900 — minor units"],
          ["MaskedInput", "string", '"12345678901"'],
          ["PercentInput", "number", "0.125"],
          ["CardInput", "string", '"4242424242424242"'],
          ["DurationInput", "number", "5400 — seconds"],
          ["ColorInput", "string", '"#CDF25C"'],
          ["CronInput", "string", '"0 9 * * 1-5"'],
          ["FileSizeInput", "number", "1048576 — bytes"],
          ["IpInput", "string", '"10.0.0.0/24"'],
          ["MentionInput", "MentionValue", "{ text, ids }"],
        ],
      },
      {
        kind: "prose",
        id: "money",
        heading: "Money is an integer",
        body: [
          <>
            <code>CurrencyInput</code> emits <code>129900</code>, not <code>1299.00</code>. A
            price held as a float is a rounding error waiting for a quarterly report, so no
            float is used at any point in the pipeline — parsing, stepping and formatting all
            operate on the integer.
          </>,
          <>
            The number of minor units comes from <code>Intl</code> for the active currency, so
            JPY has none and KWD has three. Nothing is hardcoded to 100.
          </>,
        ],
      },
      {
        kind: "prose",
        id: "caret",
        heading: "The caret is a count, not an offset",
        body: [
          <>
            Reformatting a string on every keystroke is what makes masked inputs feel broken:
            the string length changes, the browser puts the caret back at the old offset, and
            the offset now points somewhere else.
          </>,
          <>
            The caret is tracked as{" "}
            <strong>the number of significant characters to its left</strong> and restored by
            counting forward again after the reformat. Separators are not significant, so
            inserting a digit in the middle of a formatted number leaves the caret exactly
            where the user put it.
          </>,
        ],
      },
    ],
  },

  {
    slug: "theming",
    group: "Getting started",
    label: "Theming",
    title: "Theming",
    lede: (
      <>
        Four variants, three sizes, and not one hardcoded colour. Everything resolves from the
        shadcn variables your app already owns.
      </>
    ),
    blocks: [
      {
        kind: "table",
        id: "tokens",
        heading: "Tokens read by the stylesheet",
        cols: ["TOKEN", "USED FOR", "NOTE"],
        rows: [
          ["--background", "Field fill", "Outline and elevated variants"],
          ["--input", "Field hairline", "The resting border colour"],
          ["--ring", "Focus ring", "Drawn on the group, not the inner input"],
          ["--primary", "Selected states", "Day toggles, active presets, swatch rings"],
          ["--destructive", "Invalid state", "Border and ring when a rule fails"],
          ["--muted / --accent", "Affixes, hover", "Secondary surfaces inside a field"],
          ["--radius", "Corner radius", "Every field, popover and chip"],
        ],
      },
      {
        kind: "code",
        id: "variants",
        heading: "Variants and sizes",
        code: `<PhoneInput label="Phone" variant="outline" />   {/* default */}
<PhoneInput label="Phone" variant="filled" />
<PhoneInput label="Phone" variant="underline" />
<PhoneInput label="Phone" variant="elevated" />

<PhoneInput label="Phone" size="sm" />       {/* 28px */}
<PhoneInput label="Phone" size="default" />  {/* 32px */}
<PhoneInput label="Phone" size="lg" />       {/* 38px */}`,
      },
      {
        kind: "prose",
        id: "dark",
        heading: "Dark mode is not a prop",
        body: [
          <>
            There is no <code>dark</code> prop and no theme context. If your app flips the
            shadcn variables for dark mode — whether by a <code>.dark</code> class, a data
            attribute, or a media query — the components follow, because they never read
            anything else. This site is proof: the toggle in its header changes nothing but
            those variables.
          </>,
        ],
      },
    ],
  },

  {
    slug: "props-contract",
    group: "Form contract",
    label: "The props contract",
    title: "The props contract",
    lede: (
      <>
        Twenty-three props are implemented identically by all eleven components. Learn them
        once.
      </>
    ),
    blocks: [
      {
        kind: "prose",
        id: "shared",
        heading: "Shared by every component",
        body: [
          <>
            The full list is on each component page, generated from{" "}
            <code>BaseFieldProps</code> in the source rather than transcribed. The ones worth
            calling out:
          </>,
        ],
      },
      {
        kind: "table",
        id: "key",
        heading: "The ones that matter",
        cols: ["PROP", "TYPE", "WHY"],
        rows: [
          [
            "onChange",
            "(value: T) => void",
            "Emits the canonical value. No synthetic event to unwrap, no e.target.value.",
          ],
          [
            "onBlur",
            "() => void",
            "Fires when focus leaves the whole component — not when it moves from the country button to the number field. Otherwise react-hook-form's onBlur mode misfires constantly.",
          ],
          [
            "name",
            "string",
            "Lands on a hidden canonical input, so FormData and Server Actions receive T rather than the display text.",
          ],
          [
            "ref",
            "Ref<HTMLInputElement>",
            "Points at the primary input through useImperativeHandle, so shouldFocusError lands on a real field.",
          ],
          [
            "mode",
            '"standalone" | "managed"',
            "An escape hatch. The mode is normally detected, not configured.",
          ],
          [
            "showError",
            '"touched" | "change" | "blur" | "never"',
            'Defaults to "touched": silent until the first blur, then live.',
          ],
          [
            "messages",
            "MessageMap",
            "Override any built-in message by rule name, per instance or per provider.",
          ],
        ],
      },
      {
        kind: "prose",
        id: "modes",
        heading: "Two modes, detected not configured",
        body: [
          <>
            Rendered on its own, a field owns its error message. Rendered inside a form
            library, it goes quiet and lets the form own it. You never pass a prop to say
            which: the mode is inferred from whether{" "}
            <code>aria-invalid</code> or <code>aria-describedby</code> was supplied, or from a
            react-hook-form context being present.
          </>,
          <>
            The result is that you never get two copies of the same error, which is the usual
            failure mode when a component insists on rendering its own.
          </>,
        ],
      },
    ],
  },

  {
    slug: "ref-forwarding",
    group: "Form contract",
    label: "Refs and focus",
    title: "Refs and focus",
    lede: (
      <>
        A composite field has several focusable parts. Exactly one of them is the answer to{" "}
        <code>ref.focus()</code>.
      </>
    ),
    blocks: [
      {
        kind: "prose",
        id: "why",
        heading: "Why it matters",
        body: [
          <>
            react-hook-form&rsquo;s <code>shouldFocusError</code> calls <code>focus()</code> on
            the ref of the first invalid field. If that ref points at a wrapper{" "}
            <code>&lt;div&gt;</code>, nothing happens and the user is left staring at a form
            that will not submit with no indication why.
          </>,
          <>
            Every component forwards its ref to the <em>primary</em> input through{" "}
            <code>useImperativeHandle</code> — the number field on <code>CardInput</code>, the
            national-number field on <code>PhoneInput</code>, the hours segment on a segmented{" "}
            <code>DurationInput</code>.
          </>,
        ],
      },
      {
        kind: "code",
        id: "blur",
        heading: "onBlur is subtree-aware",
        code: `// Moving from the country trigger to the number field is NOT a blur:
// both are inside the same component.
//
//   [ US +1 v | (415) 555-2671 ]
//     ^ tab ----> ^              onBlur does not fire
//                        tab --> onBlur fires

<PhoneInput label="Phone" onBlur={() => console.log("left the field")} />`,
      },
    ],
  },

  {
    slug: "server-actions",
    group: "Form contract",
    label: "Server Actions",
    title: "Server Actions",
    lede: (
      <>
        A hidden input carries the canonical value, so a form with no client state still
        submits the right thing.
      </>
    ),
    blocks: [
      {
        kind: "code",
        id: "example",
        heading: "No client component required",
        code: `import { CurrencyInput } from "@/components/ui/currency-input"

export default function Page() {
  return (
    <form action={save}>
      <CurrencyInput name="price" label="Price" currency="USD" required positive />
      <button>Save</button>
    </form>
  )
}

async function save(data: FormData) {
  "use server"
  const price = Number(data.get("price")) // 129900 — an integer, not "1,299.00"
}`,
      },
      {
        kind: "prose",
        id: "how",
        heading: "How",
        body: [
          <>
            When you pass <code>name</code>, the component renders a hidden input carrying the
            serialised canonical value alongside the visible one. The visible input is never
            named, so <code>FormData</code> can only ever pick up the canonical value.
          </>,
          <>
            <code>CardInput</code> is the exception worth knowing: it takes{" "}
            <code>name</code>, <code>expiryName</code> and <code>cvcName</code>, because it is
            three values in one component.
          </>,
        ],
      },
      {
        kind: "prose",
        id: "validate",
        heading: "Validate again on the server",
        body: [
          <>
            Client-side constraints are a user-experience feature, not a security boundary.
            Re-check on the server with the Zod companion — see{" "}
            <Link to="/docs/zod-companions">Zod companions</Link>. A dedicated{" "}
            <code>@inputcn/server</code> package that runs the identical validators without
            React is planned and <strong>not yet built</strong>.
          </>,
        ],
      },
    ],
  },

  {
    slug: "zod-companions",
    group: "Form contract",
    label: "Zod companions",
    title: "Zod companions",
    lede: (
      <>
        A matching schema per component, exported from a separate entry point so Zod never
        enters your component bundle.
      </>
    ),
    blocks: [
      {
        kind: "code",
        id: "import",
        heading: "Separate entry point, on purpose",
        code: `// The component. No Zod anywhere in this import graph.
import { PhoneInput } from "@/components/ui/phone-input"

// The schema. Only pulled in where you actually validate.
import { phoneSchema } from "@inputcn/phone/schema"

const schema = z.object({
  phone: phoneSchema({ mobileOnly: true, countries: ["GB"] }),
})`,
      },
      {
        kind: "prose",
        id: "parity",
        heading: "The schema and the field agree",
        body: [
          <>
            Each schema takes the same constraint object the component takes, and a parity
            test asserts that a value the component accepts is a value the schema accepts, and
            the reverse. A resolver that disagrees with the field it is validating is worse
            than no resolver at all, because the form refuses to submit and the field claims
            everything is fine.
          </>,
          <>
            <code>z.infer</code> of a companion schema is assignable to the component&rsquo;s{" "}
            <code>value</code> prop, which is checked at type level rather than left to
            documentation.
          </>,
        ],
      },
      {
        kind: "table",
        id: "list",
        heading: "The schemas",
        cols: ["ENTRY POINT", "EXPORT", "VALIDATES"],
        rows: [
          ["@inputcn/phone/schema", "phoneSchema", "E.164 string"],
          ["@inputcn/currency/schema", "moneySchema", "integer minor units"],
          ["@inputcn/masked/schema", "maskedSchema", "raw string against the mask"],
          ["@inputcn/percent/schema", "percentSchema", "fraction"],
          ["@inputcn/card/schema", "cardSchema", "digits, Luhn and brand"],
          ["@inputcn/duration/schema", "durationSchema", "seconds"],
          ["@inputcn/color/schema", "colorSchema", "hex"],
          ["@inputcn/cron/schema", "cronSchema", "expression"],
          ["@inputcn/filesize/schema", "fileSizeSchema", "bytes"],
          ["@inputcn/ip/schema", "cidrSchema", "address or CIDR"],
          ["@inputcn/mention/schema", "mentionSchema", "{ text, ids }"],
        ],
      },
    ],
    note: "Zod 4 is what the suite runs against today. A dual-version run against Zod 3 is planned and not yet wired up.",
  },

  {
    slug: "two-modes",
    group: "Validation",
    label: "Two modes",
    title: "Batteries included, removable",
    lede: (
      <>
        Drop a field in with no form library and it validates itself. Put it in one and it
        gets out of the way.
      </>
    ),
    blocks: [
      {
        kind: "code",
        id: "standalone",
        heading: "Standalone",
        code: `// No schema, no resolver, no onBlur handler, no useState for the error.
// The field renders its own message, once, after the first blur.
<CurrencyInput label="Budget" required positive max={100000} currency="GBP" />`,
      },
      {
        kind: "code",
        id: "managed",
        heading: "Managed",
        code: `// aria-invalid is supplied, so the field detects managed mode and renders
// no message of its own. Your <FormMessage> is the only one on screen.
<Controller
  name="budget"
  control={control}
  render={({ field, fieldState }) => (
    <CurrencyInput label="Budget" {...field} aria-invalid={fieldState.invalid} />
  )}
/>`,
      },
      {
        kind: "table",
        id: "detect",
        heading: "How the mode is chosen",
        cols: ["SIGNAL", "RESULT", "NOTE"],
        rows: [
          ["mode prop supplied", "That mode", "Escape hatch; rarely needed"],
          ["aria-invalid supplied", "Managed", "Your form library is already deciding"],
          ["aria-describedby supplied", "Managed", "Something else owns the description"],
          ["react-hook-form context", "Managed", "Detected from the form context"],
          ["none of the above", "Standalone", "The field owns its own error"],
        ],
      },
    ],
  },

  {
    slug: "constraint-props",
    group: "Validation",
    label: "Constraint props",
    title: "Constraints are props",
    lede: (
      <>
        The rule is declared where the field is declared. No schema needed for the ordinary
        cases, and the message is generated from the rule.
      </>
    ),
    blocks: [
      {
        kind: "table",
        id: "examples",
        heading: "A few per component",
        cols: ["COMPONENT", "PROP", "REJECTS"],
        rows: [
          ["PhoneInput", "mobileOnly", "Landline numbers, by prefix"],
          ["PhoneInput", "countries", "Anything outside the allowlist"],
          ["CurrencyInput", "positive / nonZero", "Zero and negative amounts"],
          ["CurrencyInput", "wholeUnitsOnly", "Fractional currency"],
          ["CardInput", "brands", "Cards outside the accepted set, by name"],
          ["CardInput", "notExpired", "An expiry in the past"],
          ["DurationInput", "multipleOf", 'Anything off the grid — "multiple of 15 minutes"'],
          ["CronInput", "minInterval", "Schedules that fire too often"],
          ["ColorInput", "minContrast", "Unreadable colours — as a warning, not an error"],
          ["IpInput", "maxPrefix", "0.0.0.0/0 and other over-broad ranges"],
          ["IpInput", "noPrivate", "RFC 1918 addresses in a public allowlist"],
          ["MentionInput", "maxMentions", "Notifying half the company"],
          ["Every component", "validate", "Whatever you say — return true or a message"],
        ],
      },
      {
        kind: "prose",
        id: "rule",
        heading: "The message comes from the rule",
        body: [
          <>
            Messages are generated, not hardcoded per component, and every error element
            carries a <code>data-rule</code> attribute naming the rule that failed. Tests
            assert on <code>maxPrefix</code> rather than on a sentence, so rewording an error
            does not break a suite — which is what causes those tests to be deleted rather
            than fixed.
          </>,
          <>
            Where a bound is a formatted thing, the message formats it too:{" "}
            <code>multipleOf=&quot;15m&quot;</code> produces &ldquo;must be a multiple of 15
            minutes&rdquo;, not &ldquo;must be a multiple of 900&rdquo;.
          </>,
        ],
      },
    ],
  },

  {
    slug: "error-timing",
    group: "Validation",
    label: "When errors appear",
    title: "When errors appear",
    lede: (
      <>
        A field that shouts at you on the first keystroke is a field people switch off. The
        timing is the feature.
      </>
    ),
    blocks: [
      {
        kind: "table",
        id: "timing",
        heading: 'Default showError="touched"',
        cols: ["STAGE", "BEHAVIOUR", "WHY"],
        rows: [
          ["Typing, never blurred", "Silent", "The value is incomplete because they are still writing it"],
          ["First blur, invalid", "Show the error", "They have finished and it is wrong, so now it helps"],
          ["Typing after an error", "Re-validate live", "The message clears the instant the value is valid"],
          ["Blur while empty, optional", "Silent", "An empty optional field is valid"],
          ["Programmatic reset", "Clear and untouch", "A reset form must not show stale errors"],
        ],
      },
      {
        kind: "prose",
        id: "a11y",
        heading: "And it is announced once",
        body: [
          <>
            The message is linked by <code>aria-describedby</code> and carries{" "}
            <code>role=&quot;alert&quot;</code>. It is asserted <strong>not</strong> to appear
            before the first blur — announcing on every keystroke is precisely what makes a
            field unusable with a screen reader, so the silence is a requirement, not an
            omission.
          </>,
        ],
      },
      {
        kind: "prose",
        id: "derived",
        heading: "Validity is derived, not stored",
        body: [
          <>
            Validity is computed during render from the current value and the current
            constraints. It is never written to state in an effect, so there is no frame in
            which the value and its validity disagree, and no cascade of re-renders when a
            constraint prop changes.
          </>,
        ],
      },
    ],
  },

  {
    slug: "smart-paste",
    group: "Lifecycle",
    label: "Smart paste",
    title: "Smart paste",
    lede: (
      <>
        People paste from spreadsheets, invoices, Slack and Word. What arrives is rarely what
        the field expects.
      </>
    ),
    blocks: [
      {
        kind: "table",
        id: "rows",
        heading: "What gets handled",
        cols: ["COMPONENT", "PASTED", "RESULT"],
        rows: [
          ["PhoneInput", "+44 20 7123 4567", "Value set and the country switched to GB, with a note and an undo"],
          ["CurrencyInput", "$1,234.50", "Emits 123450"],
          ["CardInput", "4242-4242-4242-4242", "Regrouped into the detected brand format"],
          ["DurationInput", "1:30:00 or 90 minutes", "Both emit 5400"],
          ["ColorInput", "rgb(205, 242, 92)", "Converted to hex"],
          ["IpInput", "a whole log line", "The address is extracted from it"],
          ["Every component", "text from Word or Docs", "Zero-width and non-breaking spaces stripped before parsing"],
        ],
      },
      {
        kind: "prose",
        id: "announce",
        heading: "A paste that changes more than the value says so",
        body: [
          <>
            Pasting <code>+44…</code> into a field set to US changes the country as well as the
            number. That is a bigger change than the user asked for, so the field shows what it
            did and offers an undo rather than silently rewriting the form.
          </>,
        ],
      },
    ],
  },

  {
    slug: "dev-warnings",
    group: "Lifecycle",
    label: "Dev-mode warnings",
    title: "Dev-mode warnings",
    lede: (
      <>
        Misuse that would otherwise fail silently in production is reported at the point of
        use, in development only.
      </>
    ),
    blocks: [
      {
        kind: "table",
        id: "warnings",
        heading: "What gets flagged",
        cols: ["SITUATION", "WHY IT MATTERS", ""],
        rows: [
          ["value and defaultValue both passed", "The component cannot be both controlled and uncontrolled", ""],
          ["value passed with no onChange", "The field will appear frozen to the user", ""],
          ["A constraint that can never pass", "min above max is a typo, not a rule", ""],
          ["name missing inside a <form>", "FormData will not carry the value", ""],
        ],
      },
      {
        kind: "prose",
        id: "prod",
        heading: "Stripped in production",
        body: [
          <>
            The warnings sit behind a <code>process.env.NODE_ENV !== &quot;production&quot;</code>{" "}
            check and each one fires at most once per component instance, so a warning in a
            list of two hundred rows does not produce two hundred lines of console noise.
          </>,
        ],
      },
    ],
  },

  {
    slug: "testing",
    group: "Lifecycle",
    label: "Testing helpers",
    title: "@inputcn/testing",
    lede: (
      <>
        Driving a masked field from a test is its own small nightmare. This package does it
        for you, the way a user would.
      </>
    ),
    blocks: [
      {
        kind: "code",
        id: "usage",
        heading: "Fill, leave, assert",
        code: `import { fillCurrency, leaveField, expectInvalid, expectFormData } from "@inputcn/testing"

it("rejects a budget over the cap", async () => {
  const { field } = renderField(<CurrencyInput label="Budget" max={100000} />)

  await fillCurrency(field, 250000)
  await leaveField(field)

  // Asserts the RULE, not the sentence. Rewording the copy does not break this.
  expectInvalid(field, "max")
})`,
      },
      {
        kind: "table",
        id: "api",
        heading: "What is in it",
        cols: ["HELPER", "KIND", "DOES"],
        rows: [
          ["fillPhone, fillCurrency, …", "11 helpers", "Types a canonical value into the field, keystroke by keystroke"],
          ["pasteInto", "action", "Pastes text and runs the component paste handler"],
          ["leaveField", "action", "Focuses the field if needed, then blurs it — so validation actually runs"],
          ["expectValue", "assertion", "Compares against the canonical value, naming both on failure"],
          ["expectInvalid(field, rule)", "assertion", "Asserts which rule failed, by data-rule"],
          ["expectFormData", "assertion", "Checks what a real submit would send"],
          ["renderField / renderInForm / renderManaged", "render", "The three modes a field can be used in"],
        ],
      },
      {
        kind: "prose",
        id: "bug",
        heading: "A bug this package found in itself",
        body: [
          <>
            <code>leaveField</code> originally assumed focus was already inside the field.
            Called on an untouched field it fired no blur at all, so validation silently never
            ran — which reads as &ldquo;the component is broken&rdquo;. It focuses first now.
          </>,
        ],
      },
    ],
  },

  {
    slug: "accessibility",
    group: "Lifecycle",
    label: "Accessibility",
    title: "Accessibility",
    lede: (
      <>
        What was tested, how, and — the part usually left out — what has not been verified
        yet.
      </>
    ),
    blocks: [
      {
        kind: "table",
        id: "status",
        heading: "Status",
        cols: ["AREA", "STATE", "HOW IT IS VERIFIED"],
        rows: [
          ["Automated rule checks", "Passing", "axe-core 4.13, 11 components × 5 states, in CI"],
          ["Labelling", "Passing", "Every component asserted to associate its label with a real control"],
          ["Keyboard operation", "Passing", "9 tests covering every interactive element"],
          ["Error announcement", "Passing", "aria-describedby + role=alert, and silence before first blur"],
          ["Reduced motion", "Present", "prefers-reduced-motion honoured in the stylesheet"],
          ["Forced colours", "Present", "forced-colors block in the stylesheet"],
          ["Colour contrast", "Not machine-checked", "jsdom has no layout engine; needs a real browser"],
          ["Screen readers", "NOT VERIFIED", "No NVDA, JAWS or VoiceOver run has been performed"],
        ],
      },
      {
        kind: "prose",
        id: "gap",
        heading: "The largest gap",
        body: [
          <>
            <strong>Screen readers have not been tested.</strong> Automated tooling catches
            structural problems — a missing name, a broken role relationship — but it cannot
            tell you whether the experience is <em>usable</em>, and only the second question
            matters to somebody actually using the field.
          </>,
          <>
            Until that is done, the honest description of this library is{" "}
            <em>structurally accessible, not yet screen-reader verified</em>. It needs a human
            with a screen reader and there is no automated substitute.
          </>,
        ],
      },
      {
        kind: "table",
        id: "found",
        heading: "Four real bugs the audit found",
        cols: ["BUG", "COMPONENT", "FIX"],
        rows: [
          ['role="combobox" on a <textarea>', "MentionInput", "Invalid per ARIA 1.2. Removed; a polite live region announces the count"],
          ['role="dialog" with no name', "PhoneInput", "It is a filtered listbox, not a dialog. Role removed"],
          ["Unnamed listbox", "Phone, Mention", "aria-label added to both"],
          ["<li> breaking listbox → option", "Phone, Mention", 'Wrappers now carry role="presentation"'],
        ],
      },
      {
        kind: "prose",
        id: "test",
        heading: "One of these was in a test, too",
        body: [
          <>
            A test of mine had asserted the invalid <code>combobox</code> role. The test
            encoded the bug, so axe was right and the test was wrong; both were corrected.
            That is the argument for running a rule engine over something you already have
            tests for.
          </>,
        ],
      },
    ],
    note: "Target: WCAG 2.2 AA. The full audit, including the disabled-rule list and the reasons, is in ACCESSIBILITY.md in the repository.",
  },
]

export const GUIDE_BY_SLUG = new Map(GUIDES.map((g) => [g.slug, g]))
