<div align="center">

# @inputcn/testing

**Drive an inputcn field from a test the way a user would.**

[![npm](https://img.shields.io/npm/v/%40inputcn%2Ftesting?style=flat-square&labelColor=09090b&color=cdf25c&label=npm)](https://www.npmjs.com/package/@inputcn/testing) [![license](https://img.shields.io/badge/license-MIT-a1a1aa?style=flat-square&labelColor=09090b)](https://github.com/42aditya31/inputcn/blob/main/LICENSE) [![types](https://img.shields.io/badge/types-included-a1a1aa?style=flat-square&labelColor=09090b)](https://input-cn.vercel.app)

[Documentation](https://input-cn.vercel.app/docs) · [The contract](https://input-cn.vercel.app/docs/value-semantics) · [All 11 components](https://input-cn.vercel.app/components)

</div>

---

Typing into a masked field from a test is its own small nightmare. These helpers do it properly — keystroke by keystroke, through the component's own handlers.

## Install

```bash
npm i @inputcn/testing
```

## Usage

```tsx
import { fillCurrency, leaveField, expectInvalid } from "@inputcn/testing"

it("rejects a budget over the cap", async () => {
  const { field } = renderField(<CurrencyInput label="Budget" max={100000} />)

  await fillCurrency(field, 250000)
  await leaveField(field)

  // Asserts the RULE, not the sentence. Rewording the copy cannot break this.
  expectInvalid(field, "max")
})
```

## What makes it different

- **11 fill helpers.** One per component, each driving it to a canonical value.
- **Rule-based assertions.** `expectInvalid(field, "max")` reads the `data-rule` attribute, so tests survive a copy change.
- **Three render modes.** `renderField`, `renderInForm` and `renderManaged` — standalone, native form, and form-library.

## Entry points

Every module is importable on its own, so you take only what you use.

| Import | What it is |
|---|---|
| `@inputcn/testing` | Everything below, re-exported |
| `@inputcn/testing/fill` | The 11 `fill*` helpers and `pasteInto` |
| `@inputcn/testing/assert` | `expectValue`, `expectInvalid`, `expectWarning`, `expectFormData` |
| `@inputcn/testing/render` | `renderField`, `renderInForm`, `renderManaged` |

## Accessibility

Keyboard complete, labelled, and errors announced once through `role="alert"` rather than on every keystroke. 50 axe-core checks run on every commit.

> [!CAUTION]
> Screen readers have **not** been verified yet. Until they are, this library is *structurally accessible, not screen-reader verified*. The full audit, including what is untested and why, is in [ACCESSIBILITY.md](https://github.com/42aditya31/inputcn/blob/main/ACCESSIBILITY.md).

---

<sub>Part of [inputcn](https://input-cn.vercel.app) — the inputs shadcn/ui doesn't ship. Not affiliated with or endorsed by shadcn.</sub>
