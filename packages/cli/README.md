<div align="center">

# inputcn

**Describe the form. Let the generator write it.**

[![npm](https://img.shields.io/npm/v/inputcn?style=flat-square&labelColor=09090b&color=cdf25c&label=npm)](https://www.npmjs.com/package/inputcn) [![license](https://img.shields.io/badge/license-MIT-a1a1aa?style=flat-square&labelColor=09090b)](https://github.com/42aditya31/inputcn/blob/main/LICENSE) [![types](https://img.shields.io/badge/types-included-a1a1aa?style=flat-square&labelColor=09090b)](https://input-cn.vercel.app/docs/form-spec)

[Documentation](https://input-cn.vercel.app/docs) · [The contract](https://input-cn.vercel.app/docs/value-semantics) · [All 11 components](https://input-cn.vercel.app/components)

</div>

---

A language model is unreliable at nuanced React and very reliable at structured JSON. This flips what you ask for: the model emits a twenty-line spec, and a deterministic generator produces the component, the Zod schema and the types.

Every prop in the spec is checked against the interfaces the components actually declare, so a hallucinated prop fails immediately with a suggestion rather than becoming JSX that silently ignores it.

## Install

```bash
npm i inputcn
```

## Usage

```tsx
npx inputcn init MyForm
npx inputcn generate form.inputcn.json
```

## What makes it different

- **The error surface collapses.** Asking a model for a React form has dozens of failure modes. Asking for JSON has one — a typo in a field name — and the generator catches that too.
- **Traps handled once.** Formatting options are copied into the schema automatically, so a GBP field cannot end up reporting its cap in dollars.
- **Schema options are intersected, not assumed.** `CardInput` has `notExpired`; `cardSchema` does not, because expiry is a separate value. The generator reads what each schema really accepts.
- **Editor support.** A JSON Schema at `/schema/form.json` gives autocomplete and inline errors before the generator is ever run.

## Accessibility

Keyboard complete, labelled, and errors announced once through `role="alert"` rather than on every keystroke. 50 axe-core checks run on every commit.

> [!CAUTION]
> Screen readers have **not** been verified yet. Until they are, this library is *structurally accessible, not screen-reader verified*. The full audit, including what is untested and why, is in [ACCESSIBILITY.md](https://github.com/42aditya31/inputcn/blob/main/ACCESSIBILITY.md).

---

<sub>Part of [inputcn](https://input-cn.vercel.app) — the inputs shadcn/ui doesn't ship. Not affiliated with or endorsed by shadcn.</sub>
