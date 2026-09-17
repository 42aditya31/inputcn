import { useState, type FormEvent } from "react"

import { CardInput } from "@inputcn/card"
import { ColorInput } from "@inputcn/color"
import type { FieldSize, FieldVariant } from "@inputcn/core"
import { CronInput } from "@inputcn/cron"
import { CurrencyInput } from "@inputcn/currency"
import { DurationInput } from "@inputcn/duration"
import { FileSizeInput } from "@inputcn/filesize"
import { IpInput } from "@inputcn/ip"
import { MASKS, MaskedInput } from "@inputcn/masked"
import { MentionInput, type MentionValue, type Person } from "@inputcn/mention"
import { PercentInput } from "@inputcn/percent"
import { PhoneInput } from "@inputcn/phone"

const VARIANTS: FieldVariant[] = ["outline", "filled", "underline", "elevated"]
const SIZES: FieldSize[] = ["sm", "default", "lg"]

const ACCENTS = [
  { name: "Neutral", swatch: "#2b2b2e", primary: "oklch(.21 .006 264)", ring: "oklch(.62 .018 264)" },
  { name: "Blue", swatch: "#2f5fe0", primary: "oklch(.52 .2 258)", ring: "oklch(.6 .19 258)" },
  { name: "Violet", swatch: "#7c3aed", primary: "oklch(.52 .24 293)", ring: "oklch(.6 .22 293)" },
  { name: "Emerald", swatch: "#0d9668", primary: "oklch(.55 .15 162)", ring: "oklch(.62 .14 162)" },
  { name: "Rose", swatch: "#dc4526", primary: "oklch(.6 .19 28)", ring: "oklch(.64 .18 28)" },
]

const TEAM: Person[] = [
  { id: "u1", name: "Ada Lovelace", handle: "ada", detail: "Engineering", badge: "Owner" },
  { id: "u2", name: "Grace Hopper", handle: "grace", detail: "Platform", badge: "Admin" },
  { id: "u3", name: "Alan Turing", handle: "alan", detail: "Research" },
  { id: "u4", name: "Katherine Johnson", handle: "katherine", detail: "Flight Dynamics" },
  { id: "u5", name: "Radia Perlman", handle: "radia", detail: "Networking" },
]

export default function App() {
  const [dark, setDark] = useState(false)
  const [variant, setVariant] = useState<FieldVariant>("outline")
  const [size, setSize] = useState<FieldSize>("default")
  const [radius, setRadius] = useState(8)
  const [accent, setAccent] = useState(0)

  const [phone, setPhone] = useState("")
  const [amount, setAmount] = useState(0)
  const [taxId, setTaxId] = useState("")
  const [rate, setRate] = useState(0)
  const [card, setCard] = useState("")
  const [timeout_, setTimeout_] = useState(0)
  const [color, setColor] = useState("#3A3FD6")
  const [cron, setCron] = useState("0 9 * * 1-5")
  const [maxSize, setMaxSize] = useState(0)
  const [cidr, setCidr] = useState("")
  const [comment, setComment] = useState<MentionValue>({ text: "", ids: [] })
  const [submitted, setSubmitted] = useState<Record<string, string> | null>(null)

  const a = ACCENTS[accent]!

  // Applied to <html> so the library's token lookups resolve exactly as they
  // would in a real app.
  const root = document.documentElement
  root.classList.toggle("dark", dark)
  root.style.setProperty("--radius", `${radius}px`)
  root.style.setProperty("--primary", a.primary)
  root.style.setProperty("--ring", a.ring)

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setSubmitted(Object.fromEntries(fd.entries()) as Record<string, string>)
  }

  const shared = { variant, size } as const

  return (
    <>
      <div className="bar">
        <h1>inputcn · dev harness</h1>
        <div className="sp" />

        <div className="ctl">
          <span>variant</span>
          <div className="seg">
            {VARIANTS.map((v) => (
              <button key={v} aria-pressed={v === variant} onClick={() => setVariant(v)}>
                {v}
              </button>
            ))}
          </div>
        </div>

        <div className="ctl">
          <span>size</span>
          <div className="seg">
            {SIZES.map((s) => (
              <button key={s} aria-pressed={s === size} onClick={() => setSize(s)}>
                {s === "default" ? "md" : s}
              </button>
            ))}
          </div>
        </div>

        <div className="ctl">
          <span>--primary</span>
          <div className="swatches">
            {ACCENTS.map((c, i) => (
              <button
                key={c.name}
                className="sw"
                title={c.name}
                aria-pressed={i === accent}
                style={{ background: c.swatch }}
                onClick={() => setAccent(i)}
              />
            ))}
          </div>
        </div>

        <div className="ctl">
          <span>--radius</span>
          <input
            type="range"
            min={0}
            max={16}
            value={radius}
            onChange={(e) => setRadius(Number(e.currentTarget.value))}
          />
          <span>{radius}px</span>
        </div>

        <div className="ctl">
          <div className="seg">
            <button aria-pressed={!dark} onClick={() => setDark(false)}>
              light
            </button>
            <button aria-pressed={dark} onClick={() => setDark(true)}>
              dark
            </button>
          </div>
        </div>
      </div>

      <main>
        {/* ---------------------------------------------------------- */}
        <h2>All 11 components</h2>
        <p className="note">
          Live. Type in them, paste into them, try to break them. Every field shows the
          value <code>onChange</code> actually emits — display and canonical value are
          never the same thing.
        </p>

        <div className="grid">
          <div className="cell">
            <h3>PhoneInput</h3>
            <p className="sub">emits string · E.164</p>
            <PhoneInput
              {...shared}
              label="Phone number"
              value={phone}
              onChange={setPhone}
              hint="Paste +442071234567 — it switches country."
            />
            <div className="emit">
              onChange → <b>{JSON.stringify(phone)}</b>
            </div>
          </div>

          <div className="cell">
            <h3>CurrencyInput</h3>
            <p className="sub">emits number · minor units</p>
            <CurrencyInput
              {...shared}
              label="Amount"
              value={amount}
              onChange={setAmount}
              hint="Digits fill from the right, like a register."
            />
            <div className="emit">
              onChange → <b>{amount}</b>
            </div>
          </div>

          <div className="cell">
            <h3>MaskedInput</h3>
            <p className="sub">emits string · raw</p>
            <MaskedInput
              {...shared}
              label="Tax ID"
              mask={MASKS.cpf}
              value={taxId}
              onChange={setTaxId}
              hint="Click into the middle and type — the caret holds."
            />
            <div className="emit">
              onChange → <b>{JSON.stringify(taxId)}</b>
            </div>
          </div>

          <div className="cell">
            <h3>PercentInput</h3>
            <p className="sub">emits number · fraction</p>
            <PercentInput
              {...shared}
              label="Discount rate"
              value={rate}
              onChange={setRate}
              hint="Shows 12.5, emits 0.125."
            />
            <div className="emit">
              onChange → <b>{rate}</b>
            </div>
          </div>

          <div className="cell">
            <h3>CardInput</h3>
            <p className="sub">emits string · digits</p>
            <CardInput
              {...shared}
              label="Card details"
              value={card}
              onChange={setCard}
              hint="Try 4242… then 3782… — grouping reflows to 4-6-5."
            />
            <div className="emit">
              onChange → <b>{JSON.stringify(card)}</b>
            </div>
          </div>

          <div className="cell">
            <h3>DurationInput</h3>
            <p className="sub">emits number · seconds</p>
            <DurationInput
              {...shared}
              label="Session timeout"
              value={timeout_}
              onChange={setTimeout_}
              hint="90m · 1:30 · 1.5h all give the same value."
            />
            <div className="emit">
              onChange → <b>{timeout_}</b>
            </div>
          </div>

          <div className="cell">
            <h3>
              ColorInput <span className="new">new</span>
            </h3>
            <p className="sub">emits string · hex</p>
            <ColorInput
              {...shared}
              label="Brand colour"
              value={color}
              onChange={setColor}
              contrastAgainst="#FFFFFF"
              hint="Paste rgb(58, 63, 214) — it converts."
            />
            <div className="emit">
              onChange → <b>{color}</b>
            </div>
          </div>

          <div className="cell">
            <h3>
              CronInput <span className="new">new</span>
            </h3>
            <p className="sub">emits string · expression</p>
            <CronInput
              {...shared}
              label="Schedule"
              value={cron}
              onChange={setCron}
              hint="Try */15 * * * * or @daily."
            />
            <div className="emit">
              onChange → <b>{JSON.stringify(cron)}</b>
            </div>
          </div>

          <div className="cell">
            <h3>
              FileSizeInput <span className="new">new</span>
            </h3>
            <p className="sub">emits number · bytes</p>
            <FileSizeInput
              {...shared}
              label="Max upload"
              value={maxSize}
              onChange={setMaxSize}
              hint="1 MB and 1 MiB are different — try both."
            />
            <div className="emit">
              onChange → <b>{maxSize}</b>
            </div>
          </div>

          <div className="cell">
            <h3>
              IpInput <span className="new">new</span>
            </h3>
            <p className="sub">emits string · address</p>
            <IpInput
              {...shared}
              label="Allowed range"
              value={cidr}
              onChange={setCidr}
              hint="Try 10.0.0.0/24, or paste a whole log line."
            />
            <div className="emit">
              onChange → <b>{JSON.stringify(cidr)}</b>
            </div>
          </div>

          <div className="cell" style={{ gridColumn: "span 2" }}>
            <h3>
              MentionInput <span className="new">new</span>
            </h3>
            <p className="sub">emits {"{ text, ids }"}</p>
            <MentionInput
              {...shared}
              label="Comment"
              people={TEAM}
              value={comment}
              onChange={setComment}
              hint="Type @ then a letter. Delete a mention and watch its id disappear."
            />
            <div className="emit">
              text → <b>{JSON.stringify(comment.text)}</b>
              <br />
              ids &nbsp;→ <b>{JSON.stringify(comment.ids)}</b>
            </div>
          </div>
        </div>

        {/* ---------------------------------------------------------- */}
        <h2>Validation — zero config</h2>
        <p className="note">
          No schema, no resolver, no form library. Rules are props. Errors stay silent
          until the first blur, then clear live the moment the value becomes valid.
        </p>

        <div className="grid">
          <div className="cell">
            <h3>mobileOnly</h3>
            <p className="sub">countries={"{"}["GB","US","IN"]{"}"}</p>
            <PhoneInput
              {...shared}
              label="Mobile"
              required
              mobileOnly
              defaultCountry="GB"
              countries={["GB", "US", "IN"]}
              hint="2071234567 is a landline; 7911123456 is a mobile."
            />
          </div>

          <div className="cell">
            <h3>positive + max</h3>
            <p className="sub">max={"{"}100000{"}"} · £1,000.00</p>
            <CurrencyInput
              {...shared}
              label="Budget"
              required
              positive
              max={100000}
              currency="GBP"
              locale="en-GB"
            />
          </div>

          <div className="cell">
            <h3>brands + notExpired</h3>
            <p className="sub">brands={"{"}["visa","mastercard"]{"}"}</p>
            <CardInput
              {...shared}
              label="Card"
              required
              brands={["visa", "mastercard"]}
              notExpired
              hint="Amex 3782 822463 10005 is rejected by name."
            />
          </div>

          <div className="cell">
            <h3>minContrast — warns, not errors</h3>
            <p className="sub">contrastAgainst="#FFFFFF" minContrast={"{"}4.5{"}"}</p>
            <ColorInput
              {...shared}
              label="Brand colour"
              defaultValue="#FFF9C4"
              contrastAgainst="#FFFFFF"
              minContrast={4.5}
              hint="Pale yellow on white: unreadable, so it warns."
            />
          </div>

          <div className="cell">
            <h3>minInterval</h3>
            <p className="sub">minInterval="5m"</p>
            <CronInput
              {...shared}
              label="Job schedule"
              required
              minInterval="5m"
              defaultValue="* * * * *"
              hint="Every minute is too often — this is the worker-queue guard."
            />
          </div>

          <div className="cell">
            <h3>minPrefix — the 0.0.0.0/0 guard</h3>
            <p className="sub">minPrefix={"{"}8{"}"} noPrivate</p>
            <IpInput
              {...shared}
              label="Public allow-list"
              required
              minPrefix={8}
              noPrivate
              defaultValue="0.0.0.0/0"
            />
          </div>

          <div className="cell">
            <h3>max as human text</h3>
            <p className="sub">max="100MB"</p>
            <FileSizeInput
              {...shared}
              label="Upload limit"
              required
              max="100MB"
              defaultValue={200_000_000}
              hint="The error quotes your units, not bytes."
            />
          </div>

          <div className="cell">
            <h3>maxMentions</h3>
            <p className="sub">maxMentions={"{"}2{"}"}</p>
            <MentionInput
              {...shared}
              label="Notify"
              people={TEAM}
              maxMentions={2}
              defaultValue={{ text: "@ada @grace @alan", ids: ["u1", "u2", "u3"] }}
              hint="Caps notification blast radius."
            />
          </div>

          <div className="cell">
            <h3>min + multipleOf</h3>
            <p className="sub">min="5m" multipleOf="5m"</p>
            <DurationInput {...shared} label="Poll interval" required min="5m" multipleOf="5m" />
          </div>
        </div>

        {/* ---------------------------------------------------------- */}
        <h2>Layouts</h2>
        <p className="note">
          Layout changes structure; variant changes surface. They compose freely — flip
          the variant in the bar above and every layout below follows.
        </p>

        <div className="grid">
          <div className="cell">
            <h3>Currency · display</h3>
            <p className="sub">layout="display"</p>
            <CurrencyInput {...shared} label="You pay" layout="display" defaultValue={123450} />
          </div>
          <div className="cell">
            <h3>Currency · stepper</h3>
            <p className="sub">layout="stepper"</p>
            <CurrencyInput
              {...shared}
              label="Monthly budget"
              layout="stepper"
              step={2500}
              defaultValue={25000}
            />
          </div>
          <div className="cell">
            <h3>Duration · segmented</h3>
            <p className="sub">layout="segmented"</p>
            <DurationInput
              {...shared}
              label="Timeout"
              layout="segmented"
              defaultValue={5445}
              hint="Arrows step and wrap at the unit boundary."
            />
          </div>
          <div className="cell">
            <h3>Duration · presets</h3>
            <p className="sub">layout="presets"</p>
            <DurationInput {...shared} label="Retention" layout="presets" defaultValue={1800} />
          </div>
          <div className="cell">
            <h3>Mention · rich</h3>
            <p className="sub">layout="rich"</p>
            <MentionInput
              {...shared}
              label="Comment"
              people={TEAM}
              layout="rich"
              hint="Type @ — avatar, team and role disambiguate duplicate names."
            />
          </div>
          <div className="cell">
            <h3>Card · single row</h3>
            <p className="sub">layout="single"</p>
            <CardInput {...shared} label="Card details" layout="single" />
          </div>
          <div className="cell" style={{ gridColumn: "span 2" }}>
            <h3>Cron · builder</h3>
            <p className="sub">layout="builder" — same value, no cron syntax required</p>
            <CronInput
              {...shared}
              label="Report schedule"
              layout="builder"
              defaultValue="0 9 * * 1-5"
            />
          </div>
        </div>

        {/* ---------------------------------------------------------- */}
        <h2>States</h2>
        <p className="note">
          Invalid styling applies only when the host sets <code>aria-invalid</code>. A
          component never decides on its own that it is in error.
        </p>

        <div className="grid">
          <div className="cell">
            <div className="stack">
              <MaskedInput {...shared} label="Default" mask={MASKS.dateUS} />
              <MaskedInput
                {...shared}
                label="With value"
                mask={MASKS.dateUS}
                defaultValue="04282026"
              />
              <MaskedInput
                {...shared}
                label="Disabled"
                mask={MASKS.dateUS}
                defaultValue="04282026"
                disabled
              />
              <MaskedInput
                {...shared}
                label="Read-only"
                mask={MASKS.dateUS}
                defaultValue="04282026"
                readOnly
              />
            </div>
          </div>

          <div className="cell">
            <div className="stack">
              <PhoneInput
                {...shared}
                label="Managed mode (form owns errors)"
                required
                aria-invalid
              />
              <ColorInput {...shared} label="Small" size="sm" defaultValue="#16A34A" />
              <ColorInput {...shared} label="Large" size="lg" defaultValue="#16A34A" />
              <IpInput {...shared} label="Disabled" defaultValue="10.0.0.0/24" disabled />
            </div>
          </div>
        </div>

        {/* ---------------------------------------------------------- */}
        <h2>Native form submission</h2>
        <p className="note">
          No React state involved. Submit and check the payload — a Server Action would
          receive exactly this. Not one formatted string reaches the server.
        </p>

        <form className="formcard" onSubmit={onSubmit}>
          <div className="stack">
            <PhoneInput {...shared} label="Phone" name="phone" defaultCountry="US" />
            <CurrencyInput {...shared} label="Amount" name="amount" defaultValue={4900} />
            <PercentInput {...shared} label="Discount" name="discount" defaultValue={0.1} />
            <DurationInput {...shared} label="Trial" name="trial" defaultValue={1_209_600} />
            <ColorInput {...shared} label="Accent" name="accent" defaultValue="#3A3FD6" />
            <CronInput {...shared} label="Digest" name="digest" defaultValue="0 9 * * 1" />
            <FileSizeInput {...shared} label="Upload cap" name="cap" defaultValue={26_214_400} />
            <IpInput {...shared} label="Allow from" name="cidr" defaultValue="10.0.0.0/8" />
            <MaskedInput {...shared} label="Tax ID" name="taxId" mask={MASKS.cpf} />
            <CardInput
              {...shared}
              label="Card"
              name="cc"
              expiryName="ccExp"
              cvcName="ccCvc"
            />
            <MentionInput {...shared} label="Note" name="note" people={TEAM} />
            <button className="submit" type="submit">
              Submit
            </button>
          </div>
          {submitted ? (
            <pre className="out">{JSON.stringify(submitted, null, 2)}</pre>
          ) : null}
        </form>
      </main>
    </>
  )
}
