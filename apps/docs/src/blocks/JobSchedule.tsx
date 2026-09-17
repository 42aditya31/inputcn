import { useState } from "react"

import { CronInput } from "@inputcn/cron"
import { DurationInput } from "@inputcn/duration"
import { FileSizeInput } from "@inputcn/filesize"
import { MentionInput, type MentionValue, type Person } from "@inputcn/mention"

const TEAM: Person[] = [
  { id: "u1", name: "Ada Lovelace", handle: "ada", detail: "Platform", badge: "On call" },
  { id: "u2", name: "Grace Hopper", handle: "grace", detail: "Data" },
  { id: "u3", name: "Alan Turing", handle: "alan", detail: "Infra" },
]

/**
 * No form library at all.
 *
 * Every rule here is a prop. There is no schema, no resolver and no onBlur
 * handler — the fields validate themselves, stay silent until the first blur,
 * and clear the moment the value becomes valid.
 */
export function JobSchedule() {
  const [sent, setSent] = useState<Record<string, unknown> | null>(null)

  return (
    <form
      className="stack"
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        const data = new FormData(e.currentTarget)
        setSent(Object.fromEntries(data.entries()))
      }}
    >
      <CronInput
        name="schedule"
        label="Run schedule"
        defaultValue="0 9 * * 1-5"
        required
        minInterval="5m"
        showUpcoming
        hint="Anything faster than every 5 minutes is refused."
      />

      <DurationInput
        name="timeout"
        label="Timeout"
        defaultValue={900}
        required
        min="30s"
        max="4h"
        multipleOf="30s"
        hint="Reads as a duration, stored as seconds."
      />

      <FileSizeInput
        name="artifactCap"
        label="Artifact size cap"
        defaultValue={104_857_600}
        required
        max="1 GB"
        hint="MB and MiB are different numbers here, on purpose."
      />

      <MentionInput
        name="notify"
        label="Notify on failure"
        people={TEAM}
        maxMentions={3}
        rows={3}
        hint="Type @ to pick. At most three people get paged."
      />

      <button type="submit" className="block-submit">
        Save schedule
      </button>

      {sent ? <output className="block-out">{JSON.stringify(sent, null, 2)}</output> : null}
    </form>
  )
}

/** Unused here, but this is the shape MentionInput emits: { text, ids }. */
export type NotifyValue = MentionValue
