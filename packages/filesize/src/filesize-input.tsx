"use client"

import { forwardRef, useId, useImperativeHandle, type ReactNode } from "react"

import {
  useFileSizeInput,
  type UseFileSizeInputOptions,
} from "./use-filesize-input.js"

export interface FileSizeInputProps extends UseFileSizeInputOptions {
  /** Visible label. Supply this or `aria-label` — a field with neither has no accessible name. */
  label?: ReactNode
  /** Helper text under the field. Replaced by the error message while one is showing. */
  hint?: ReactNode
  /** Show the raw byte count as a trailing affix. Default true. */
  showBytes?: boolean
}

/**
 * A file size field.
 *
 * Emits bytes. Keeps `MB` (1000²) and `MiB` (1024²) distinct rather than
 * silently converting — they differ by 4.9%, which is the gap between a
 * "100 MB limit" and a user's file being rejected.
 */
export const FileSizeInput = forwardRef<HTMLInputElement, FileSizeInputProps>(
  function FileSizeInput(
    { label, hint, showBytes = true, className, id: idProp, ...rest },
    ref,
  ) {
    const reactId = useId()
    const id = idProp ?? reactId

    const api = useFileSizeInput({ ...rest, id })
    const {
      inputProps,
      ariaProps,
      containerProps,
      hiddenInputProps,
      ownsErrorUI,
      errorText,
      errorId,
      visible,
      bytes,
      bytesLabel,
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
            className="inputcn-bare"
            aria-label={rest["aria-label"]}
            aria-labelledby={rest["aria-labelledby"]}
          />
          {showBytes && bytes > 0 ? (
            <span
              className="inputcn-affix inputcn-affix-right inputcn-mono"
              aria-hidden="true"
            >
              {bytesLabel} B
            </span>
          ) : null}
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
