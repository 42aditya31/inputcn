/**
 * @inputcn/testing
 *
 * Test helpers for inputcn components.
 *
 * Formatted inputs are hard to drive from a test: `userEvent.type` races the
 * component's own reformatting and caret restoration, so the value you end up
 * with is not the value a real user would produce. These helpers take the
 * CANONICAL value and get the field there correctly.
 *
 * ```ts
 * import { fillPhone, expectValue, expectInvalid, leaveField }
 *   from "@inputcn/testing"
 *
 * await fillPhone(screen.getByLabelText("Phone"), "+14155552671")
 * expectValue(screen.getByLabelText("Phone"), "+14155552671", "phone")
 *
 * await leaveField(screen.getByLabelText("Amount"))
 * expectInvalid(screen.getByLabelText("Amount"), "max")  // the RULE, not the copy
 * ```
 */

export {
  clearField,
  fillCard,
  fillColor,
  fillCron,
  fillCurrency,
  fillDuration,
  fillFileSize,
  fillIp,
  fillMasked,
  fillPercent,
  fillPhone,
  leaveField,
  mention,
  pasteInto,
  type FillOptions,
} from "./fill.js"

export {
  expectFormData,
  expectInvalid,
  expectValid,
  expectValue,
  expectWarning,
  fieldRoot,
  findInvalid,
  findValid,
  getCanonical,
  getDisplay,
  getError,
  getOptions,
} from "./assert.js"

export {
  renderField,
  renderInForm,
  renderManaged,
  type RenderFieldResult,
} from "./render.js"
