/**
 * Message resolution. PRD §9.5.
 *
 * Three levels, most specific wins:
 *   1. instance  — the `messages` prop
 *   2. provider  — <InputcnProvider messages={...}>
 *   3. built-in  — this file
 *
 * Messages are functions so they interpolate and pluralise in the host
 * language rather than by string concatenation.
 */

import type { MessageMap, MessageValue, Violation } from "./types.js"

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many)

/** English defaults. Every rule name used anywhere must appear here. */
export const defaultMessages: MessageMap = {
  // universal
  required: "This field is required",
  custom: "Invalid value",

  // numeric
  min: (p) => `Must be ${p.formatted ?? p.min} or more`,
  max: (p) => `Must be ${p.formatted ?? p.max} or less`,
  positive: "Must be greater than zero",
  negative: "Must be less than zero",
  nonZero: "Cannot be zero",
  integer: "Must be a whole number",
  multipleOf: (p) => `Must be a multiple of ${p.formatted ?? p.step}`,
  precision: (p) =>
    `Use at most ${p.precision} decimal ${plural(Number(p.precision), "place", "places")}`,

  // string
  minLength: (p) =>
    `Must be at least ${p.minLength} ${plural(Number(p.minLength), "character", "characters")}`,
  maxLength: (p) =>
    `Must be ${p.maxLength} ${plural(Number(p.maxLength), "character", "characters")} or fewer`,
  pattern: "Invalid format",
  oneOf: "Not an allowed value",

  // collections
  minItems: (p) => `Add at least ${p.minItems} ${plural(Number(p.minItems), "item", "items")}`,
  maxItems: (p) => `No more than ${p.maxItems} ${plural(Number(p.maxItems), "item", "items")}`,
  unique: "Duplicates are not allowed",

  // mask
  incomplete: "Finish filling this in",

  // phone
  phoneFormat: "Enter a valid phone number",
  phoneCountry: (p) => `Not a valid ${p.country} number`,
  phoneMobileOnly: "Enter a mobile number — this one looks like a landline",
  phoneAllowedCountries: (p) => `Only ${p.countries} numbers are accepted`,

  // card
  luhn: "This card number is not valid",
  cardBrand: (p) => `We accept ${p.brands}`,
  cardLength: "This card number is the wrong length",
  cardExpired: "This card has expired",
  cardExpiryFormat: "Enter the expiry as MM/YY",

  // colour
  colorFormat: "Enter a valid colour",
  colorContrast: (p) =>
    `Contrast is ${p.ratio}:1 against ${p.against} — needs ${p.minContrast}:1`,

  // cron
  cronFields: "A schedule needs five fields: minute hour day month weekday",
  cronField: (p) => (p.field ? `The ${p.field} field ${p.reason}` : "Invalid schedule"),
  cronMinInterval: (p) => `Runs too often — minimum interval is ${p.minInterval}`,

  // network
  ipFormat: "Enter a valid IPv4 address",
  ipPrefix: (p) => `Prefix must be between /${p.minPrefix} and /${p.maxPrefix}`,
  ipPrivate: "Private ranges are not allowed",
  ipLoopback: "Loopback addresses are not allowed",

  // duration / size
  durationFormat: "Try something like 2h 30m",
  fileSizeFormat: "Try something like 25 MB",
}

function render(tpl: MessageValue, params: Record<string, unknown>): string {
  return typeof tpl === "function" ? tpl(params) : tpl
}

/**
 * Resolve a violation to text.
 * A per-instance `message` param (from `required="..."` or a `validate`
 * return value) always wins — it is the most specific thing the user wrote.
 */
export function resolveMessage(
  violation: Violation,
  instance?: MessageMap,
  provider?: MessageMap,
): string {
  const params = violation.params ?? {}

  const inline = params.message
  if (typeof inline === "string") return inline

  const tpl =
    instance?.[violation.rule] ??
    provider?.[violation.rule] ??
    defaultMessages[violation.rule]

  if (tpl === undefined) {
    // Unknown rule: never render "undefined" at the user.
    return defaultMessages.custom as string
  }
  return render(tpl, params)
}
