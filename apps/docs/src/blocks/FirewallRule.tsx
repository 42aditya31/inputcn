import { useState } from "react"

import { ColorInput } from "@inputcn/color"
import { DurationInput } from "@inputcn/duration"
import { IpInput } from "@inputcn/ip"

/**
 * Standalone mode again, and the constraints are the whole feature: maxPrefix
 * is what stops somebody allow-listing the entire internet at 2am.
 */
export function FirewallRule() {
  const [sent, setSent] = useState<Record<string, unknown> | null>(null)

  return (
    <form
      className="stack"
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        setSent(Object.fromEntries(new FormData(e.currentTarget).entries()))
      }}
    >
      <IpInput
        name="source"
        label="Source range"
        defaultValue="10.0.0.0/24"
        required
        requirePrefix
        maxPrefix={16}
        showRange
        hint="A /16 or tighter. 0.0.0.0/0 is refused by maxPrefix."
      />

      <IpInput
        name="destination"
        label="Destination"
        required
        noMulticast
        hint="Paste a whole log line — the address is extracted from it."
      />

      <DurationInput
        name="ttl"
        label="Rule expires in"
        defaultValue={86_400}
        required
        min="1h"
        max="30d"
        hint="Temporary by default. Permanent rules are how allowlists rot."
      />

      <ColorInput
        name="tag"
        label="Dashboard tag"
        defaultValue="#CDF25C"
        contrastAgainst="#0A0A0E"
        minContrast={4.5}
        hint="Warns on unreadable colours rather than blocking them."
      />

      <button type="submit" className="block-submit">
        Add rule
      </button>

      {sent ? <output className="block-out">{JSON.stringify(sent, null, 2)}</output> : null}
    </form>
  )
}
