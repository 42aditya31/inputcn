<div align="center">

# @inputcn/masked

**A mask that survives mid-string editing and paste.**

[![npm](https://img.shields.io/npm/v/%40inputcn%2Fmasked?style=flat-square&labelColor=09090b&color=cdf25c&label=npm)](https://www.npmjs.com/package/@inputcn/masked) [![license](https://img.shields.io/badge/license-MIT-a1a1aa?style=flat-square&labelColor=09090b)](https://github.com/42aditya31/inputcn/blob/main/LICENSE) [![types](https://img.shields.io/badge/types-included-a1a1aa?style=flat-square&labelColor=09090b)](https://input-cn.vercel.app/components/masked-input)

[Live demo](https://input-cn.vercel.app/components/masked-input) · [The contract](https://input-cn.vercel.app/docs/value-semantics) · [All 11 components](https://input-cn.vercel.app/components)

</div>

---

The generic mask, and the reason the rest of the library exists. Insert a digit in the middle of a formatted value and the caret stays where you put it.

The emitted value is the raw input — mask characters are presentation and never reach your state.

## Install

Recommended — copy the component source into your project, the way shadcn/ui does:

```bash
npx shadcn@latest add https://input-cn.vercel.app/r/masked-input.json
```

Or install the package and import it directly:

```bash
npm i @inputcn/masked
```

> [!NOTE]
> Either way, import the stylesheet once in your app root:
> ```ts
> import "@inputcn/core/styles.css"
> ```
> Every colour and radius resolves from the shadcn CSS variables you already define, so it matches your theme with no configuration.

## Usage

```tsx
import { MaskedInput, MASKS } from "@inputcn/masked"

<MaskedInput
  label="Tax ID"
  mask={MASKS.cpf}     // or "###.###.###-##"
  value={taxId}        // "12345678901" — no mask characters
  onChange={setTaxId}
  complete
/>
```

> [!IMPORTANT]
> `onChange` emits the **canonical value**, never the formatted string.
>
> | Type | Form | Example |
> |---|---|---|
> | `string` | raw, no mask characters | `"12345678901"` |
>
> Pass `name` and a hidden input carries that value, so `FormData` and Server Actions receive it too — with no client component.

## What makes it different

- **Tokens.** `#` digit, `A` letter, `*` alphanumeric. Everything else is a literal.
- **12 presets.** CPF, CNPJ, SSN, EIN, UK postcode, ISO/US/EU dates, licence keys and more.
- **Backspace skips separators.** Deleting removes the significant character to the left, not the punctuation next to it.

## Validation

Rules are props. No schema, no resolver, no `onBlur` handler. Errors stay silent until the first blur, then clear the moment the value becomes valid.

| Prop | Type | Description |
|---|---|---|
| `complete?` | `boolean` | Require every slot in the mask to be filled. |
| `minLength?` | `number` | — |
| `maxLength?` | `number` | — |
| `pattern?` | `RegExp` | Tested against the RAW (unmasked) value. |

Every error element carries a `data-rule` attribute naming the rule that failed, so tests assert the rule rather than the sentence.

A matching Zod schema ships from a separate entry point, so Zod never enters your component bundle:

```ts
import { maskedSchema } from "@inputcn/masked/schema"
```

## Props

| Prop | Type | Description |
|---|---|---|
| `mask` | `string` | Template. `#` digit, `A` letter, `*` alphanumeric, `\` escapes. e.g. `"###.###.###-##"`, `"##/##/####"`, `"AA-####"`. |
| `label?` | `ReactNode` | Visible label. Supply this or `aria-label` — a field with neither has no accessible name. |
| `hint?` | `ReactNode` | Helper text under the field. Replaced by the error message while one is showing. |
| `prefix?` | `ReactNode` | Rendered before the field, inside the border. |
| `suffix?` | `ReactNode` | Rendered after the field, inside the border. |

Plus the 23 props every inputcn component implements identically — `value`, `onChange`, `name`, `required`, `variant`, `size` and the rest. See [the props contract](https://input-cn.vercel.app/docs/props-contract).

## Accessibility

Keyboard complete, labelled, and errors announced once through `role="alert"` rather than on every keystroke. 50 axe-core checks run on every commit.

> [!CAUTION]
> Screen readers have **not** been verified yet. Until they are, this library is *structurally accessible, not screen-reader verified*. The full audit, including what is untested and why, is in [ACCESSIBILITY.md](https://github.com/42aditya31/inputcn/blob/main/ACCESSIBILITY.md).

---

<sub>Part of [inputcn](https://input-cn.vercel.app) — the inputs shadcn/ui doesn't ship. Not affiliated with or endorsed by shadcn.</sub>
