/**
 * @inputcn/core — shared engine.
 *
 * NOTE: this entry point exists for convenience in apps and tests. Component
 * packages import from the deep paths (`@inputcn/core/mask`) so a consumer
 * never pays for a module they do not use (bundle-barrel-imports).
 */

export type {
  BaseFieldProps,
  FieldMode,
  FieldSize,
  FieldVariant,
  MessageMap,
  MessageResolver,
  MessageValue,
  PasteResult,
  Rule,
  ShowError,
  ValidityState,
  Violation,
} from "./types.js"

export {
  applyFormatted,
  countSignificantBefore,
  isAlnum,
  isDeletingEvent,
  isDigit,
  nextCaretPosition,
  offsetAfterSignificant,
  type SignificantFn,
} from "./caret.js"

export {
  compileMask,
  formatMask,
  isMaskComplete,
  maskCapacity,
  maskPlaceholder,
  maskSignificance,
  parseMask,
} from "./mask.js"

export {
  clipboardText,
  detectCurrency,
  digitsOf,
  parseLooseNumber,
  scrub,
  splitExtension,
  splitList,
} from "./paste.js"

export {
  VALID,
  custom,
  evaluate,
  integer,
  isEmptyValue,
  max,
  maxItems,
  maxLength,
  min,
  minItems,
  minLength,
  multipleOf,
  negative,
  nonZero,
  oneOf,
  pattern,
  positive,
  required,
  rules,
  unique,
} from "./validity.js"

export { defaultMessages, resolveMessage } from "./messages.js"

export {
  InputcnContext,
  InputcnProvider,
  FieldModeContext,
  useFieldModeContext,
  useInputcnContext,
  type InputcnContextValue,
  type InputcnProviderProps,
} from "./provider.js"

export { useField, type UseFieldOptions, type UseFieldResult } from "./use-field.js"
export {
  useMaskedValue,
  type UseMaskedValueOptions,
  type UseMaskedValueResult,
} from "./use-masked-value.js"
export { useEvent, useLatest } from "./use-latest.js"

export {
  createWarnScope,
  warn,
  warnBothValueProps,
  warnControlledSwitch,
  warnIgnoredInManagedMode,
  warnMissingLabel,
  warnWrongValueType,
  type WarnScope,
} from "./warn.js"
