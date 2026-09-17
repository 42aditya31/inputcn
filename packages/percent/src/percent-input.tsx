"use client"

import { forwardRef, useId, useImperativeHandle, type ReactNode } from "react"

import {
  usePercentInput,
  type UsePercentInputOptions,
} from "./use-percent-input.js"

export interface PercentInputProps extends UsePercentInputOptions {
  /** Visible label. Supply this or `aria-label` — a field with neither has no accessible name. */
  label?: ReactNode
  /** Helper text under the field. Replaced by the error message while one is showing. */
  hint?: ReactNode
}

/**
 * A percentage field.
 *
 * Displays `12.5`, emits `0.125`. The off-by-100 bug, solved once.
 */
export const PercentInput = forwardRef<HTMLInputElement, PercentInputProps>(
  function PercentInput({ label, hint, className, id: idProp, ...rest }, ref) {
    const reactId = useId()
    const id = idProp ?? reactId

    const api = usePercentInput({ ...rest, id })
    const {
      inputProps,
      ariaProps,
      containerProps,
      hiddenInputProps,
      ownsErrorUI,
      errorText,
      errorId,
      visible,
    } = api

    useImperativeHandle(
      ref,
      () =>
        inputProps.ref.current ??
        ({ focus: () => inputProps.ref.current?.focus() } as HTMLInputElement),
      [inputProps.ref],
    )

    return (
      <div className={`inputcn-field ${className ?? ""}`.trim()} {...containerProps}>
        {label === undefined ? null : (
          <label className="inputcn-label" htmlFor={id}>
            {label}
          </label>
        )}

        <div
          className="inputcn-group"
          data-invalid={ariaProps["aria-invalid"] ? "true" : undefined}
        >
          <input
            {...inputProps}
            {...ariaProps}
            id={id}
            className="inputcn-bare inputcn-numeric"
            aria-label={rest["aria-label"]}
            aria-labelledby={rest["aria-labelledby"]}
          />
          <span className="inputcn-affix inputcn-affix-right" aria-hidden="true">
            %
          </span>
        </div>

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
