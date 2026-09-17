# form.inputcn.json

Describe the form; let the generator write it.

A language model is unreliable at nuanced React and very reliable at structured
JSON. This format moves every hard decision — which schema validates which
field, that money is an integer, that a formatting option must reach the schema
too — out of the model and into a deterministic generator.

```bash
npx inputcn generate form.inputcn.json
```

**Every prop is checked against the real component interfaces.** A prop that
does not exist fails at generate time with a suggestion, rather than becoming
JSX that silently ignores it.

## Shape

```jsonc
{
  "$schema": "https://input-cn.vercel.app/schema/form.json",
  "name": "VendorOnboarding",        // PascalCase; becomes the component name
  "form": "react-hook-form",         // or "none" for constraint props + FormData
  "submitLabel": "Create vendor",
  "fields": [
    {
      "type": "phone",               // see the table below
      "name": "phone",               // the submitted field name
      "label": "Mobile number",
      "hint": "Optional helper text",
      "mobileOnly": true,            // any real prop of that component
      "countries": ["GB", "US"]
    }
  ]
}
```

## Field types

| `type` | Component | Emits |
|---|---|---|
| `phone` | PhoneInput | `string` — E.164 |
| `currency` | CurrencyInput | `number` — integer minor units |
| `masked` | MaskedInput | `string` — raw, mask stripped |
| `percent` | PercentInput | `number` — fraction |
| `card` | CardInput | `string` — digits only |
| `duration` | DurationInput | `number` — seconds |
| `color` | ColorInput | `string` — hex |
| `cron` | CronInput | `string` — expression |
| `filesize` | FileSizeInput | `number` — bytes |
| `ip` | IpInput | `string` — address or CIDR |
| `mention` | MentionInput | `object` — { text, ids } |

## Rules

- Field props are flat. Do not nest them under `constraints` or `props`.
- Any prop from `references/props.md` is valid, including the shared ones
  (`required`, `disabled`, `variant`, `size`).
- `"form": "react-hook-form"` generates a Controller-based component with a
  matching Zod schema. `"none"` generates constraint props plus a native form
  that works as a Server Action.
- Formatting options such as `currency` and `locale` are copied into the
  schema automatically. Do not write them twice.

## Commands

```bash
npx inputcn init MyForm              # write a starter spec
npx inputcn generate spec.json       # write MyForm.tsx next to the spec
npx inputcn generate spec.json --out src/components
npx inputcn generate spec.json --stdout
npx inputcn types                    # list field types and what each emits
```
