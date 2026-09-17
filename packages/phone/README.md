<div align="center">

# @inputcn/phone

**Searchable country selector, live formatting, E.164 out.**

[![npm](https://img.shields.io/npm/v/%40inputcn%2Fphone?style=flat-square&labelColor=09090b&color=cdf25c&label=npm)](https://www.npmjs.com/package/@inputcn/phone) [![license](https://img.shields.io/badge/license-MIT-a1a1aa?style=flat-square&labelColor=09090b)](https://github.com/42aditya31/inputcn/blob/main/LICENSE) [![types](https://img.shields.io/badge/types-included-a1a1aa?style=flat-square&labelColor=09090b)](https://input-cn.vercel.app/components/phone-input)

[Live demo](https://input-cn.vercel.app/components/phone-input) · [The contract](https://input-cn.vercel.app/docs/value-semantics) · [All 11 components](https://input-cn.vercel.app/components)

</div>

---

Pasting a number that starts with `+` switches the country and says so, with an undo. The country chip is an ISO code rather than a flag emoji, because Windows ships no glyphs for regional-indicator pairs and a flag degrades to two bare letters there.

## Install

Recommended — copy the component source into your project, the way shadcn/ui does:

```bash
npx shadcn@latest add https://input-cn.vercel.app/r/phone-input.json
```

Or install the package and import it directly:

```bash
npm i @inputcn/phone
```

> [!NOTE]
> Either way, import the stylesheet once in your app root:
> ```ts
> import "@inputcn/core/styles.css"
> ```
> Every colour and radius resolves from the shadcn CSS variables you already define, so it matches your theme with no configuration.

## Usage

```tsx
<PhoneInput
  label="Phone number"
  value={phone}        // "+442071234567" — always E.164
  onChange={setPhone}  // never the formatted string
  required
  mobileOnly
  countries={["GB", "US", "IN"]}
/>
```

> [!IMPORTANT]
> `onChange` emits the **canonical value**, never the formatted string.
>
> | Type | Form | Example |
> |---|---|---|
> | `string` | E.164 | `"+442071234567"` |
>
> Pass `name` and a hidden input carries that value, so `FormData` and Server Actions receive it too — with no client component.

## What makes it different

- **Trunk prefixes handled.** A UK number typed as `020 7123 4567` emits `+442071234567`. The leading zero is dropped before the length cap, not after.
- **Paste detection.** `+44 20 7123 4567` sets the value and the country together, and offers an undo.
- **Landline rejection.** `mobileOnly` checks the prefix, so `2071234567` is refused and `7911123456` is not.

## Validation

Rules are props. No schema, no resolver, no `onBlur` handler. Errors stay silent until the first blur, then clear the moment the value becomes valid.

| Prop | Type | Description |
|---|---|---|
| `countries?` | `readonly string[]` | Restrict the selector and reject numbers outside the list. |
| `mobileOnly?` | `boolean` | Reject numbers that look like landlines. |
| `defaultCountry?` | `string` | Country selected before the user picks one. Defaults to "US". |

Every error element carries a `data-rule` attribute naming the rule that failed, so tests assert the rule rather than the sentence.

A matching Zod schema ships from a separate entry point, so Zod never enters your component bundle:

```ts
import { phoneSchema } from "@inputcn/phone/schema"
```

## Props

| Prop | Type | Description |
|---|---|---|
| `label?` | `ReactNode` | Visible label. Supply this or `aria-label` — a field with neither has no accessible name. |
| `hint?` | `ReactNode` | Helper text under the field. Replaced by the error message while one is showing. |
| `renderCountry?` | `(api: {…}) => ReactNode` | Override the country trigger and popover. |

Plus the 23 props every inputcn component implements identically — `value`, `onChange`, `name`, `required`, `variant`, `size` and the rest. See [the props contract](https://input-cn.vercel.app/docs/props-contract).

> [!WARNING]
> Country data is hand-maintained for 18 countries. Accurate for those, but it is not libphonenumber and does not pretend to be. If you need all 250, wrap this component or open an issue.

## Accessibility

Keyboard complete, labelled, and errors announced once through `role="alert"` rather than on every keystroke. 50 axe-core checks run on every commit.

> [!CAUTION]
> Screen readers have **not** been verified yet. Until they are, this library is *structurally accessible, not screen-reader verified*. The full audit, including what is untested and why, is in [ACCESSIBILITY.md](https://github.com/42aditya31/inputcn/blob/main/ACCESSIBILITY.md).

---

<sub>Part of [inputcn](https://input-cn.vercel.app) — the inputs shadcn/ui doesn't ship. Not affiliated with or endorsed by shadcn.</sub>
