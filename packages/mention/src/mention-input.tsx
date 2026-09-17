"use client"

import { forwardRef, useId, useImperativeHandle, type ReactNode } from "react"

import { initials } from "./mention.js"
import {
  useMentionInput,
  type UseMentionInputOptions,
} from "./use-mention-input.js"

export type MentionLayout = "compact" | "rich"

export interface MentionInputProps extends UseMentionInputOptions {
  /** Visible label. Supply this or `aria-label` — a field with neither has no accessible name. */
  label?: ReactNode
  /** Helper text under the field. Replaced by the error message while one is showing. */
  hint?: ReactNode
  /** `compact` fits more people on screen; `rich` disambiguates duplicate names. */
  layout?: MentionLayout
  rows?: number
}

export const MentionInput = forwardRef<HTMLTextAreaElement, MentionInputProps>(
  function MentionInput(
    { label, hint, layout = "compact", rows = 3, className, id: idProp, ...rest },
    ref,
  ) {
    const reactId = useId()
    const id = idProp ?? reactId

    const api = useMentionInput({ ...rest, id })
    const {
      textareaProps,
      ariaProps,
      containerProps,
      hiddenInputProps,
      ownsErrorUI,
      errorText,
      errorId,
      visible,
      suggestions,
      open,
      activeIndex,
      select,
    } = api

    useImperativeHandle(
      ref,
      () =>
        textareaProps.ref.current ??
        ({ focus: () => textareaProps.ref.current?.focus() } as HTMLTextAreaElement),
      [textareaProps.ref],
    )

    const listId = `${id}-suggestions`

    return (
      <div className={`inputcn-field ${className ?? ""}`.trim()} {...containerProps}>
        {label === undefined ? null : (
          <label className="inputcn-label" htmlFor={id}>
            {label}
          </label>
        )}

        <div className="inputcn-relative">
          <textarea
            {...textareaProps}
            {...ariaProps}
            id={id}
            rows={rows}
            className="inputcn-textarea"
            // No role="combobox": ARIA 1.2 permits that role on <input>, not
            // on a multi-line control, and axe rejects it. A textarea is
            // already a textbox, which allows aria-activedescendant — so the
            // active option is announced, and the live region below reports
            // that suggestions appeared.
            aria-controls={open ? listId : undefined}
            aria-activedescendant={
              open ? `${id}-option-${activeIndex}` : undefined
            }
            aria-label={rest["aria-label"]}
            aria-labelledby={rest["aria-labelledby"]}
          />

          {open ? (
            <div className="inputcn-popover">
              <ul
                className="inputcn-popover-list"
                role="listbox"
                aria-label="People you can mention"
                id={listId}
              >
                {suggestions.map((p, i) => (
                  // role="presentation" so the option is a direct child of the
                  // listbox in the accessibility tree, as ARIA requires.
                  <li key={p.id} role="presentation">
                    <button
                      type="button"
                      role="option"
                      id={`${id}-option-${i}`}
                      aria-selected={i === activeIndex}
                      className={`inputcn-popover-item${layout === "rich" ? " inputcn-rich" : ""}`}
                      data-active={i === activeIndex ? "true" : undefined}
                      // Mouse-down would blur the textarea before the click
                      // lands, closing the list out from under the pointer.
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => select(p)}
                    >
                      {layout === "rich" ? (
                        <>
                          <span className="inputcn-avatar" aria-hidden="true">
                            {initials(p.name)}
                          </span>
                          <span className="inputcn-meta">
                            <span className="inputcn-meta-name">{p.name}</span>
                            <span className="inputcn-meta-detail">
                              @{p.handle}
                              {p.detail ? ` · ${p.detail}` : ""}
                            </span>
                          </span>
                          {p.badge ? (
                            <span className="inputcn-role">{p.badge}</span>
                          ) : null}
                        </>
                      ) : (
                        <>
                          <span className="inputcn-name">{p.name}</span>
                          <span className="inputcn-dial">@{p.handle}</span>
                        </>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        {/* Announces that suggestions appeared, since the textarea cannot
            carry combobox semantics. Polite, so it never interrupts typing. */}
        <span className="inputcn-sr-only" role="status" aria-live="polite">
          {open
            ? `${suggestions.length} ${suggestions.length === 1 ? "person" : "people"} available`
            : ""}
        </span>

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
