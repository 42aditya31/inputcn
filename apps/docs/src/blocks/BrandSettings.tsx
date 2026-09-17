import { useState } from "react"

import { ColorInput } from "@inputcn/color"
import { FileSizeInput } from "@inputcn/filesize"
import { MASKS, MaskedInput } from "@inputcn/masked"
import { PhoneInput } from "@inputcn/phone"

/**
 * A settings page. Mixed modes on purpose: the colour field warns rather than
 * blocks, so the form still submits with a poor contrast ratio.
 */
export function BrandSettings() {
  const [saved, setSaved] = useState<Record<string, unknown> | null>(null)

  return (
    <form
      className="stack"
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        setSaved(Object.fromEntries(new FormData(e.currentTarget).entries()))
      }}
    >
      <ColorInput
        name="brand"
        label="Brand colour"
        defaultValue="#FFF9C4"
        contrastAgainst="#FFFFFF"
        minContrast={4.5}
        swatches={["#CDF25C", "#3A3FD6", "#DC2626", "#0F7A45"]}
        hint="Pale yellow on white is legal and unreadable, so this warns."
      />

      <FileSizeInput
        name="uploadCap"
        label="Upload limit"
        defaultValue={26_214_400}
        required
        max="100 MB"
        binary={false}
        hint="MB is 1000 squared here. Your storage bill agrees."
      />

      <PhoneInput
        name="support"
        label="Support number"
        defaultCountry="GB"
        hint="Shown to customers. Stored as E.164."
      />

      <MaskedInput
        name="postcode"
        label="Billing postcode"
        mask={MASKS.ukPostcode}
        complete
        hint="Caret holds when you edit the middle."
      />

      <button type="submit" className="block-submit">
        Save settings
      </button>

      {saved ? <output className="block-out">{JSON.stringify(saved, null, 2)}</output> : null}
    </form>
  )
}
