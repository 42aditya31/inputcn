"use client"

import { forwardRef, useId, useImperativeHandle, type ReactNode } from "react"

import { DAY_NAMES } from "./cron.js"
import { useCronInput, type UseCronInputOptions } from "./use-cron-input.js"

export type CronLayout = "expression" | "builder"

export interface CronInputProps extends UseCronInputOptions {
  label?: ReactNode
  hint?: ReactNode
  /** `expression` for engineers, `builder` for everyone else. */
  layout?: CronLayout
  /** Show the plain-English reading. Default true. */
  showDescription?: boolean
  /** Show upcoming run times. Default true. */
  showUpcoming?: boolean
}

const FREQUENCIES = [
  { value: "hourly", label: "Every hour" },
  { value: "daily", label: "Every day" },
  { value: "weekly", label: "Every week" },
  { value: "monthly", label: "Every month" },
] as const

const DAY_ABBR = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const

const timeFormat = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
})

/**
 * A cron schedule field.
 *
 * The plain-English reading is the feature: a schedule nobody can read is a
 * schedule nobody can review. `minInterval` stops a job being scheduled every
 * second.
 */
export const CronInput = forwardRef<HTMLInputElement, CronInputProps>(
  function CronInput(
    {
      label,
      hint,
      layout = "expression",
      showDescription = true,
      showUpcoming = true,
      className,
      id: idProp,
      ...rest
    },
    ref,
  ) {
    const reactId = useId()
    const id = idProp ?? reactId

    const api = useCronInput({ ...rest, id })
    const {
      inputProps,
      ariaProps,
      containerProps,
      hiddenInputProps,
      ownsErrorUI,
      errorText,
      errorId,
      visible,
      description,
      valid,
      upcoming,
      builder,
      setFrequency,
      setTime,
      toggleDay,
      setDayOfMonth,
      value,
    } = api

    useImperativeHandle(
      ref,
      () =>
        inputProps.ref.current ??
        ({ focus: () => inputProps.ref.current?.focus() } as HTMLInputElement),
      [inputProps.ref],
    )

    const invalid = ariaProps["aria-invalid"] ? "true" : undefined
    const weekly = builder?.frequency === "weekly"
    const monthly = builder?.frequency === "monthly"

    return (
      <div className={`inputcn-field ${className ?? ""}`.trim()} {...containerProps}>
        {label === undefined ? null : (
          <label className="inputcn-label" htmlFor={id}>
            {label}
          </label>
        )}

        {layout === "builder" ? (
          builder ? (
            <div className="inputcn-cron-builder">
              <div className="inputcn-cron-row">
                <select
                  id={id}
                  className="inputcn-select"
                  value={builder.frequency}
                  disabled={rest.disabled}
                  aria-label="Frequency"
                  onChange={(e) =>
                    setFrequency(e.currentTarget.value as typeof builder.frequency)
                  }
                >
                  {FREQUENCIES.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>

                <input
                  className="inputcn-input inputcn-cron-time"
                  type="time"
                  value={builder.time}
                  // Hourly repeats every hour, so an hour-of-day is meaningless.
                  disabled={rest.disabled || builder.frequency === "hourly"}
                  aria-label="Time of day"
                  onChange={(e) => setTime(e.currentTarget.value)}
                />

                {monthly ? (
                  <input
                    className="inputcn-input inputcn-cron-dom"
                    type="number"
                    min={1}
                    max={31}
                    value={builder.dayOfMonth}
                    disabled={rest.disabled}
                    aria-label="Day of month"
                    onChange={(e) => setDayOfMonth(Number(e.currentTarget.value))}
                  />
                ) : null}
              </div>

              {weekly ? (
                <div className="inputcn-daysrow" role="group" aria-label="Days of the week">
                  {DAY_ABBR.map((abbr, i) => (
                    <button
                      key={abbr}
                      type="button"
                      className="inputcn-day"
                      aria-pressed={builder.days.includes(i)}
                      aria-label={DAY_NAMES[i]}
                      disabled={rest.disabled}
                      onClick={() => toggleDay(i)}
                    >
                      {abbr}
                    </button>
                  ))}
                </div>
              ) : null}

              <div className="inputcn-exprbar">
                <span className="inputcn-exprbar-label">emits</span>
                <code>{value || "—"}</code>
              </div>
            </div>
          ) : (
            <p className="inputcn-hint">
              This schedule is more specific than the builder can show. Switch to the
              expression layout to edit it.
            </p>
          )
        ) : (
          <input
            {...inputProps}
            {...ariaProps}
            id={id}
            className="inputcn-input inputcn-mono"
            aria-label={rest["aria-label"]}
            aria-labelledby={rest["aria-labelledby"]}
          />
        )}

        {showDescription && description ? (
          <p className="inputcn-cron-reads" data-invalid={valid ? undefined : "true"}>
            {description}
          </p>
        ) : null}

        {showUpcoming && upcoming.length > 0 ? (
          <div className="inputcn-cron-next">
            <span className="inputcn-cron-next-label">Next runs</span>
            {upcoming.map((d) => (
              <span key={d.toISOString()} className="inputcn-cron-next-item">
                {timeFormat.format(d)}
              </span>
            ))}
          </div>
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
