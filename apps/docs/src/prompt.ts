import type { ComponentDoc } from "./content/components.js"
import GENERATED from "./content/props.generated.json"
import { SITE_URL } from "./site.js"

/**
 * Turn a component page into a prompt an agent can act on.
 *
 * The premise of idea #1 in AI-NATIVE-IDEAS.md: most developers now reach this
 * library through an agent rather than by reading the page. So the page's job
 * is to hand the agent everything it would otherwise guess at — the canonical
 * value, the real prop names, and the two or three traps that make generated
 * form code subtly wrong.
 *
 * Everything here is derived from the same data that renders the page, so a
 * prompt cannot drift from the docs above it.
 */

export type Integration = "rhf" | "action" | "standalone"

export interface PromptOptions {
  integration: Integration
  withTests: boolean
}

interface GenProp {
  name: string
  optional: boolean
  type: string
  doc: string
  kind?: string
}

const OWN = GENERATED.components as Record<string, { own: GenProp[] }>

/** What each component emits, in the words an agent needs. */
const CANONICAL: Record<string, string> = {
  "phone-input": 'a `string` in E.164 form, e.g. "+442071234567"',
  "currency-input": "a `number` of integer minor units, e.g. `129900` for £1,299.00",
  "masked-input": 'the raw `string` with no mask characters, e.g. "12345678901"',
  "percent-input": "a `number` as a fraction — the field shows 12.5 and emits `0.125`",
  "card-input": 'a `string` of digits only, e.g. "4242424242424242"',
  "duration-input": "a `number` of seconds, e.g. `5400` for 1h 30m",
  "color-input": 'a `string` of uppercase hex, e.g. "#CDF25C"',
  "cron-input": 'a `string` cron expression, e.g. "0 9 * * 1-5"',
  "filesize-input": "a `number` of bytes, e.g. `1048576`",
  "ip-input": 'a `string` address or CIDR block, e.g. "10.0.0.0/24"',
  "mention-input": "an object `{ text: string, ids: string[] }`",
}

/**
 * Traps that produce code which looks right and is wrong. These are the whole
 * reason the prompt is worth more than a link to the docs.
 */
const TRAPS: Record<string, string[]> = {
  "phone-input": [
    "Store the E.164 value. Never store what the field displays.",
  ],
  "currency-input": [
    "Never use a float for money. The value is already an integer of minor units.",
    "`max` and `min` are in MINOR units too: max={100000} is £1,000.00, not £100,000.",
    "Pass `currency` and `locale` to the schema as well as the component, or the error message formats in USD.",
  ],
  "percent-input": [
    "Do not multiply by 100 anywhere. The component is the only place that conversion lives.",
  ],
  "card-input": [
    "This is not a PCI-compliant capture path. Use it for test checkouts or behind a processor iframe.",
    "It takes three names: `name`, `expiryName` and `cvcName`.",
  ],
  "duration-input": [
    "`min`, `max` and `multipleOf` accept duration strings like \"15m\", not raw seconds.",
  ],
  "filesize-input": [
    "MB is 1000² and MiB is 1024². Pick one with `binary` and keep it consistent server-side.",
  ],
  "color-input": [
    "`minContrast` raises a warning, not an error. Do not block submit on it.",
  ],
  "mention-input": [
    "The ids track the text. If a handle is edited out, its id is removed — do not cache them separately.",
  ],
}

function constraintLines(slug: string): string {
  const own = OWN[slug]?.own ?? []
  const constraints = own.filter((p) => p.kind === "constraint")
  if (!constraints.length) return ""

  const lines = constraints
    .map((p) => `- ${p.name}: ${p.type}${p.doc ? ` — ${p.doc}` : ""}`)
    .join("\n")

  return `\nValidation is declared as props. The ones available here:\n${lines}\n`
}

function integrationBlock(c: ComponentDoc, o: PromptOptions): string {
  if (o.integration === "rhf") {
    return `
Wire it up with react-hook-form and the companion Zod schema:

  import { ${c.schema} } from "${c.pkg}/schema"

  const schema = z.object({ ${c.field}: ${c.schema}({ /* same constraints */ }) })

  <Controller
    name="${c.field}"
    control={control}
    render={({ field, fieldState }) => (
      <${c.name} label="${c.label}" {...field} aria-invalid={fieldState.invalid} />
    )}
  />

The schema validates the canonical value, so the resolver and the field cannot
disagree. Import it from the /schema entry point only — that keeps Zod out of
the component bundle.
`
  }

  if (o.integration === "action") {
    const cast =
      c.t === "number" ? `Number(data.get("${c.field}"))` : `data.get("${c.field}")`
    return `
Use it with a Server Action and no client component:

  <form action={save}>
    <${c.name} name="${c.field}" label="${c.label}" />
    <button>Save</button>
  </form>

  async function save(data: FormData) {
    "use server"
    const ${c.field} = ${cast}
  }

Passing \`name\` renders a hidden input carrying the canonical value, so
FormData receives ${c.t}, not the display text.
`
  }

  return `
Use it standalone — no form library. Declare the rules as props and the field
validates itself, staying silent until the first blur and clearing live once the
value is valid:

  <${c.name} label="${c.label}" required /* + constraints */ />

Do not add a schema, a resolver or an onBlur handler for validation. It is
already handled.
`
}

function testBlock(c: ComponentDoc): string {
  return `
Add a test using the official helpers, which drive a formatted field correctly:

  import { fill${c.name.replace("Input", "")}, leaveField, expectInvalid } from "@inputcn/testing"

Assert the RULE, not the message text — expectInvalid(field, "max") survives a
copy change or a locale switch.
`
}

/** The full prompt. Kept well under the 5,000-character deep-link limit. */
export function buildPrompt(c: ComponentDoc, o: PromptOptions): string {
  const canonical = CANONICAL[c.slug] ?? `a \`${c.t}\``
  const traps = TRAPS[c.slug] ?? []

  // Blocks, joined by a blank line. Built as whole blocks rather than lines so
  // that dropping an optional section cannot also drop the spacing around it —
  // a person reads this before pressing Enter, so the shape matters.
  const blocks: string[] = [
    `Add a ${c.name} to this project using inputcn.`,

    [
      `Install it first — this copies the component source into the repo:`,
      ``,
      `  npx shadcn@latest add ${SITE_URL}/r/${c.slug}.json`,
      ``,
      `Then import the stylesheet once in the app root, if it is not there already:`,
      ``,
      `  import "@inputcn/core/styles.css"`,
    ].join("\n"),

    [
      `THE ONE RULE`,
      `onChange emits the canonical value, never the formatted string.`,
      `${c.name} emits ${canonical}.`,
      `Store, validate and send that value. What the field displays is only a view.`,
    ].join("\n"),

    constraintLines(c.slug),
    integrationBlock(c, o),
    o.withTests ? testBlock(c) : "",

    traps.length
      ? [`Get these right — they are the mistakes that look correct:`, ...traps.map((t) => `- ${t}`)].join("\n")
      : "",

    [
      `Full docs: ${SITE_URL}/components/${c.slug}`,
      `Do not invent props. The complete list is on that page and in the types.`,
    ].join("\n"),
  ]

  return blocks
    .map((b) => b.trim())
    .filter(Boolean)
    .join("\n\n")
}

/* ------------------------------------------------------------------ *
 * Deep links
 *
 * Neither of these executes anything. Both open the tool with the prompt
 * typed into the box, and the person reads it and presses Enter. That is
 * worth saying out loud on the page, because a button that launches an
 * agent sounds alarming until you know it does not.
 * ------------------------------------------------------------------ */

/** Claude Code registers claude-cli:// on macOS, Linux and Windows. */
export const CLAUDE_LIMIT = 5000

export function claudeCodeLink(prompt: string): string {
  return `claude-cli://open?q=${encodeURIComponent(prompt)}`
}

/** Opens a Claude Code tab in VS Code rather than a terminal window. */
export function vscodeLink(prompt: string): string {
  return `vscode://anthropic.claude-code/open?q=${encodeURIComponent(prompt)}`
}

/** Cursor allows 10,000 characters and has an https fallback that always opens. */
export function cursorLink(prompt: string): string {
  return `https://cursor.com/link/prompt?text=${encodeURIComponent(prompt)}`
}
