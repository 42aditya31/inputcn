#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { z } from "zod"

import {
  COMPONENTS,
  FIELD_TYPES,
  generate,
  installCommands,
  validate,
  type FieldType,
  type FormSpec,
} from "inputcn"

import PROPS from "./props.generated.json" with { type: "json" }

/**
 * MCP server for inputcn.
 *
 * The shadcn MCP server already installs from any spec-compliant registry, so
 * this is not about installation. It is about the questions an agent otherwise
 * answers by guessing: what props does this component really have, what value
 * does it emit, and does this form spec actually hold together.
 *
 * Every answer is read from the same extracted types the docs and the CLI use,
 * so the server cannot tell an agent something the library does not do.
 */

const SITE = "https://input-cn.vercel.app"

interface GenProp {
  name: string
  optional: boolean
  type: string
  doc: string
  kind?: string
}

const OWN = PROPS.components as Record<
  string,
  { display: string; package: string; own: GenProp[]; schemaOptions?: string[] }
>
const SHARED = PROPS.shared as GenProp[]

const BLOCKS = [
  ["checkout", "Card, phone for receipts and a tip", "react-hook-form + Zod", ["card-input", "phone-input", "currency-input"]],
  ["vendor-onboarding", "Mobile, tax ID, spend cap and IP allowlist", "react-hook-form + Zod", ["phone-input", "masked-input", "currency-input", "ip-input"]],
  ["job-schedule", "Cron, timeout, artifact cap and who gets paged", "no form library", ["cron-input", "duration-input", "filesize-input", "mention-input"]],
  ["rate-card", "Hourly rate, discount and minimum billable", "react-hook-form + Zod", ["currency-input", "percent-input", "duration-input"]],
  ["firewall-rule", "Source range, destination, expiry and tag", "no form library", ["ip-input", "duration-input", "color-input"]],
  ["brand-settings", "Brand colour, upload cap, support number, postcode", "no form library", ["color-input", "filesize-input", "phone-input", "masked-input"]],
] as const

const text = (s: string) => ({ content: [{ type: "text" as const, text: s }] })

const server = new McpServer({ name: "inputcn", version: "0.1.1" })

/* ------------------------------------------------------------------ */

server.tool(
  "inputcn_list_components",
  "List all eleven inputcn components with the canonical value each one emits. Call this first when deciding which component a field needs.",
  {},
  async () => {
    const rows = FIELD_TYPES.map((t) => {
      const c = COMPONENTS[t as FieldType]
      return `${c.component.padEnd(15)} type:${t.padEnd(10)} emits ${c.emits}`
    })
    return text(
      [
        "inputcn components. onChange emits the canonical value, never the",
        "formatted string shown on screen.",
        "",
        ...rows,
        "",
        `Docs: ${SITE}/components`,
      ].join("\n"),
    )
  },
)

server.tool(
  "inputcn_get_props",
  "Get the real, complete prop list for one inputcn component, extracted from its TypeScript interfaces. Use this instead of guessing prop names — a prop not returned here does not exist.",
  { component: z.enum(FIELD_TYPES as [string, ...string[]]) },
  async ({ component }) => {
    const c = COMPONENTS[component as FieldType]
    const data = OWN[c.slug]
    if (!data) return text(`Unknown component "${component}".`)

    const fmt = (p: GenProp) =>
      `  ${p.name}${p.optional ? "?" : ""}: ${p.type}${p.doc ? `\n      ${p.doc}` : ""}`

    const constraints = data.own.filter((p) => p.kind === "constraint")
    const others = data.own.filter((p) => p.kind !== "constraint")

    return text(
      [
        `${c.component} — ${c.pkg}`,
        `Emits: ${c.emits}`,
        `Install: npx shadcn@latest add ${SITE}/r/${c.slug}.json`,
        "",
        "CONSTRAINTS (validation as props)",
        constraints.length ? constraints.map(fmt).join("\n") : "  none",
        "",
        "COMPONENT PROPS",
        others.map(fmt).join("\n"),
        "",
        "SHARED PROPS (all eleven components)",
        SHARED.map(fmt).join("\n"),
        "",
        data.schemaOptions?.length
          ? `ZOD SCHEMA (${c.pkg}/schema) accepts: ${data.schemaOptions.join(", ")}\nThis is NOT the same set as the constraints above.`
          : "",
      ]
        .filter(Boolean)
        .join("\n"),
    )
  },
)

server.tool(
  "inputcn_canonical_value",
  "Ask what value a component actually emits and stores, and what the common mistake is. Use before writing any code that reads or persists a field value.",
  { component: z.enum(FIELD_TYPES as [string, ...string[]]) },
  async ({ component }) => {
    const c = COMPONENTS[component as FieldType]
    const wrong: Record<string, string> = {
      phone: 'the display string, e.g. "020 7123 4567"',
      currency: "a float or a decimal string, e.g. 1299.00",
      masked: 'the masked string, e.g. "123.456.789-01"',
      percent: "12.5 instead of 0.125, then divided somewhere else",
      card: 'the grouped string, e.g. "4242 4242 4242 4242"',
      duration: 'a human string, e.g. "1h 30m"',
      color: "whatever format the user typed",
      cron: "a description instead of the expression",
      filesize: 'a string with a unit, e.g. "1 MB", or MB and MiB confused',
      ip: "a parsed object instead of the address",
      mention: "the text without the ids, so notifications go stale",
    }

    return text(
      [
        `${c.component} emits ${c.emits}, as a ${c.tsType}.`,
        "",
        `Store that. The common mistake is storing ${wrong[component]}.`,
        "",
        `The Zod companion is ${c.schema} from ${c.pkg}/schema.`,
        component === "currency"
          ? "\nNote: min and max are in MINOR units too. max: 100000 is £1,000.00.\nPass currency and locale to the schema as well, or the message formats in USD."
          : "",
      ]
        .filter(Boolean)
        .join("\n"),
    )
  },
)

server.tool(
  "inputcn_list_blocks",
  "List the complete, ready-made inputcn forms. Use this when the task is a whole form — a checkout, onboarding, scheduler or settings page — rather than a single field.",
  {},
  async () =>
    text(
      [
        "Complete forms. Copying one is better than assembling fields: the value",
        "semantics and schema wiring are already correct.",
        "",
        ...BLOCKS.map(
          ([slug, what, wiring, uses]) =>
            `${slug}\n  ${what}\n  ${wiring} · ${uses.join(", ")}\n  ${SITE}/blocks/${slug}`,
        ),
      ].join("\n\n"),
    ),
)

server.tool(
  "inputcn_validate_spec",
  "Check a form.inputcn.json spec against the real component interfaces without writing any files. Returns each problem with a suggestion. Use this to verify a spec before generating from it.",
  { spec: z.string().describe("The form spec as a JSON string.") },
  async ({ spec }) => {
    let parsed: unknown
    try {
      parsed = JSON.parse(spec)
    } catch (e) {
      return text(`Not valid JSON: ${(e as Error).message}`)
    }

    const { problems } = validate(parsed)
    if (!problems.length) return text("Valid. No problems found.")

    return text(
      [
        `${problems.length} problem${problems.length === 1 ? "" : "s"}:`,
        "",
        ...problems.map((p) => `${p.where}\n  ${p.message}${p.hint ? `\n  ${p.hint}` : ""}`),
      ].join("\n"),
    )
  },
)

server.tool(
  "inputcn_generate_form",
  "Turn a form.inputcn.json spec into a complete React component with a matching Zod schema. Prefer this over writing the form by hand: every prop is checked against the real interfaces, and the canonical values and schema wiring are handled for you.",
  { spec: z.string().describe("The form spec as a JSON string.") },
  async ({ spec }) => {
    let parsed: unknown
    try {
      parsed = JSON.parse(spec)
    } catch (e) {
      return text(`Not valid JSON: ${(e as Error).message}`)
    }

    const { spec: valid, problems } = validate(parsed)
    if (problems.length) {
      return text(
        [
          "Refusing to generate — the spec has problems:",
          "",
          ...problems.map((p) => `${p.where}\n  ${p.message}${p.hint ? `\n  ${p.hint}` : ""}`),
        ].join("\n"),
      )
    }

    const code = generate(valid as FormSpec)
    return text(
      [
        "Install first:",
        "",
        ...installCommands(valid as FormSpec, SITE),
        "",
        `Then write this to ${(valid as FormSpec).name}.tsx:`,
        "",
        "```tsx",
        code,
        "```",
      ].join("\n"),
    )
  },
)

/* ------------------------------------------------------------------ */

const transport = new StdioServerTransport()
await server.connect(transport)
