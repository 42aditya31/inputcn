# Props, generated from the source types

Every prop below is extracted from the interfaces the components actually
declare. **If a prop is not on this page, it does not exist** — do not use it.

Regenerate with `node scripts/build-skills.mjs`.

---

## Shared by all eleven components

| Prop | Type | Notes |
|---|---|---|
| `value` | `T` | Canonical value. Controlled mode. |
| `defaultValue` | `T` | Canonical value. Uncontrolled mode. Mutually exclusive with `value`. |
| `onChange` | `(value: T) => void` | Emits the canonical value — never a DOM event. |
| `onBlur` | `() => void` | Fires when focus leaves the whole component, not between its parts. |
| `name` | `string` | Applied to the hidden canonical input so FormData carries the real value. |
| `disabled` | `boolean` | — |
| `readOnly` | `boolean` | — |
| `required` | `boolean \| string` | — |
| `validate` | `(value: T) => true \| string` | Custom synchronous rule. Return true, or the message to display. |
| `messages` | `MessageMap` | Override built-in messages by rule name. |
| `showError` | `ShowError` | Default `"touched"`. |
| `onValidityChange` | `(state: ValidityState) => void` | Reports validity upward regardless of mode. |
| `mode` | `FieldMode` | Force a mode instead of auto-detecting. Escape hatch only. |
| `variant` | `FieldVariant` | Surface treatment. Default `"outline"`. |
| `size` | `FieldSize` | Density. Default `"default"` (32px). |
| `id` | `string` | — |
| `className` | `string` | — |
| `placeholder` | `string` | — |
| `autoFocus` | `boolean` | — |
| `aria-label` | `string` | — |
| `aria-labelledby` | `string` | — |
| `aria-describedby` | `string` | — |
| `aria-invalid` | `boolean \| "true" \| "false"` | — |

---

## PhoneInput

- **Package** `@inputcn/phone` · **Registry** `phone-input` · **Spec type** `phone`
- **Emits** `string` — E.164, e.g. `"+442071234567"`
- **Install** `npx shadcn@latest add https://input-cn.vercel.app/r/phone-input.json`

### Constraints (validation, declared as props)

| Prop | Type | Notes |
|---|---|---|
| `countries` | `readonly string[]` | Restrict the selector and reject numbers outside the list. |
| `mobileOnly` | `boolean` | Reject numbers that look like landlines. |
| `defaultCountry` | `string` | Country selected before the user picks one. Defaults to "US". |

### Other props

| Prop | Type | Notes |
|---|---|---|
| `label` | `ReactNode` | Visible label. Supply this or `aria-label` — a field with neither has no accessible name. |
| `hint` | `ReactNode` | Helper text under the field. Replaced by the error message while one is showing. |
| `renderCountry` | `(api: {…}) => ReactNode` | Override the country trigger and popover. |

### Zod companion

`import { ... } from "@inputcn/phone/schema"` accepts:

`country`, `countries`, `mobileOnly`, `allowEmpty`, `message`

Note this set is **not** the same as the constraint props above. A
constraint missing here is enforced by the component only.

---

## CurrencyInput

- **Package** `@inputcn/currency` · **Registry** `currency-input` · **Spec type** `currency`
- **Emits** `number` — integer minor units, e.g. `129900`
- **Install** `npx shadcn@latest add https://input-cn.vercel.app/r/currency-input.json`

### Constraints (validation, declared as props)

| Prop | Type | Notes |
|---|---|---|
| `min` | `number` | Minor units. |
| `max` | `number` | Minor units. |
| `positive` | `boolean` | — |
| `negative` | `boolean` | — |
| `nonZero` | `boolean` | — |
| `wholeUnitsOnly` | `boolean` | Reject fractional currency units (e.g. whole dollars only). |
| `multipleOf` | `number` | Minor units the value must be a multiple of. |

### Other props

| Prop | Type | Notes |
|---|---|---|
| `currency` | `string` | ISO 4217. Default "USD". |
| `locale` | `string` | BCP 47. Default "en-US". |
| `allowNegative` | `boolean` | Allow typing a negative value with "-". Default false. |
| `step` | `number` | Stepper increment in minor units. Default one whole unit. |
| `label` | `ReactNode` | Visible label. Supply this or `aria-label` — a field with neither has no accessible name. |
| `hint` | `ReactNode` | Helper text under the field. Replaced by the error message while one is showing. |
| `layout` | `CurrencyLayout` | PRD §6 layouts. `inline` is the default form-row shape. |
| `showCode` | `boolean` | Show the ISO code as a trailing affix. Default true. |

### Zod companion

`import { ... } from "@inputcn/currency/schema"` accepts:

`min`, `max`, `positive`, `nonZero`, `wholeUnitsOnly`, `currency`, `locale`, `message`

Note this set is **not** the same as the constraint props above. A
constraint missing here is enforced by the component only.

---

## MaskedInput

- **Package** `@inputcn/masked` · **Registry** `masked-input` · **Spec type** `masked`
- **Emits** `string` — raw, mask stripped, e.g. `"12345678901"`
- **Install** `npx shadcn@latest add https://input-cn.vercel.app/r/masked-input.json`

### Constraints (validation, declared as props)

| Prop | Type | Notes |
|---|---|---|
| `complete` | `boolean` | Require every slot in the mask to be filled. |
| `minLength` | `number` | — |
| `maxLength` | `number` | — |
| `pattern` | `RegExp` | Tested against the RAW (unmasked) value. |

### Other props

| Prop | Type | Notes |
|---|---|---|
| `mask` | `string` | Template. `#` digit, `A` letter, `*` alphanumeric, `\` escapes. e.g. `"###.###.###-##"`, `"##/##/####"`, `"AA-####"`. |
| `label` | `ReactNode` | Visible label. Supply this or `aria-label` — a field with neither has no accessible name. |
| `hint` | `ReactNode` | Helper text under the field. Replaced by the error message while one is showing. |
| `prefix` | `ReactNode` | Rendered before the field, inside the border. |
| `suffix` | `ReactNode` | Rendered after the field, inside the border. |

### Zod companion

`import { ... } from "@inputcn/masked/schema"` accepts:

`mask`, `complete`, `minLength`, `maxLength`, `pattern`, `allowEmpty`, `message`

Note this set is **not** the same as the constraint props above. A
constraint missing here is enforced by the component only.

---

## PercentInput

- **Package** `@inputcn/percent` · **Registry** `percent-input` · **Spec type** `percent`
- **Emits** `number` — fraction, e.g. `0.125`
- **Install** `npx shadcn@latest add https://input-cn.vercel.app/r/percent-input.json`

### Constraints (validation, declared as props)

| Prop | Type | Notes |
|---|---|---|
| `min` | `number` | As a fraction: 0.05 means 5%. |
| `max` | `number` | As a fraction: 1 means 100%. |
| `positive` | `boolean` | — |
| `integer` | `boolean` | Reject fractional percentages — 12% yes, 12.5% no. |
| `precision` | `number` | Maximum decimal places in the displayed percentage. Default 2. |

### Other props

| Prop | Type | Notes |
|---|---|---|
| `locale` | `string` | — |
| `label` | `ReactNode` | Visible label. Supply this or `aria-label` — a field with neither has no accessible name. |
| `hint` | `ReactNode` | Helper text under the field. Replaced by the error message while one is showing. |

### Zod companion

`import { ... } from "@inputcn/percent/schema"` accepts:

`min`, `max`, `positive`, `precision`, `message`

Note this set is **not** the same as the constraint props above. A
constraint missing here is enforced by the component only.

---

## CardInput

- **Package** `@inputcn/card` · **Registry** `card-input` · **Spec type** `card`
- **Emits** `string` — digits only, e.g. `"4242424242424242"`
- **Install** `npx shadcn@latest add https://input-cn.vercel.app/r/card-input.json`

### Constraints (validation, declared as props)

| Prop | Type | Notes |
|---|---|---|
| `brands` | `readonly CardBrand[]` | Restrict to the brands your PSP actually accepts. |
| `notExpired` | `boolean` | Reject a card whose expiry has passed. Requires an expiry value. |
| `requireCvc` | `boolean` | Require the CVC to be filled to the brand's length. |

### Other props

| Prop | Type | Notes |
|---|---|---|
| `expiry` | `string` | Expiry as typed, e.g. "04 / 28". Controlled separately from the number. |
| `defaultExpiry` | `string` | — |
| `onExpiryChange` | `(value: string) => void` | — |
| `cvc` | `string` | — |
| `defaultCvc` | `string` | — |
| `onCvcChange` | `(value: string) => void` | — |
| `label` | `ReactNode` | Visible label. Supply this or `aria-label` — a field with neither has no accessible name. |
| `hint` | `ReactNode` | Helper text under the field. Replaced by the error message while one is showing. |
| `layout` | `CardLayout` | `stacked` is three fields; `single` is one row, Stripe-style. |
| `expiryName` | `string` | Field names for native submission. |
| `cvcName` | `string` | — |

### Zod companion

`import { ... } from "@inputcn/card/schema"` accepts:

`brands`, `allowEmpty`, `message`

Note this set is **not** the same as the constraint props above. A
constraint missing here is enforced by the component only.

---

## DurationInput

- **Package** `@inputcn/duration` · **Registry** `duration-input` · **Spec type** `duration`
- **Emits** `number` — seconds, e.g. `5400`
- **Install** `npx shadcn@latest add https://input-cn.vercel.app/r/duration-input.json`

### Constraints (validation, declared as props)

| Prop | Type | Notes |
|---|---|---|
| `min` | `DurationBound` | — |
| `max` | `DurationBound` | — |
| `multipleOf` | `DurationBound` | Must be a whole multiple of this. Accepts "15m". |
| `maxUnit` | `DurationUnit` | Largest unit shown when formatting. Default "d". |

### Other props

| Prop | Type | Notes |
|---|---|---|
| `bareUnit` | `DurationUnit` | What a bare number means. Default "m". |
| `presets` | `readonly string[]` | Presets offered by the `presets` layout. |
| `label` | `ReactNode` | Visible label. Supply this or `aria-label` — a field with neither has no accessible name. |
| `hint` | `ReactNode` | Helper text under the field. Replaced by the error message while one is showing. |
| `layout` | `DurationLayout` | PRD §6. `text` is fastest for keyboard users; `segmented` is unambiguous. |
| `showNormalised` | `boolean` | Show the normalised value as a trailing affix. Default true. |

### Zod companion

`import { ... } from "@inputcn/duration/schema"` accepts:

`min`, `max`, `multipleOf`, `bareUnit`, `message`

Note this set is **not** the same as the constraint props above. A
constraint missing here is enforced by the component only.

---

## ColorInput

- **Package** `@inputcn/color` · **Registry** `color-input` · **Spec type** `color`
- **Emits** `string` — hex, e.g. `"#CDF25C"`
- **Install** `npx shadcn@latest add https://input-cn.vercel.app/r/color-input.json`

### Constraints (validation, declared as props)

| Prop | Type | Notes |
|---|---|---|
| `contrastAgainst` | `string` | Check contrast against this colour. The differentiating constraint: it stops a customer picking a brand colour nobody can read. |
| `minContrast` | `number` | Minimum WCAG ratio. 4.5 is AA for body text, 3 is AA for large text. |
| `allowed` | `readonly string[]` | Restrict to a palette. |

### Other props

| Prop | Type | Notes |
|---|---|---|
| `outputFormat` | `ColorFormat` | Output format for `onChange`. Default "hex" — the only lossless one. |
| `swatches` | `readonly string[]` | Palette shown beneath the field. |
| `label` | `ReactNode` | Visible label. Supply this or `aria-label` — a field with neither has no accessible name. |
| `hint` | `ReactNode` | Helper text under the field. Replaced by the error message while one is showing. |
| `nativePicker` | `boolean` | Show the native OS picker alongside the text field. Default true. |
| `showSwatches` | `boolean` | Show the swatch palette. Default true. |
| `showContrast` | `boolean` | Show the live contrast reading when `contrastAgainst` is set. Default true. |

### Zod companion

`import { ... } from "@inputcn/color/schema"` accepts:

`contrastAgainst`, `minContrast`, `allowed`, `allowEmpty`, `message`

Note this set is **not** the same as the constraint props above. A
constraint missing here is enforced by the component only.

---

## CronInput

- **Package** `@inputcn/cron` · **Registry** `cron-input` · **Spec type** `cron`
- **Emits** `string` — expression, e.g. `"0 9 * * 1-5"`
- **Install** `npx shadcn@latest add https://input-cn.vercel.app/r/cron-input.json`

### Constraints (validation, declared as props)

| Prop | Type | Notes |
|---|---|---|
| `minInterval` | `IntervalBound` | Reject schedules that fire more often than this. The constraint that earns its keep — it stops someone scheduling a job every second and taking down a worker queue. |

### Other props

| Prop | Type | Notes |
|---|---|---|
| `previewCount` | `number` | How many upcoming runs to compute for the preview. Default 3. |
| `label` | `ReactNode` | Visible label. Supply this or `aria-label` — a field with neither has no accessible name. |
| `hint` | `ReactNode` | Helper text under the field. Replaced by the error message while one is showing. |
| `layout` | `CronLayout` | `expression` for engineers, `builder` for everyone else. |
| `showDescription` | `boolean` | Show the plain-English reading. Default true. |
| `showUpcoming` | `boolean` | Show upcoming run times. Default true. |

### Zod companion

`import { ... } from "@inputcn/cron/schema"` accepts:

`minInterval`, `allowEmpty`, `message`

Note this set is **not** the same as the constraint props above. A
constraint missing here is enforced by the component only.

---

## FileSizeInput

- **Package** `@inputcn/filesize` · **Registry** `filesize-input` · **Spec type** `filesize`
- **Emits** `number` — bytes, e.g. `1048576`
- **Install** `npx shadcn@latest add https://input-cn.vercel.app/r/filesize-input.json`

### Constraints (validation, declared as props)

| Prop | Type | Notes |
|---|---|---|
| `min` | `SizeBound` | — |
| `max` | `SizeBound` | — |

### Other props

| Prop | Type | Notes |
|---|---|---|
| `binary` | `boolean` | Use KiB/MiB/GiB and read ambiguous units as powers of 1024. Default false. |
| `bareUnit` | `string` | Unit assumed when the user types a bare number. Default "MB". |
| `precision` | `number` | Decimals when formatting. Default 2. |
| `locale` | `string` | Grouping locale for the raw byte readout. Default "en-US". |
| `label` | `ReactNode` | Visible label. Supply this or `aria-label` — a field with neither has no accessible name. |
| `hint` | `ReactNode` | Helper text under the field. Replaced by the error message while one is showing. |
| `showBytes` | `boolean` | Show the raw byte count as a trailing affix. Default true. |

### Zod companion

`import { ... } from "@inputcn/filesize/schema"` accepts:

`min`, `max`, `binary`, `message`

Note this set is **not** the same as the constraint props above. A
constraint missing here is enforced by the component only.

---

## IpInput

- **Package** `@inputcn/ip` · **Registry** `ip-input` · **Spec type** `ip`
- **Emits** `string` — address or CIDR, e.g. `"10.0.0.0/24"`
- **Install** `npx shadcn@latest add https://input-cn.vercel.app/r/ip-input.json`

### Constraints (validation, declared as props)

| Prop | Type | Notes |
|---|---|---|
| `noPrivate` | `boolean` | Reject RFC 1918 private ranges. |
| `noLoopback` | `boolean` | Reject 127.0.0.0/8. |
| `noMulticast` | `boolean` | Reject 224.0.0.0/4. |
| `minPrefix` | `number` | Smallest prefix allowed. `minPrefix={8}` rejects /0 through /7. The constraint that earns its keep: it stops an admin allow-listing 0.0.0.0/0 by accident. |
| `maxPrefix` | `number` | Largest prefix allowed. `maxPrefix={24}` rejects /25 and narrower. |
| `requirePrefix` | `boolean` | Require an explicit /n suffix. |

### Other props

| Prop | Type | Notes |
|---|---|---|
| `label` | `ReactNode` | Visible label. Supply this or `aria-label` — a field with neither has no accessible name. |
| `hint` | `ReactNode` | Helper text under the field. Replaced by the error message while one is showing. |
| `showRange` | `boolean` | Show the computed host range for a CIDR block. Default true. |

### Zod companion

`import { ... } from "@inputcn/ip/schema"` accepts:

`noPrivate`, `noLoopback`, `noMulticast`, `minPrefix`, `maxPrefix`, `requirePrefix`, `allowEmpty`, `message`

Note this set is **not** the same as the constraint props above. A
constraint missing here is enforced by the component only.

---

## MentionInput

- **Package** `@inputcn/mention` · **Registry** `mention-input` · **Spec type** `mention`
- **Emits** `object` — { text, ids }, e.g. `{ text: "hi @ada", ids: ["u1"] }`
- **Install** `npx shadcn@latest add https://input-cn.vercel.app/r/mention-input.json`

### Constraints (validation, declared as props)

| Prop | Type | Notes |
|---|---|---|
| `maxLength` | `number` | — |
| `minMentions` | `number` | — |
| `maxMentions` | `number` | Caps notification blast radius. |

### Other props

| Prop | Type | Notes |
|---|---|---|
| `people` | `readonly Person[]` | — |
| `limit` | `number` | Suggestions shown at once. Default 8. |
| `label` | `ReactNode` | Visible label. Supply this or `aria-label` — a field with neither has no accessible name. |
| `hint` | `ReactNode` | Helper text under the field. Replaced by the error message while one is showing. |
| `layout` | `MentionLayout` | `compact` fits more people on screen; `rich` disambiguates duplicate names. |
| `rows` | `number` | — |

### Zod companion

`import { ... } from "@inputcn/mention/schema"` accepts:

`maxLength`, `minMentions`, `maxMentions`, `allowEmpty`, `message`

Note this set is **not** the same as the constraint props above. A
constraint missing here is enforced by the component only.

---
