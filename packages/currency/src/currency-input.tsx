"use client"

import { forwardRef, useId, useImperativeHandle, type ReactNode } from "react"

import {
  useCurrencyInput,
  type UseCurrencyInputOptions,
} from "./use-currency-input.js"

export type CurrencyLayout = "inline" | "display" | "stepper"

export interface CurrencyInputProps extends UseCurrencyInputOptions {
  /** Visible label. Supply this or `aria-label` — a field with neither has no accessible name. */
  label?: ReactNode
  /** Helper text under the field. Replaced by the error message while one is showing. */
  hint?: ReactNode
  /** PRD §6 layouts. `inline` is the default form-row shape. */
  layout?: CurrencyLayout
  /** Show the ISO code as a trailing affix. Default true. */
  showCode?: boolean
}

const MINUS = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
    <path d="M5 12h14" />
  </svg>
)
const PLUS = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
    <path d="M12 5v14M5 12h14" />
  </svg>
)

/**
 * A money field.
 *
 * Emits an INTEGER count of minor units — 123450 is $1,234.50 — so no float
 * ever touches a price. Typing fills from the right like a register, which is
 * also why the caret cannot drift: there is no string being edited.
 */
export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  function CurrencyInput(
    { label, hint, layout = "inline", showCode = true, className, id: idProp, ...rest },
    ref,
  ) {
    const reactId = useId()
    const id = idProp ?? reactId

    const api = useCurrencyInput({ ...rest, id })
    const {
      inputProps,
      ariaProps,
      containerProps,
      hiddenInputProps,
      ownsErrorUI,
      errorText,
      errorId,
      visible,
      symbol,
      currency,
      step,
      sideEffect,
      undoPaste,
      dismissSideEffect,
    } = api

    useImperativeHandle(
      ref,
      () =>
        inputProps.ref.current ??
        ({ focus: () => inputProps.ref.current?.focus() } as HTMLInputElement),
      [inputProps.ref],
    )

    const field = (
      <input
        {...inputProps}
        {...ariaProps}
        id={id}
        className={layout === "display" ? "inputcn-display-input" : "inputcn-bare"}
        aria-label={rest["aria-label"]}
        aria-labelledby={rest["aria-labelledby"]}
      />
    )

    const invalid = ariaProps["aria-invalid"] ? "true" : undefined

    return (
      <div
        className={`inputcn-field inputcn-currency-${layout} ${className ?? ""}`.trim()}
        {...containerProps}
      >
        {label === undefined ? null : (
          <label className="inputcn-label" htmlFor={id}>
            {label}
          </label>
        )}

        {layout === "display" ? (
          <div className="inputcn-display" data-invalid={invalid}>
            <span className="inputcn-display-symbol" aria-hidden="true">
              {symbol}
            </span>
            {field}
            {showCode ? (
              <span className="inputcn-display-code" aria-hidden="true">
                {currency}
              </span>
            ) : null}
          </div>
        ) : layout === "stepper" ? (
          <div className="inputcn-stepper">
            <button
              type="button"
              className="inputcn-stepbtn"
              onClick={() => step(-1)}
              disabled={rest.disabled}
              aria-label="Decrease"
              tabIndex={-1}
            >
              {MINUS}
            </button>
            <div className="inputcn-group" data-invalid={invalid}>
              <span className="inputcn-affix" aria-hidden="true">
                {symbol}
              </span>
              {field}
            </div>
            <button
              type="button"
              className="inputcn-stepbtn"
              onClick={() => step(1)}
              disabled={rest.disabled}
              aria-label="Increase"
              tabIndex={-1}
            >
              {PLUS}
            </button>
          </div>
        ) : (
          <div className="inputcn-group" data-invalid={invalid}>
            <span className="inputcn-affix" aria-hidden="true">
              {symbol}
            </span>
            {field}
            {showCode ? (
              <span className="inputcn-affix inputcn-affix-right" aria-hidden="true">
                {currency}
              </span>
            ) : null}
          </div>
        )}

        {sideEffect ? (
          <p className="inputcn-notice" role="status">
            {sideEffect.label}
            <button type="button" onClick={undoPaste} className="inputcn-undo">
              Undo
            </button>
            <button
              type="button"
              onClick={dismissSideEffect}
              className="inputcn-dismiss"
              aria-label="Dismiss"
            >
              ×
            </button>
          </p>
        ) : null}

        {ownsErrorUI && errorText ? (
          <p
            id={errorId}
            className={visible?.warning ? "inputcn-warning" : "inputcn-error"}
            // Stable rule name so a test can assert WHICH rule failed rather
            // than matching copy, which breaks on a rewrite or a locale change.
            data-rule={visible?.rule}
            role="alert"
          >
            {errorText}
          </p>
        ) : hint !== undefined ? (
          <p className="inputcn-hint">{hint}</p>
        ) : null}

        {hiddenInputProps ? <input {...hiddenInputProps} /> : null}
      </div>
    )
  },
)
