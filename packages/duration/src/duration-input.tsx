"use client"

import {
  forwardRef,
  useCallback,
  useId,
  useImperativeHandle,
  type KeyboardEvent,
  type ReactNode,
} from "react"

import {
  useDurationInput,
  type UseDurationInputOptions,
} from "./use-duration-input.js"

export type DurationLayout = "text" | "segmented" | "presets"

export interface DurationInputProps extends UseDurationInputOptions {
  label?: ReactNode
  hint?: ReactNode
  /** PRD §6. `text` is fastest for keyboard users; `segmented` is unambiguous. */
  layout?: DurationLayout
  /** Show the normalised value as a trailing affix. Default true. */
  showNormalised?: boolean
}

const SEGMENTS = [
  { unit: "h" as const, label: "hours", max: 999, width: 34 },
  { unit: "m" as const, label: "minutes", max: 59, width: 26 },
  { unit: "s" as const, label: "seconds", max: 59, width: 26 },
]

export const DurationInput = forwardRef<HTMLInputElement, DurationInputProps>(
  function DurationInput(
    { label, hint, layout = "text", showNormalised = true, className, id: idProp, ...rest },
    ref,
  ) {
    const reactId = useId()
    const id = idProp ?? reactId

    const api = useDurationInput({ ...rest, id })
    const {
      inputProps,
      ariaProps,
      containerProps,
      hiddenInputProps,
      ownsErrorUI,
      errorText,
      errorId,
      visible,
      display,
      segments,
      setSegment,
      presets,
      activePreset,
      applyPreset,
    } = api

    useImperativeHandle(
      ref,
      () =>
        inputProps.ref.current ??
        ({ focus: () => inputProps.ref.current?.focus() } as HTMLInputElement),
      [inputProps.ref],
    )

    // Arrow keys on a segment step it and wrap, which is what people expect
    // from anything that looks like a clock.
    const onSegmentKey = useCallback(
      (unit: "h" | "m" | "s", maxValue: number) =>
        (e: KeyboardEvent<HTMLInputElement>) => {
          const step = e.key === "ArrowUp" ? 1 : e.key === "ArrowDown" ? -1 : 0
          if (!step) return
          e.preventDefault()
          let next = segments[unit] + step
          if (next < 0) next = maxValue
          if (next > maxValue) next = 0
          setSegment(unit, next)
        },
      [segments, setSegment],
    )

    const invalid = ariaProps["aria-invalid"] ? "true" : undefined

    return (
      <div className={`inputcn-field ${className ?? ""}`.trim()} {...containerProps}>
        {label === undefined ? null : (
          <label className="inputcn-label" htmlFor={id}>
            {label}
          </label>
        )}

        {layout === "segmented" ? (
          <div className="inputcn-segfield" data-invalid={invalid}>
            {SEGMENTS.map(({ unit, label: name, max, width }, i) => (
              <span className="inputcn-seg" key={unit}>
                {i > 0 ? <span className="inputcn-seg-gap" aria-hidden="true" /> : null}
                <input
                  id={i === 0 ? id : undefined}
                  className="inputcn-seg-input"
                  style={{ width }}
                  value={String(segments[unit]).padStart(2, "0")}
                  inputMode="numeric"
                  autoComplete="off"
                  aria-label={name}
                  disabled={rest.disabled}
                  readOnly={rest.readOnly}
                  onFocus={(e) => e.currentTarget.select()}
                  onKeyDown={onSegmentKey(unit, max)}
                  onChange={(e) => {
                    const n = Number(e.currentTarget.value.replace(/\D/g, "").slice(-3))
                    setSegment(unit, Math.min(Number.isNaN(n) ? 0 : n, max))
                  }}
                  {...(i === 0 ? ariaProps : {})}
                />
                <span className="inputcn-seg-unit" aria-hidden="true">
                  {unit}
                </span>
              </span>
            ))}
          </div>
        ) : layout === "presets" ? (
          <>
            <div className="inputcn-presets" role="group" aria-label="Common durations">
              {presets.map((p) => (
                <button
                  key={p}
                  type="button"
                  className="inputcn-pill"
                  aria-pressed={p === activePreset}
                  disabled={rest.disabled}
                  onClick={() => applyPreset(p)}
                >
                  {p}
                </button>
              ))}
            </div>
            <div className="inputcn-group" data-invalid={invalid} style={{ marginTop: 9 }}>
              <input
                {...inputProps}
                {...ariaProps}
                id={id}
                className="inputcn-bare"
                placeholder="Custom…"
                aria-label={rest["aria-label"] ?? "Custom duration"}
              />
              {showNormalised && display ? (
                <span className="inputcn-affix inputcn-affix-right" aria-hidden="true">
                  {display}
                </span>
              ) : null}
            </div>
          </>
        ) : (
          <div className="inputcn-group" data-invalid={invalid}>
            <input
              {...inputProps}
              {...ariaProps}
              id={id}
              className="inputcn-bare"
              aria-label={rest["aria-label"]}
              aria-labelledby={rest["aria-labelledby"]}
            />
            {showNormalised && display && display !== inputProps.value ? (
              <span className="inputcn-affix inputcn-affix-right" aria-hidden="true">
                {display}
              </span>
            ) : null}
          </div>
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
