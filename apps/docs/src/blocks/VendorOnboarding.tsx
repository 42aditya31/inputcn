import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { CurrencyInput } from "@inputcn/currency"
import { moneySchema } from "@inputcn/currency/schema"
import { IpInput } from "@inputcn/ip"
import { cidrSchema } from "@inputcn/ip/schema"
import { MASKS, MaskedInput } from "@inputcn/masked"
import { maskedSchema } from "@inputcn/masked/schema"
import { PhoneInput } from "@inputcn/phone"
import { phoneSchema } from "@inputcn/phone/schema"

const schema = z.object({
  phone: phoneSchema({ mobileOnly: true, countries: ["GB", "US"] }),
  taxId: maskedSchema({ mask: MASKS.cpf, complete: true }),
  // Minor units: this cap is £10,000.00, and the currency has to be given to
  // the schema too or the message formats in dollars.
  budget: moneySchema({ positive: true, max: 1_000_000, currency: "GBP", locale: "en-GB" }),
  allowlist: cidrSchema({ requirePrefix: true, maxPrefix: 24, noPrivate: false }),
})

type Values = z.infer<typeof schema>

export function VendorOnboarding() {
  const [saved, setSaved] = useState<Values | null>(null)

  const { control, handleSubmit } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { phone: "", taxId: "", budget: 0, allowlist: "" },
  })

  return (
    <form onSubmit={handleSubmit(setSaved)} className="stack" noValidate>
      <Controller
        name="phone"
        control={control}
        render={({ field, fieldState }) => (
          <PhoneInput
            label="Contact mobile"
            defaultCountry="GB"
            countries={["GB", "US"]}
            {...field}
            aria-invalid={fieldState.invalid}
            hint="Landlines are rejected — this is the number we text."
          />
        )}
      />

      <Controller
        name="taxId"
        control={control}
        render={({ field, fieldState }) => (
          <MaskedInput
            label="Tax ID"
            mask={MASKS.cpf}
            {...field}
            aria-invalid={fieldState.invalid}
          />
        )}
      />

      <Controller
        name="budget"
        control={control}
        render={({ field, fieldState }) => (
          <CurrencyInput
            label="Monthly spend cap"
            currency="GBP"
            locale="en-GB"
            {...field}
            aria-invalid={fieldState.invalid}
            hint="Up to £10,000.00 a month."
          />
        )}
      />

      <Controller
        name="allowlist"
        control={control}
        render={({ field, fieldState }) => (
          <IpInput
            label="API allowlist"
            {...field}
            aria-invalid={fieldState.invalid}
            hint="A /24 or tighter. 0.0.0.0/0 is refused."
          />
        )}
      />

      <button type="submit" className="block-submit">
        Create vendor
      </button>

      {saved ? <output className="block-out">{JSON.stringify(saved, null, 2)}</output> : null}
    </form>
  )
}
