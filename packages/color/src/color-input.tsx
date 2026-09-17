"use client"

import { forwardRef, useId, useImperativeHandle, type ReactNode } from "react"

import { useColorInput, type UseColorInputOptions } from "./use-color-input.js"

export interface ColorInputProps extends UseColorInputOptions {
  label?: ReactNode
  hint?: ReactNode
  /** Show the native OS picker alongside the text field. Default true. */
  nativePicker?: boolean
  /** Show the swatch palette. Default true. */
  showSwatches?: boolean
  /** Show the live contrast reading when `contrastAgainst` is set. Default true. */
  showContrast?: boolean
}

/**
 * A colour field.
 *
 * Emits canonical uppercase hex by default, so two equal colours are always
 * string-equal. `contrastAgainst` + `minContrast` turn an accessibility bug
 * into a warning at the point the colour is chosen.
 */
export const ColorInput = forwardRef<HTMLInputElement, ColorInputProps>(
  function ColorInput(
    {
      label,
      hint,
      nativePicker = true,
      showSwatches = true,
      showContrast = true,
      className,
      id: idProp,
      ...rest
    },
    ref,
  ) {
    const reactId = useId()
    const id = idProp ?? reactId

    const api = useColorInput({ ...rest, id })
    const {
      inputProps,
      nativeProps,
      ariaProps,
      containerProps,
      hiddenInputProps,
      ownsErrorUI,
      errorText,
      errorId,
      visible,
      hex,
      swatches,
      selectSwatch,
      contrast,
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
          <span className="inputcn-affix" aria-hidden="true">
            <span
              className="inputcn-colorwell"
              style={hex ? { background: hex } : undefined}
              data-empty={hex ? undefined : "true"}
            />
          </span>
          <input
            {...inputProps}
            {...ariaProps}
            id={id}
            className="inputcn-bare inputcn-mono"
            aria-label={rest["aria-label"]}
            aria-labelledby={rest["aria-labelledby"]}
          />
          {nativePicker ? (
            <span className="inputcn-affix inputcn-affix-right">
              <input {...nativeProps} className="inputcn-native-color" />
            </span>
          ) : null}
        </div>

        {showSwatches && swatches.length > 0 ? (
          <div className="inputcn-swatches" role="group" aria-label="Colour presets">
            {swatches.map((s) => (
              <button
                key={s}
                type="button"
                className="inputcn-swatch"
                style={{ background: s }}
                aria-label={s}
                aria-pressed={s.toUpperCase() === hex.toUpperCase()}
                disabled={rest.disabled}
                onClick={() => selectSwatch(s)}
              />
            ))}
          </div>
        ) : null}

        {showContrast && contrast ? (
          <p className="inputcn-contrast" data-level={contrast.level}>
            <span className="inputcn-contrast-ratio">{contrast.ratio}:1</span>
            <span>
              {contrast.level === "fail" ? "below AA" : contrast.level} against{" "}
              {contrast.against}
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
