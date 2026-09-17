"use client"

import { forwardRef, useId, useImperativeHandle, type ReactNode } from "react"

import { useCardInput, type UseCardInputOptions } from "./use-card-input.js"

export type CardLayout = "stacked" | "single"

export interface CardInputProps extends UseCardInputOptions {
  label?: ReactNode
  hint?: ReactNode
  /** `stacked` is three fields; `single` is one row, Stripe-style. */
  layout?: CardLayout
  /** Field names for native submission. */
  expiryName?: string
  cvcName?: string
}

export const CardInput = forwardRef<HTMLInputElement, CardInputProps>(
  function CardInput(
    { label, hint, layout = "stacked", expiryName, cvcName, className, id: idProp, ...rest },
    ref,
  ) {
    const reactId = useId()
    const id = idProp ?? reactId

    const api = useCardInput({ ...rest, id })
    const {
      numberProps,
      expiryProps,
      cvcProps,
      ariaProps,
      containerProps,
      hiddenInputProps,
      ownsErrorUI,
      errorText,
      errorId,
      visible,
      brand,
      expiry,
      cvc,
    } = api

    useImperativeHandle(
      ref,
      () =>
        numberProps.ref.current ??
        ({ focus: () => numberProps.ref.current?.focus() } as HTMLInputElement),
      [numberProps.ref],
    )

    const invalid = ariaProps["aria-invalid"] ? "true" : undefined

    return (
      <div className={`inputcn-field ${className ?? ""}`.trim()} {...containerProps}>
        {label === undefined ? null : (
          <label className="inputcn-label" htmlFor={id}>
            {label}
          </label>
        )}

        {layout === "single" ? (
          <div className="inputcn-cc-single" data-invalid={invalid}>
            <input
              {...numberProps}
              {...ariaProps}
              id={id}
              className="inputcn-cc-number"
              aria-label={rest["aria-label"] ?? "Card number"}
            />
            {brand ? (
              <span className="inputcn-brand" aria-hidden="true">
                {brand.label}
              </span>
            ) : null}
            <span className="inputcn-cc-rule" aria-hidden="true" />
            <input {...expiryProps} className="inputcn-cc-exp" aria-label="Expiry date" />
            <span className="inputcn-cc-rule" aria-hidden="true" />
            <input {...cvcProps} className="inputcn-cc-cvc" aria-label="Security code" />
          </div>
        ) : (
          <>
            <div className="inputcn-group" data-invalid={invalid}>
              <input
                {...numberProps}
                {...ariaProps}
                id={id}
                className="inputcn-bare inputcn-numeric"
                aria-label={rest["aria-label"] ?? "Card number"}
              />
              <span className="inputcn-affix inputcn-affix-right inputcn-brand" aria-hidden="true">
                {brand?.label ?? ""}
              </span>
            </div>

            <div className="inputcn-cc-row">
              <div>
                <label className="inputcn-label" htmlFor={`${id}-exp`}>
                  Expiry
                </label>
                <input
                  {...expiryProps}
                  id={`${id}-exp`}
                  className="inputcn-input inputcn-numeric"
                />
              </div>
              <div>
                <label className="inputcn-label" htmlFor={`${id}-cvc`}>
                  CVC
                </label>
                <input
                  {...cvcProps}
                  id={`${id}-cvc`}
                  className="inputcn-input inputcn-numeric"
                />
              </div>
            </div>
          </>
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
        {expiryName ? <input type="hidden" name={expiryName} value={expiry} readOnly /> : null}
        {cvcName ? <input type="hidden" name={cvcName} value={cvc} readOnly /> : null}
      </div>
    )
  },
)
