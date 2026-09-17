"use client"

import { forwardRef, useId, useImperativeHandle, type ReactNode } from "react"

import { useIpInput, type UseIpInputOptions } from "./use-ip-input.js"

export interface IpInputProps extends UseIpInputOptions {
  label?: ReactNode
  hint?: ReactNode
  /** Show the computed host range for a CIDR block. Default true. */
  showRange?: boolean
}

/**
 * An IPv4 / CIDR field.
 *
 * `maxPrefix` is the constraint that earns its keep: it stops an admin
 * allow-listing `0.0.0.0/0` by accident.
 */
export const IpInput = forwardRef<HTMLInputElement, IpInputProps>(
  function IpInput({ label, hint, showRange = true, className, id: idProp, ...rest }, ref) {
    const reactId = useId()
    const id = idProp ?? reactId

    const api = useIpInput({ ...rest, id })
    const {
      inputProps,
      ariaProps,
      containerProps,
      hiddenInputProps,
      ownsErrorUI,
      errorText,
      errorId,
      visible,
      parsed,
      range,
      kind,
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
            className="inputcn-bare inputcn-mono"
            aria-label={rest["aria-label"]}
            aria-labelledby={rest["aria-labelledby"]}
          />
          {kind ? (
            <span className="inputcn-affix inputcn-affix-right inputcn-tag" aria-hidden="true">
              {kind}
            </span>
          ) : null}
        </div>

        {showRange && range && parsed?.hasPrefix ? (
          <p className="inputcn-iprange">
            <span className="inputcn-mono">
              {range.firstHost} – {range.lastHost}
            </span>
            <span>
              {range.hosts.toLocaleString()} usable {range.hosts === 1 ? "host" : "hosts"}
            </span>
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
