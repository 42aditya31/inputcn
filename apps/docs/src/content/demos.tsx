import { useState, type ReactNode } from "react"

import { CardInput } from "@inputcn/card"
import { ColorInput } from "@inputcn/color"
import { CronInput } from "@inputcn/cron"
import { CurrencyInput } from "@inputcn/currency"
import { DurationInput } from "@inputcn/duration"
import { FileSizeInput } from "@inputcn/filesize"
import { IpInput } from "@inputcn/ip"
import { MASKS, MaskedInput } from "@inputcn/masked"
import { MentionInput, type MentionValue } from "@inputcn/mention"
import { PercentInput } from "@inputcn/percent"
import { PhoneInput } from "@inputcn/phone"

import { TEAM } from "../data.js"

/**
 * The demos on every component page.
 *
 * Each one renders the real component and prints the value `onChange`
 * actually emitted underneath it. That readout is the entire argument the
 * site is making, so it is never faked or formatted for looks.
 */

function Readout({ value, note }: { value: ReactNode; note?: ReactNode }) {
  return (
    <p className="demo-val">
      value = <b>{value}</b>
      {note ? <> · {note}</> : null}
    </p>
  )
}

export function PhoneDemo() {
  const [v, setV] = useState("")
  return (
    <>
      <PhoneInput
        label="Phone number"
        value={v}
        onChange={setV}
        hint="Paste +44 20 7123 4567 — the country switches with it."
      />
      <Readout value={JSON.stringify(v)} note="E.164" />
    </>
  )
}

export function CurrencyDemo() {
  const [v, setV] = useState(0)
  return (
    <>
      <CurrencyInput
        label="Amount"
        value={v}
        onChange={setV}
        hint="Digits fill from the right, like a register."
      />
      <Readout value={v} note="minor units" />
    </>
  )
}

const MASK_CHOICES = [
  ["CPF", MASKS.cpf],
  ["CNPJ", MASKS.cnpj],
  ["SSN", MASKS.ssn],
  ["Postcode", MASKS.ukPostcode],
] as const

export function MaskedDemo() {
  const [i, setI] = useState(0)
  const [v, setV] = useState("")
  const choice = MASK_CHOICES[i] ?? MASK_CHOICES[0]

  return (
    <>
      <MaskedInput
        key={choice[0]}
        label="Structured value"
        mask={choice[1]}
        value={v}
        onChange={setV}
        hint="Click into the middle and type — the caret holds."
      />
      <div className="demo-row">
        {MASK_CHOICES.map(([label], idx) => (
          <button
            key={label}
            type="button"
            aria-pressed={idx === i}
            onClick={() => {
              setI(idx)
              setV("")
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <Readout value={JSON.stringify(v)} note="raw, no mask characters" />
    </>
  )
}

export function PercentDemo() {
  const [v, setV] = useState(0)
  return (
    <>
      <PercentInput label="Discount rate" value={v} onChange={setV} hint="Shows 12.5, emits 0.125." />
      <Readout value={v} note="fraction" />
    </>
  )
}

export function CardDemo() {
  const [v, setV] = useState("")
  return (
    <>
      <CardInput
        label="Card details"
        value={v}
        onChange={setV}
        hint="Try 4242… then 3782… — the grouping reflows to 4-6-5."
      />
      <Readout value={JSON.stringify(v)} note="digits only" />
    </>
  )
}

export function DurationDemo() {
  const [v, setV] = useState(0)
  return (
    <>
      <DurationInput
        label="Session timeout"
        value={v}
        onChange={setV}
        hint="90m, 1:30 and 1.5h all land on the same number."
      />
      <Readout value={v} note="seconds" />
    </>
  )
}

export function ColorDemo() {
  const [v, setV] = useState("#CDF25C")
  return (
    <>
      <ColorInput
        label="Brand colour"
        value={v}
        onChange={setV}
        contrastAgainst="#FFFFFF"
        hint="Paste rgb(205, 242, 92) — it converts."
      />
      <Readout value={v} note="hex" />
    </>
  )
}

export function CronDemo() {
  const [v, setV] = useState("0 9 * * 1-5")
  return (
    <>
      <CronInput label="Schedule" value={v} onChange={setV} hint="Try */15 * * * * or @daily." />
      <Readout value={JSON.stringify(v)} />
    </>
  )
}

export function FileSizeDemo() {
  const [v, setV] = useState(0)
  return (
    <>
      <FileSizeInput
        label="Upload limit"
        value={v}
        onChange={setV}
        hint="1 MB and 1 MiB differ by 4.9%. Try both."
      />
      <Readout value={v} note="bytes" />
    </>
  )
}

export function IpDemo() {
  const [v, setV] = useState("")
  return (
    <>
      <IpInput
        label="Allowed range"
        value={v}
        onChange={setV}
        hint="Try 10.0.0.0/24, or paste a whole log line."
      />
      <Readout value={JSON.stringify(v)} />
    </>
  )
}

export function MentionDemo() {
  const [v, setV] = useState<MentionValue>({ text: "", ids: [] })
  return (
    <>
      <MentionInput
        label="Comment"
        people={TEAM}
        value={v}
        onChange={setV}
        hint="Type @ then a letter. Delete a mention and its id goes with it."
      />
      <Readout value={JSON.stringify(v.text)} note={<>ids {JSON.stringify(v.ids)}</>} />
    </>
  )
}
