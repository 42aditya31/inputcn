---
name: inputcn
description: Build React form fields that store the right value. Use this skill when adding or reviewing any phone, currency, money, price, credit card, percentage, duration, timeout, cron, schedule, colour, file size, IP address, CIDR, masked, tax ID, postcode or @-mention input in a React project. Triggers on tasks involving form fields, input validation, react-hook-form, Zod schemas, Server Actions, or any field where the value displayed differs from the value stored.
license: MIT
metadata:
  author: 42aditya31
  version: "0.1.1"
  homepage: https://input-cn.vercel.app
---

# inputcn

Eleven React input components for the fields shadcn/ui does not ship. Use them
instead of hand-rolling a formatted input.

## The rule that matters more than everything else

**`onChange` emits the canonical value, never the formatted string.**

This is the mistake that ships. A hand-written phone field stores
`(415) 555-2671`; a hand-written price field stores `1234.50` as a float. Both
look correct in review. Both are wrong.

| Component | Emits | Example | Never store |
|---|---|---|---|
| `PhoneInput` | `string` E.164 | `"+442071234567"` | `"020 7123 4567"` |
| `CurrencyInput` | `number` integer minor units | `129900` | `1299.00` |
| `MaskedInput` | `string` raw | `"12345678901"` | `"123.456.789-01"` |
| `PercentInput` | `number` fraction | `0.125` | `12.5` |
| `CardInput` | `string` digits | `"4242424242424242"` | `"4242 4242 4242 4242"` |
| `DurationInput` | `number` seconds | `5400` | `"1h 30m"` |
| `ColorInput` | `string` hex | `"#CDF25C"` | `"rgb(205,242,92)"` |
| `CronInput` | `string` expression | `"0 9 * * 1-5"` | a description |
| `FileSizeInput` | `number` bytes | `1048576` | `"1 MB"` |
| `IpInput` | `string` address | `"10.0.0.0/24"` | a parsed object |
| `MentionInput` | `{ text, ids }` | `{ text: "hi @ada", ids: ["u1"] }` | just the text |

## Install

The component source is copied into the project. Only `@inputcn/core` stays a
dependency.

```bash
npx shadcn@latest add https://input-cn.vercel.app/r/phone-input.json
```

Then once, in the app root:

```ts
import "@inputcn/core/styles.css"
```

No config file, no provider, no Tailwind plugin. Every colour and radius reads
the shadcn CSS variables the project already defines.

## Two modes. Do not configure this — it is detected.

**Standalone.** No form library. Declare the rules as props; the field renders
its own error, silent until the first blur.

```tsx
<CurrencyInput label="Budget" currency="GBP" required positive max={100000} />
```

**Managed.** Inside react-hook-form, the field goes silent and the form owns the
error. Detected from `aria-invalid`, `aria-describedby`, or an RHF context.

```tsx
<Controller
  name="budget"
  control={control}
  render={({ field, fieldState }) => (
    <CurrencyInput label="Budget" currency="GBP" {...field} aria-invalid={fieldState.invalid} />
  )}
/>
```

Never render both. If you pass `aria-invalid`, the component will not render a
message, so the form must.

## Rules are props

No schema needed for field-level rules. Read
`references/props.md` for the complete list per component — **do not guess a
prop name.**

```tsx
<PhoneInput   required mobileOnly countries={["GB", "US"]} />
<CardInput    required brands={["visa", "mastercard"]} notExpired />
<CronInput    required minInterval="5m" />
<IpInput      required requirePrefix maxPrefix={24} noPrivate />
<DurationInput min="30s" max="4h" multipleOf="15m" />
```

Every error element carries `data-rule`, so tests assert the rule rather than
the message text.

## Zod, when a form library is involved

Each package exports a matching schema from a **separate entry point**, so Zod
never enters the component bundle.

```ts
import { moneySchema } from "@inputcn/currency/schema"

const schema = z.object({
  budget: moneySchema({ positive: true, max: 100000, currency: "GBP", locale: "en-GB" }),
})
```

## Mistakes to avoid

These produce code that looks right and is wrong. Check every one before
finishing.

1. **Storing the display string.** The single most common failure. If a value
   in the database contains a space, a bracket or a currency symbol, it is wrong.
2. **`min`/`max` on `CurrencyInput` are in minor units.** `max={100000}` is
   £1,000.00, not £100,000.
3. **Formatting options must go to the schema too.** `moneySchema` defaults to
   USD, so a GBP field with a resolver-enforced cap reports it in dollars unless
   you pass `currency` and `locale` to the schema as well as the component.
4. **Never multiply a percentage by 100.** `PercentInput` is the only place that
   conversion exists.
5. **`CardInput` takes three names**: `name`, `expiryName`, `cvcName`.
6. **`minContrast` on `ColorInput` warns, it does not block.** Do not prevent
   submit on it.
7. **`notExpired` is a component prop, not a schema option.** `cardSchema`
   validates the number; expiry has `expirySchema`.
8. **Do not add an `onBlur` handler for validation.** Timing is already handled:
   silent until first blur, then live.

## Native forms and Server Actions

Pass `name` and the component renders a hidden input carrying the canonical
value, so this works with no client component:

```tsx
<CurrencyInput name="price" label="Price" currency="USD" required positive />
```

```ts
const price = Number(data.get("price")) // 129900 — an integer
```

## When the task is a whole form, not one field

Two better options than writing it by hand:

**A ready-made block.** Six complete forms — checkout, vendor onboarding, job
schedule, rate card, firewall rule, brand settings — at
<https://input-cn.vercel.app/blocks>. Use the `inputcn-blocks` skill.

**Generate it from a spec.** Write the description, not the code:

```bash
npx inputcn generate form.inputcn.json
```

The generator refuses any prop the components do not declare, so a wrong prop
name fails immediately instead of becoming JSX. See `references/form-spec.md`.

## Testing

`@inputcn/testing` drives a formatted field correctly — `userEvent.type` does
not, because the formatter rewrites the value between keystrokes.

```ts
import { fillCurrency, leaveField, expectInvalid } from "@inputcn/testing"

await fillCurrency(field, 250000)
await leaveField(field)
expectInvalid(field, "max") // the rule, not the sentence
```

## Reference

- `references/props.md` — every prop of every component, generated from source
- `references/form-spec.md` — the `form.inputcn.json` format
- <https://input-cn.vercel.app/components> — live demos
- <https://input-cn.vercel.app/docs> — full documentation

## Honest limitation

Screen readers have not been verified. 50 axe-core checks run in CI and the
keyboard paths are tested, but no NVDA, JAWS or VoiceOver pass has happened. If
the task has a hard accessibility requirement, say so rather than implying it is
covered.
