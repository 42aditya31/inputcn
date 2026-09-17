---
name: inputcn-migrate
description: Replace a hand-rolled or third-party form input with inputcn, and fix the value-semantics bug it almost certainly has. Use this skill when migrating away from react-phone-number-input, react-number-format, react-currency-input-field, react-imask, imask, cleave.js, react-credit-cards, react-tagsinput or a bespoke formatted input, or when auditing an existing form for fields that store the displayed string instead of the real value.
license: MIT
metadata:
  author: 42aditya31
  version: "0.1.1"
  homepage: https://input-cn.vercel.app/docs/value-semantics
---

# Migrating to inputcn

Most migrations here are not a swap. They are a **bug fix that happens to
involve a swap**, because the field being replaced is usually storing the wrong
value and nobody has noticed.

## Before changing anything: find the real bug

For each field being migrated, answer this first:

> What exactly is written to the database today?

Then check it against what it should be:

| If the field is | It should store | A bug looks like |
|---|---|---|
| A phone number | `"+442071234567"` | `"020 7123 4567"`, `"(415) 555-2671"` |
| Money | `129900` integer | `1299.00`, `"1,299.00"`, `"$1,299.00"` |
| A percentage | `0.125` | `12.5` stored and divided later, inconsistently |
| A card number | `"4242424242424242"` | `"4242 4242 4242 4242"` |
| A duration | `5400` seconds | `"1h 30m"`, `90` with the unit implied elsewhere |
| A file size | `1048576` bytes | `"1 MB"`, or MB and MiB used interchangeably |

**If the stored value is wrong, say so before migrating**, because the migration
changes what gets written and existing rows will be in the old format. That is a
data question, not a component question, and it is the user's call:

- Backfill the old rows, or
- Read leniently and write canonically for a period, or
- Accept the split and handle both at the read site.

Never silently change the write format without raising this.

## Mapping

| From | To | Note |
|---|---|---|
| `react-phone-number-input` | `PhoneInput` | Both emit E.164, so this one is usually a clean swap |
| `react-number-format` (money) | `CurrencyInput` | **Value changes**: float or string to integer minor units |
| `react-currency-input-field` | `CurrencyInput` | Same value change |
| `react-imask` / `imask` / `cleave.js` | `MaskedInput` | Tokens differ: `#` digit, `A` letter, `*` alphanumeric |
| `react-credit-cards` + a separate input | `CardInput` | One component covers number, expiry and CVC |
| `react-tagsinput` | — | **Not built.** Do not substitute `MentionInput`; say it is missing |
| A bespoke `<input>` with an `onChange` regex | whichever fits | Usually the worst offender |

## Steps

1. **Install** the replacement, which copies the source into the repo:
   ```bash
   npx shadcn@latest add https://input-cn.vercel.app/r/<component>.json
   ```
2. **Change the state type first, not the JSX.** Money goes from
   `number` (major) or `string` to `number` (minor units). Let the type errors
   show you every read site — that list is the real scope of the migration.
3. **Move the validation into props.** A regex or a hand-written `validate`
   usually maps to a constraint: `mobileOnly`, `positive`, `max`, `notExpired`,
   `maxPrefix`. See the `inputcn` skill's `references/props.md`.
4. **Delete the formatting code.** Any `toLocaleString`, manual comma insertion,
   or caret-position workaround around this field is now dead. Removing it is
   the point; leaving it will fight the component.
5. **Fix the boundaries.** Search for every place the old value was formatted or
   parsed — API calls, server validation, exports, tests. This is where the work
   actually is.
6. **Update the tests** to `@inputcn/testing`. `userEvent.type` does not
   reliably drive a formatted input, because the formatter rewrites the value
   between keystrokes.

## Common shapes

**A float price becomes an integer.**
```diff
- const [price, setPrice] = useState(0)          // 12.99
- <NumericFormat value={price} onValueChange={(v) => setPrice(v.floatValue)} />
+ const [price, setPrice] = useState(0)          // 1299
+ <CurrencyInput value={price} onChange={setPrice} currency="GBP" locale="en-GB" />
```
Then every read site changes: `price * 100` disappears, `price / 100` appears at
the display boundary only.

**A regex becomes a prop.**
```diff
- validate: (v) => /^\+?[1-9]\d{7,14}$/.test(v) || "Invalid phone"
+ <PhoneInput required mobileOnly countries={["GB", "US"]} />
```

## Do not

- Do not migrate a field type that does not exist. There is no tags input and no
  date picker. Say so rather than approximating with something else.
- Do not keep the old formatting helpers "just in case". They will conflict.
- Do not change the write format without flagging the existing-data question.

## Reference

- <https://input-cn.vercel.app/docs/value-semantics> — the canonical value table
- The `inputcn` skill for per-component rules and the full prop list
