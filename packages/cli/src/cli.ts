#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs"
import { dirname, join, resolve } from "node:path"

import { dependencies, generate, installCommands } from "./generate.js"
import { FIELD_TYPES, validate } from "./spec.js"

const SITE = "https://input-cn.vercel.app"

const USAGE = `inputcn — generate correct React forms from a spec

  npx inputcn generate <spec.json> [--out <dir>] [--stdout]
  npx inputcn init [name]
  npx inputcn types

Why a spec rather than asking for the form directly: a model is unreliable at
writing nuanced React and very reliable at emitting structured JSON. Ask for
the description; let the generator write the code.

Every prop in the spec is checked against the props the components actually
declare, so a hallucinated prop fails here instead of becoming JSX.

Docs: ${SITE}/docs/form-spec
`

const TEMPLATE = (name: string) =>
  JSON.stringify(
    {
      $schema: `${SITE}/schema/form.json`,
      name,
      form: "react-hook-form",
      submitLabel: "Save",
      fields: [
        { type: "phone", name: "phone", label: "Mobile number", mobileOnly: true },
        {
          type: "currency",
          name: "budget",
          label: "Monthly budget",
          currency: "GBP",
          locale: "en-GB",
          positive: true,
          max: 1_000_000,
        },
      ],
    },
    null,
    2,
  ) + "\n"

function fail(message: string): never {
  process.stderr.write(`\n  ${message}\n\n`)
  process.exit(1)
}

const [, , command, ...rest] = process.argv

if (!command || command === "--help" || command === "-h") {
  process.stdout.write(USAGE)
  process.exit(0)
}

if (command === "types") {
  process.stdout.write(`\n  Field types and what each one emits:\n\n`)
  const { COMPONENTS } = await import("./spec.js")
  for (const t of FIELD_TYPES) {
    const c = COMPONENTS[t]
    process.stdout.write(`    ${t.padEnd(10)} ${c.component.padEnd(15)} ${c.emits}\n`)
  }
  process.stdout.write(`\n  Full props per type: ${SITE}/components\n\n`)
  process.exit(0)
}

if (command === "init") {
  const name = rest[0] ?? "MyForm"
  const out = resolve(process.cwd(), "form.inputcn.json")
  if (existsSync(out)) fail(`form.inputcn.json already exists. Delete it or pass a path to generate.`)
  writeFileSync(out, TEMPLATE(name), "utf8")
  process.stdout.write(`\n  Wrote form.inputcn.json\n\n  Next:  npx inputcn generate form.inputcn.json\n\n`)
  process.exit(0)
}

if (command !== "generate") fail(`Unknown command "${command}".\n  Run: npx inputcn --help`)

const specPath = rest.find((a) => !a.startsWith("--"))
if (!specPath) fail(`No spec file given.\n  Run: npx inputcn generate form.inputcn.json`)

const full = resolve(process.cwd(), specPath)
if (!existsSync(full)) fail(`No such file: ${specPath}`)

let parsed: unknown
try {
  parsed = JSON.parse(readFileSync(full, "utf8"))
} catch (e) {
  fail(`${specPath} is not valid JSON.\n  ${(e as Error).message}`)
}

const { spec, problems } = validate(parsed)

if (problems.length) {
  process.stderr.write(`\n  ${problems.length} problem${problems.length === 1 ? "" : "s"} in ${specPath}\n\n`)
  for (const p of problems) {
    process.stderr.write(`    ${p.where}\n      ${p.message}\n`)
    if (p.hint) process.stderr.write(`      ${p.hint}\n`)
    process.stderr.write(`\n`)
  }
  process.exit(1)
}

const code = generate(spec)

if (rest.includes("--stdout")) {
  process.stdout.write(code)
  process.exit(0)
}

const outIndex = rest.indexOf("--out")
const outDir = outIndex !== -1 ? rest[outIndex + 1] : dirname(full)
if (!outDir) fail(`--out needs a directory.`)

const target = join(resolve(process.cwd(), outDir), `${spec.name}.tsx`)
mkdirSync(dirname(target), { recursive: true })
writeFileSync(target, code, "utf8")

process.stdout.write(`\n  Wrote ${spec.name}.tsx  (${spec.fields.length} fields)\n\n`)
process.stdout.write(`  Install the components it uses:\n\n`)
for (const cmd of installCommands(spec, SITE)) process.stdout.write(`    ${cmd}\n`)
process.stdout.write(`\n  And the packages it imports:\n\n    npm i ${dependencies(spec).join(" ")}\n\n`)
