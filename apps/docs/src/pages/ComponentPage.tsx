import { BuildWithAI } from "../components/BuildWithAI.js"
import { actionExample, rhfExample, type ComponentDoc } from "../content/components.js"
import GENERATED from "../content/props.generated.json"
import { DocsLayout, type TocEntry } from "../layout/DocsLayout.js"
import { Code, InstallBar, Table } from "../ui.js"

interface GenProp {
  name: string
  optional: boolean
  type: string
  doc: string
  kind?: string
}

const SHARED = GENERATED.shared as GenProp[]
const OWN = GENERATED.components as Record<string, { own: GenProp[] }>

function rows(props: GenProp[]) {
  return props.map((p) => [
    p.name + (p.optional ? "?" : ""),
    p.type,
    p.doc || "—",
  ] as const)
}

export function ComponentPageView({ c }: { c: ComponentDoc }) {
  const own = OWN[c.slug]?.own ?? []
  const constraints = own.filter((p) => p.kind === "constraint")
  const options = own.filter((p) => p.kind !== "constraint")

  const toc: TocEntry[] = [
    { id: "bwa-h", label: "Build with an agent" },
    { id: "demo", label: "Live demo" },
    ...(constraints.length ? [{ id: "constraints", label: "Constraints" }] : []),
    { id: "props", label: "Props" },
    { id: "shared", label: "Shared props" },
    { id: "form", label: "With react-hook-form" },
    { id: "action", label: "With a Server Action" },
    ...(c.keys ? [{ id: "keyboard", label: "Keyboard" }] : []),
    ...(c.gotchas ? [{ id: "notes", label: "Worth knowing" }] : []),
  ]

  const Demo = c.demo

  return (
    <DocsLayout
      eyebrow={`Components / ${c.name}`}
      title={c.name}
      lede={c.lede}
      toc={toc}
      note={
        <>
          Emits <code>{c.t}</code>, for example <code>{c.example}</code>. Keyboard operation is
          covered by automated tests; screen readers have not been verified yet.
        </>
      }
    >
      <InstallBar registry={c.slug} pkg={c.pkg} />

      <BuildWithAI c={c} />

      <h2 className="doc-h2" id="demo">
        Live demo
      </h2>
      <div className="demo">
        <div className={c.slug === "mention-input" ? "demo-in wide" : "demo-in"}>
          <Demo />
        </div>
      </div>

      {constraints.length ? (
        <>
          <h2 className="doc-h2" id="constraints">
            Constraints
          </h2>
          <div className="doc-prose">
            <p>
              Validation rules, declared as props. Each one produces its own message and its
              own <code>data-rule</code> value, so a test can assert the rule rather than the
              sentence.
            </p>
          </div>
          <Table cols={["PROP", "TYPE", "DESCRIPTION"]} rows={rows(constraints)} />
        </>
      ) : null}

      <h2 className="doc-h2" id="props">
        Props
      </h2>
      <Table cols={["PROP", "TYPE", "DESCRIPTION"]} rows={rows(options)} />

      <h2 className="doc-h2" id="shared">
        Shared props
      </h2>
      <div className="doc-prose">
        <p>
          Implemented identically by all eleven components. These tables are generated from
          the source interfaces at build time, so a renamed prop changes this page rather than
          quietly making it wrong.
        </p>
      </div>
      <Table cols={["PROP", "TYPE", "DESCRIPTION"]} rows={rows(SHARED)} />

      <h2 className="doc-h2" id="form">
        With react-hook-form
      </h2>
      <Code code={rhfExample(c)} />

      <h2 className="doc-h2" id="action">
        With a Server Action
      </h2>
      <Code code={actionExample(c)} />

      {c.keys ? (
        <>
          <h2 className="doc-h2" id="keyboard">
            Keyboard
          </h2>
          <Table cols={["KEY", "DOES"]} rows={c.keys.map(([k, d]) => [k, d] as const)} />
        </>
      ) : null}

      {c.gotchas ? (
        <>
          <h2 className="doc-h2" id="notes">
            Worth knowing
          </h2>
          <div className="doc-prose">
            {c.gotchas.map((g, i) => (
              <p key={i}>{g}</p>
            ))}
          </div>
        </>
      ) : null}
    </DocsLayout>
  )
}
