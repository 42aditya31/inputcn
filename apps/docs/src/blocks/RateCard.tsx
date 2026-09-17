import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { CurrencyInput } from "@inputcn/currency"
import { moneySchema } from "@inputcn/currency/schema"
import { DurationInput } from "@inputcn/duration"
import { durationSchema } from "@inputcn/duration/schema"
import { PercentInput } from "@inputcn/percent"
import { percentSchema } from "@inputcn/percent/schema"

const schema = z.object({
  rate: moneySchema({ positive: true, currency: "EUR", locale: "de-DE" }),
  discount: percentSchema({ min: 0, max: 0.4, precision: 2 }),
  minimum: durationSchema({ min: 900, multipleOf: 900 }),
})

type Values = z.infer<typeof schema>

/** Three numeric fields, three different canonical types. That is the point. */
export function RateCard() {
  const [saved, setSaved] = useState<Values | null>(null)

  const { control, handleSubmit } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { rate: 12000, discount: 0.1, minimum: 1800 },
  })

  return (
    <form onSubmit={handleSubmit(setSaved)} className="stack" noValidate>
      <Controller
        name="rate"
        control={control}
        render={({ field, fieldState }) => (
          <CurrencyInput
            label="Hourly rate"
            currency="EUR"
            locale="de-DE"
            layout="display"
            {...field}
            aria-invalid={fieldState.invalid}
            hint="Emits 12000 — integer cents, never 120.00 as a float."
          />
        )}
      />

      <Controller
        name="discount"
        control={control}
        render={({ field, fieldState }) => (
          <PercentInput
            label="Retainer discount"
            {...field}
            aria-invalid={fieldState.invalid}
            hint="Shows 10, emits 0.1. Capped at 40%."
          />
        )}
      />

      <Controller
        name="minimum"
        control={control}
        render={({ field, fieldState }) => (
          <DurationInput
            label="Minimum billable"
            layout="presets"
            {...field}
            aria-invalid={fieldState.invalid}
            hint="Quarter-hour increments, stored as seconds."
          />
        )}
      />

      <button type="submit" className="block-submit">
        Save rate card
      </button>

      {saved ? <output className="block-out">{JSON.stringify(saved, null, 2)}</output> : null}
    </form>
  )
}
