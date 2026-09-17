"use client"

import {
  forwardRef,
  useCallback,
  useId,
  useImperativeHandle,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react"

import type { Country } from "./countries.js"
import { usePhoneInput, type UsePhoneInputOptions } from "./use-phone-input.js"

export interface PhoneInputProps extends UsePhoneInputOptions {
  /** Visible label. Supply this or `aria-label` — a field with neither has no accessible name. */
  label?: ReactNode
  /** Helper text under the field. Replaced by the error message while one is showing. */
  hint?: ReactNode
  /** Override the country trigger and popover. */
  renderCountry?: (api: {
    country: Country | undefined
    available: readonly Country[]
    setCountry: (iso: string) => void
    disabled: boolean | undefined
  }) => ReactNode
}

// Static JSX hoisted out of the component (rendering-hoist-jsx).
const CARET = (
  <svg
    className="inputcn-caret"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    aria-hidden="true"
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
)

/**
 * A phone field with a searchable country selector, live national formatting
 * and E.164 output.
 *
 * The forwarded ref points at the NUMBER input, not the wrapper — react-hook-form
 * calls `ref.focus()` on the first invalid field and a ref to a <div> silently
 * does nothing. PRD §10.3.
 */
export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  function PhoneInput({ label, hint, renderCountry, className, id: idProp, ...rest }, ref) {
    const reactId = useId()
    const id = idProp ?? reactId

    const api = usePhoneInput({ ...rest, id })
    const {
      country,
      available,
      setCountry,
      inputProps,
      ariaProps,
      containerProps,
      hiddenInputProps,
      ownsErrorUI,
      errorText,
      errorId,
      visible,
      sideEffect,
      undoPaste,
      dismissSideEffect,
    } = api

    useImperativeHandle(
      ref,
      () => {
        const el = inputProps.ref.current
        // Expose the real node so RHF gets focus(), name, value and selection
        // APIs — but guarantee focus() exists even before mount.
        return (el ??
          ({ focus: () => inputProps.ref.current?.focus() } as HTMLInputElement))
      },
      [inputProps.ref],
    )

    /* -------- country popover -------- */
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState("")
    const [active, setActive] = useState(0)
    const triggerRef = useRef<HTMLButtonElement>(null)

    const q = query.trim().toLowerCase()
    const matches = q
      ? available.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.iso.toLowerCase().includes(q) ||
            c.dial.includes(q),
        )
      : available

    const close = useCallback(() => {
      setOpen(false)
      setQuery("")
      setActive(0)
      triggerRef.current?.focus()
    }, [])

    const choose = useCallback(
      (iso: string) => {
        setCountry(iso)
        setOpen(false)
        setQuery("")
        setActive(0)
        inputProps.ref.current?.focus()
      },
      [setCountry, inputProps.ref],
    )

    const onSearchKeyDown = useCallback(
      (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "ArrowDown") {
          e.preventDefault()
          setActive((i) => Math.min(i + 1, matches.length - 1))
        } else if (e.key === "ArrowUp") {
          e.preventDefault()
          setActive((i) => Math.max(i - 1, 0))
        } else if (e.key === "Enter") {
          e.preventDefault()
          const pick = matches[active]
          if (pick) choose(pick.iso)
        } else if (e.key === "Escape") {
          e.preventDefault()
          close()
        }
      },
      [matches, active, choose, close],
    )

    const describedBy = ariaProps["aria-describedby"]

    return (
      <div className={`inputcn-field ${className ?? ""}`.trim()} {...containerProps}>
        {label === undefined ? null : (
          <label className="inputcn-label" htmlFor={id}>
            {label}
          </label>
        )}

        <div className="inputcn-relative">
          <div
            className="inputcn-group"
            data-invalid={ariaProps["aria-invalid"] ? "true" : undefined}
          >
            {renderCountry ? (
              renderCountry({ country, available, setCountry, disabled: rest.disabled })
            ) : (
              <>
                <button
                  ref={triggerRef}
                  type="button"
                  className="inputcn-country"
                  aria-haspopup="listbox"
                  aria-expanded={open}
                  aria-label={
                    country ? `Country: ${country.name}` : "Select country"
                  }
                  disabled={rest.disabled}
                  onClick={() => setOpen((o) => !o)}
                >
                  <span className="inputcn-iso">{country?.iso ?? "??"}</span>
                  <span className="inputcn-dial">+{country?.dial ?? ""}</span>
                  {CARET}
                </button>
                <span className="inputcn-divider" aria-hidden="true" />
              </>
            )}

            <input
              {...inputProps}
              {...ariaProps}
              id={id}
              className="inputcn-bare"
              aria-label={rest["aria-label"]}
              aria-labelledby={rest["aria-labelledby"]}
            />
          </div>

          {open ? (
            <div className="inputcn-popover">
              <div className="inputcn-popover-search">
                {/* eslint-disable-next-line jsx-a11y/no-autofocus -- focus belongs here on open */}
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => {
                    setQuery(e.currentTarget.value)
                    setActive(0)
                  }}
                  onKeyDown={onSearchKeyDown}
                  placeholder="Search country…"
                  aria-label="Search country"
                  aria-controls={`${id}-country-list`}
                  autoComplete="off"
                />
              </div>
              <ul
                className="inputcn-popover-list"
                role="listbox"
                aria-label="Countries"
                id={`${id}-country-list`}
              >
                {matches.length === 0 ? (
                  <li className="inputcn-popover-empty" role="presentation">
                    No country found.
                  </li>
                ) : (
                  matches.map((c, i) => (
                    <li key={c.iso} role="presentation">
                      <button
                        type="button"
                        role="option"
                        aria-selected={c.iso === country?.iso}
                        className="inputcn-popover-item"
                        data-active={i === active ? "true" : undefined}
                        onMouseEnter={() => setActive(i)}
                        onClick={() => choose(c.iso)}
                      >
                        <span className="inputcn-iso">{c.iso}</span>
                        <span className="inputcn-name">{c.name}</span>
                        <span className="inputcn-dial">+{c.dial}</span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>
          ) : null}
        </div>

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
          <p className="inputcn-hint" id={describedBy?.split(" ")[0]}>
            {hint}
          </p>
        ) : null}

        {hiddenInputProps ? <input {...hiddenInputProps} /> : null}
      </div>
    )
  },
)
