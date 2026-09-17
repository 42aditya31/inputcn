import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { CardInput } from "@inputcn/card"
import { cardSchema } from "@inputcn/card/schema"
import { CurrencyInput } from "@inputcn/currency"
import { moneySchema } from "@inputcn/currency/schema"
import { PhoneInput } from "@inputcn/phone"
import { phoneSchema } from "@inputcn/phone/schema"

const schema = z.object({
  card: cardSchema({ brands: ["visa", "mastercard", "amex"] }),
  phone: phoneSchema({ countries: ["GB", "US", "IN"] }),
  tip: moneySchema({ min: 0, max: 50_000, currency: "GBP", locale: "en-GB" }),
})

type Values = z.infer<typeof schema>

export function Checkout() {
  const [paid, setPaid] = useState<Values | null>(null)

  const { control, handleSubmit } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { card: "", phone: "", tip: 0 },
  })

  return (
    <form onSubmit={handleSubmit(setPaid)} className="stack" noValidate>
      <Controller
        name="card"
        control={control}
        render={({ field, fieldState }) => (
          <CardInput
            label="Card details"
            {...field}
            aria-invalid={fieldState.invalid}
            hint="Visa, Mastercard and Amex. Grouping reflows per brand."
          />
        )}
      />

      <Controller
        name="phone"
        control={control}
        render={({ field, fieldState }) => (
          <PhoneInput
            label="Phone for receipts"
            defaultCountry="GB"
            countries={["GB", "US", "IN"]}
            {...field}
            aria-invalid={fieldState.invalid}
          />
        )}
      />

      <Controller
        name="tip"
        control={control}
        render={({ field, fieldState }) => (
          <CurrencyInput
            label="Add a tip"
            currency="GBP"
            locale="en-GB"
            layout="stepper"
            step={100}
            {...field}
            aria-invalid={fieldState.invalid}
          />
        )}
      />

      <button type="submit" className="block-submit">
        Pay £24.00
      </button>

      {paid ? (
        <output className="block-out">
          {JSON.stringify(paid, null, 2)}
        </output>
      ) : null}
    </form>
  )
}
