"use client"

import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react"

import { clipboardText } from "@inputcn/core/paste"
import type { BaseFieldProps, Rule } from "@inputcn/core/types"
import { useField, type UseFieldResult } from "@inputcn/core/use-field"
import {
  custom,
  maxLength as maxLengthRule,
  required as requiredRule,
  rules,
} from "@inputcn/core/validity"

import {
  EMPTY_MENTION,
  activeQuery,
  applyMention,
  makeValue,
  parsePastedMention,
  search,
  type MentionValue,
  type Person,
} from "./mention.js"

export interface MentionConstraints {
  maxLength?: number
  minMentions?: number
  /** Caps notification blast radius. */
  maxMentions?: number
}

export interface UseMentionInputOptions
  extends BaseFieldProps<MentionValue>,
    MentionConstraints {
  people: readonly Person[]
  /** Suggestions shown at once. Default 8. */
  limit?: number
}

export interface UseMentionInputResult extends UseFieldResult<MentionValue> {
  /** Suggestions for the query the caret is currently inside. */
  suggestions: Person[]
  open: boolean
  /** Index of the highlighted suggestion. */
  activeIndex: number
  select: (person: Person) => void
  close: () => void
  textareaProps: {
    ref: React.RefObject<HTMLTextAreaElement | null>
    value: string
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
    onKeyDown: (e: KeyboardEvent<HTMLTextAreaElement>) => void
    onPaste: (e: ClipboardEvent<HTMLTextAreaElement>) => void
    onSelect: () => void
    disabled: boolean | undefined
    readOnly: boolean | undefined
    placeholder: string | undefined
  }
}

export function useMentionInput(
  options: UseMentionInputOptions,
): UseMentionInputResult {
  const {
    people,
    limit = 8,
    maxLength,
    minMentions,
    maxMentions,
    required,
    validate,
    disabled,
    readOnly,
    placeholder,
    ...base
  } = options

  const ruleList = useMemo<ReadonlyArray<Rule<MentionValue>>>(
    () =>
      rules<MentionValue>(
        requiredRule<MentionValue>(required),
        maxLength !== undefined && {
          rule: "maxLength",
          params: { maxLength },
          test: (v: MentionValue) => v.text.length <= maxLength,
        },
        minMentions !== undefined && {
          rule: "minItems",
          params: { minItems: minMentions },
          test: (v: MentionValue) => v.ids.length >= minMentions,
        },
        maxMentions !== undefined && {
          rule: "maxItems",
          params: { maxItems: maxMentions },
          test: (v: MentionValue) => v.ids.length <= maxMentions,
        },
        custom<MentionValue>(validate),
      ),
    [required, maxLength, minMentions, maxMentions, validate],
  )

  const field = useField<MentionValue>({
    component: "MentionInput",
    emptyValue: EMPTY_MENTION,
    rules: ruleList,
    ...base,
    required,
    disabled,
    readOnly,
    // FormData carries the text; ids are derivable and would be redundant.
    serialize: (v) => v.text,
  })

  const { value, setValue } = field
  const ref = useRef<HTMLTextAreaElement | null>(null)

  const [caret, setCaret] = useState(0)
  const [dismissed, setDismissed] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  const query = useMemo(
    () => (dismissed ? null : activeQuery(value.text, caret)),
    [dismissed, value.text, caret],
  )

  const suggestions = useMemo(
    () => (query ? search(people, query.query, limit) : []),
    [query, people, limit],
  )

  const open = query !== null && suggestions.length > 0

  const commit = useCallback(
    (text: string) => {
      // Ids are recomputed from the text every time, so editing a mention out
      // removes the notification with it.
      setValue(makeValue(text, people))
    },
    [setValue, people],
  )

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (disabled || readOnly) return
      setDismissed(false)
      setActiveIndex(0)
      setCaret(e.currentTarget.selectionStart ?? 0)
      commit(e.currentTarget.value)
    },
    [disabled, readOnly, commit],
  )

  // Arrow-key navigation must not move the caret while the picker is open, so
  // the textarea's own handling is suppressed.
  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (!open) return
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1))
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setActiveIndex((i) => Math.max(i - 1, 0))
      } else if (e.key === "Enter" || e.key === "Tab") {
        const pick = suggestions[activeIndex]
        if (!pick || !query) return
        e.preventDefault()
        const next = applyMention(value.text, query, pick)
        commit(next.text)
        setCaret(next.caret)
        setDismissed(false)
        setActiveIndex(0)
        requestAnimationFrame(() => {
          ref.current?.setSelectionRange(next.caret, next.caret)
        })
      } else if (e.key === "Escape") {
        e.preventDefault()
        setDismissed(true)
      }
    },
    [open, suggestions, activeIndex, query, value.text, commit],
  )

  const select = useCallback(
    (person: Person) => {
      if (!query || disabled || readOnly) return
      const next = applyMention(value.text, query, person)
      commit(next.text)
      setCaret(next.caret)
      setDismissed(false)
      setActiveIndex(0)
      ref.current?.focus()
      requestAnimationFrame(() => {
        ref.current?.setSelectionRange(next.caret, next.caret)
      })
    },
    [query, disabled, readOnly, value.text, commit],
  )

  const close = useCallback(() => setDismissed(true), [])

  // Keep the caret position current when the user clicks or arrows around, so
  // the picker opens for the mention they are actually inside.
  const onSelect = useCallback(() => {
    setCaret(ref.current?.selectionStart ?? 0)
  }, [])

  const onPaste = useCallback(
    (e: ClipboardEvent<HTMLTextAreaElement>) => {
      if (disabled || readOnly) return
      const text = clipboardText(e)
      if (!text) return
      e.preventDefault()
      const el = ref.current
      const start = el?.selectionStart ?? value.text.length
      const end = el?.selectionEnd ?? start
      const pasted = parsePastedMention(text, people)
      if (!pasted) return
      const next = value.text.slice(0, start) + pasted.text + value.text.slice(end)
      commit(next)
      const at = start + pasted.text.length
      setCaret(at)
      requestAnimationFrame(() => el?.setSelectionRange(at, at))
    },
    [disabled, readOnly, value.text, people, commit],
  )

  const textareaProps = useMemo(
    () => ({
      ref,
      value: value.text,
      onChange,
      onKeyDown,
      onPaste,
      onSelect,
      disabled,
      readOnly,
      placeholder: placeholder ?? "Type @ to mention someone…",
    }),
    [value.text, onChange, onKeyDown, onPaste, onSelect, disabled, readOnly, placeholder],
  )

  return { ...field, suggestions, open, activeIndex, select, close, textareaProps }
}
