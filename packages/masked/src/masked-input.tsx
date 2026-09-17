"use client"

import { forwardRef, useId, useImperativeHandle, type ReactNode } from "react"

import { useMaskedInput, type UseMaskedInputOptions } from "./use-masked-input.js"

export interface MaskedInputProps extends UseMaskedInputOptions {
  label?: ReactNode
  hint?: ReactNode
  /** Rendered before the field, inside the border. */
  prefix?: ReactNode
  /** Rendered after the field, inside the border. */
  suffix?: ReactNode
}

/**
 * A template-masked text field.
 *
 * Emits the RAW value — `"12345678901"` for a `"###.###.###-##"` mask. The
 * caret holds position when typing into the middle, which is the entire
 * reason this component exists rather than a regex in an onChange handler.
 */
export const MaskedInput = forwardRef<HTMLInputElement, MaskedInputProps>(
  function MaskedInput(
    { label, hint, prefix, suffix, className, id: idProp, ...rest },
    ref,
  ) {
    const reactId = useId()
    const id = idProp ?? reactId

    const api = useMaskedInput({ ...rest, id })
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

    const bare = prefix !== undefined || suffix !== undefined

    const input = (
      <input
        {...inputProps}
        {...ariaProps}
        id={id}
        className={bare ? "inputcn-bare" : "inputcn-input"}
        aria-label={rest["aria-label"]}
        aria-labelledby={rest["aria-labelledby"]}
      />
    )

    return (
      <div className={`inputcn-field ${className ?? ""}`.trim()} {...containerProps}>
        {label === undefined ? null : (
          <label className="inputcn-label" htmlFor={id}>
            {label}
          </label>
        )}

        {bare ? (
          <div
            className="inputcn-group"
            data-invalid={ariaProps["aria-invalid"] ? "true" : undefined}
          >
            {prefix === undefined ? null : (
              <span className="inputcn-affix" aria-hidden="true">
                {prefix}
              </span>
            )}
            {input}
            {suffix === undefined ? null : (
              <span className="inputcn-affix inputcn-affix-right" aria-hidden="true">
                {suffix}
              </span>
            )}
          </div>
        ) : (
          input
        )}

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
