import { COMPONENTS } from "../content/components.js"
import { CurrencyDemo, PercentDemo, PhoneDemo } from "../content/demos.js"
import { Link } from "../router.js"
import { installCmd } from "../site.js"
import { Code, CopyCmd, Table } from "../ui.js"

const BADGES = ["MIT", "validation built in", "smart paste", "React 19", "zod 4", "0 runtime deps"]

const MARQUEE = [
  "caret never jumps",
  "canonical values",
  "E.164",
  "integer minor units",
  "smart paste",
  "zod companions",
  "server actions",
  "react-hook-form",
  "shadcn tokens",
  "4 variants",
  "488 tests",
  "axe-core in CI",
]

const BAND = [
  [
    "Correct",
    <>
      The caret holds position mid-string. Paste normalises. Separators and zero-decimal
      currencies come from <code>Intl</code>, not from a hardcoded 100.
    </>,
  ],
  [
    "Native",
    <>
      Only shadcn CSS variables. Your palette, your radius, your focus ring, your dark mode —
      inherited, never overridden.
    </>,
  ],
  [
    "Yours",
    <>
      Installed through the registry: the source lands in your repo. Edit it, fork it, delete
      half of it. The headless hooks ship too.
    </>,
  ],
  [
    "Honest",
    <>
      Keyboard complete and axe-core in CI, with the four ARIA bugs it caught written up.
      Screen readers are <strong>not</strong> verified yet, and the audit says so.
    </>,
  ],
] as const

const INTEGRATION = `import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { moneySchema } from "@inputcn/currency/schema"
import { z } from "zod"

// The companion schema validates the CANONICAL value, so the resolver and the
// field can never disagree about what "valid" means.
const schema = z.object({ price: moneySchema({ positive: true, max: 100000 }) })

const { control } = useForm({ resolver: zodResolver(schema) })

<Controller
  name="price"
  control={control}
  render={({ field, fieldState }) => (
    <CurrencyInput label="Price" {...field} aria-invalid={fieldState.invalid} />
  )}
/>`

const STANDALONE = `// Or none of that. No schema, no resolver, no onBlur handler,
// no useState for the error message.
<CurrencyInput
  label="Budget"
  required
  positive
  max={100000}
  currency="GBP"
/>`

export function Home() {
  return (
    <>
      {/* ---------------------------------------------------------- */}
      <div className="hero">
        <div className="gridlines" />
        <div className="glow" />
        <div className="beam" />

        <div className="hero-in">
          <div className="eyebrow wide">Sheet 01 / 01 · Rev 1.0 · 11 specimens</div>

          <h1 className="hero-title gradient-title">
            input<i>/</i>cn
          </h1>

          <p className="lede">
            The inputs shadcn/ui does not ship. Every field below is live — type in them, paste
            into them, break them. The readout underneath shows the value <code>onChange</code>{" "}
            actually emits.
          </p>

          <div className="cta">
            <CopyCmd cmd={installCmd("phone-input")} />
            <Link className="btn-solid" to="/components">
              All 11 components
            </Link>
          </div>

          <div className="badges">
            {BADGES.map((b) => (
              <span key={b}>{b}</span>
            ))}
          </div>

          <div className="hero-grid">
            <div className="card">
              <div className="spec-strip">
                <span>SPEC-01</span>
                <b>PHONEINPUT</b>
              </div>
              <div className="card-body">
                <PhoneDemo />
              </div>
            </div>
            <div className="card">
              <div className="spec-strip">
                <span>SPEC-02</span>
                <b>CURRENCYINPUT</b>
              </div>
              <div className="card-body">
                <CurrencyDemo />
              </div>
            </div>
            <div className="card">
              <div className="spec-strip">
                <span>SPEC-04</span>
                <b>PERCENTINPUT</b>
              </div>
              <div className="card-body">
                <PercentDemo />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------- */}
      <div className="band">
        <div className="band-in">
          {BAND.map(([title, body]) => (
            <div className="band-cell" key={title}>
              <div className="eyebrow ac">{title}</div>
              <p>{body}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="marquee">
        <div className="marquee-track" aria-hidden>
          {[0, 1].map((copy) => (
            <span className="it" key={copy}>
              {MARQUEE.map((m) => (
                <span className="it" key={m}>
                  <span>{m}</span>
                  <i />
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* ---------------------------------------------------------- */}
      <section className="sec" id="components">
        <div className="sec-head">
          <div>
            <div className="eyebrow">01 — Components</div>
            <h2>Eleven hard inputs, one contract.</h2>
          </div>
          <div className="sp" />
          <p>
            Every card below is a working input, not a screenshot. The readout under each one
            is the value <code>onChange</code> actually emits.
          </p>
        </div>

        <div className="grid-cards">
          {COMPONENTS.map((c, i) => {
            const Demo = c.demo
            return (
              <div className="card lift" key={c.slug}>
                <div className="card-head">
                  <span className="n">{String(i + 1).padStart(2, "0")}</span>
                  <Link className="nm" to={`/components/${c.slug}`}>
                    {c.name}
                  </Link>
                  <span className="sp" />
                  <span className="pill-t">{c.t}</span>
                </div>
                <div className="card-body">
                  <Demo />
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ---------------------------------------------------------- */}
      <section className="sec" id="integration">
        <div className="sec-head">
          <div>
            <div className="eyebrow">02 — Integration</div>
            <h2>Works with the form stack you already have.</h2>
          </div>
          <div className="sp" />
          <p>
            And with none of it. The field detects whether something else owns its error state
            and gets out of the way.
          </p>
        </div>

        <div className="grid-cards" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(420px,1fr))" }}>
          <Code code={INTEGRATION} />
          <Code code={STANDALONE} />
        </div>
      </section>

      {/* ---------------------------------------------------------- */}
      <section className="sec" id="contract">
        <div className="sec-head">
          <div>
            <div className="eyebrow">03 — Form contract</div>
            <h2>One canonical value per component.</h2>
          </div>
          <div className="sp" />
          <p>
            The display string is a view. This column is what you store, validate and send over
            the wire.
          </p>
        </div>

        <Table
          cols={["COMPONENT", "T", "EXAMPLE VALUE"]}
          rows={COMPONENTS.map((c) => [c.name, c.t, c.example] as const)}
        />
      </section>

      {/* ---------------------------------------------------------- */}
      <section className="sec last" id="validation">
        <div className="sec-head">
          <div>
            <div className="eyebrow">04 — Validation</div>
            <h2>Declare the rule as a prop.</h2>
          </div>
          <div className="sp" />
          <p>
            Silent until the first blur, then live. The message is generated from the rule, and
            the rule name is on the element for your tests.
          </p>
        </div>

        <Table
          cols={["PROP", "COMPONENT", "REJECTS"]}
          rows={[
            ["mobileOnly", "PhoneInput", "Landline numbers, by prefix"],
            ["positive max", "CurrencyInput", "Zero, negatives and anything over the cap"],
            ["brands notExpired", "CardInput", "Cards outside the accepted set, and past expiries"],
            ["multipleOf", "DurationInput", 'Off-grid values — "a multiple of 15 minutes"'],
            ["minInterval", "CronInput", "Schedules that fire too often"],
            ["minContrast", "ColorInput", "Unreadable colours — as a warning, not an error"],
            ["maxPrefix noPrivate", "IpInput", "0.0.0.0/0, and RFC 1918 in a public allowlist"],
            ["maxMentions", "MentionInput", "Notifying half the company"],
          ]}
        />

        <div className="doc-prose">
          <p>
            Full detail in <Link to="/docs/constraint-props">Constraint props</Link>, and the
            complete generated list on each component page.
          </p>
        </div>
      </section>
    </>
  )
}
