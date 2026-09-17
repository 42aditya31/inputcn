"use client"

import { createContext, useContext, useMemo, type ReactNode } from "react"
import type { FieldMode, MessageMap } from "./types.js"

export interface InputcnContextValue {
  messages?: MessageMap
  locale?: string
  /** Force every descendant into a mode. Used by form adapters. */
  mode?: FieldMode
}

/**
 * Deliberately defaults to an empty object rather than `null`: the provider is
 * OPTIONAL. A provider you must remember to mount is a provider people forget,
 * and everything must work without one.
 */
const EMPTY: InputcnContextValue = Object.freeze({})

export const InputcnContext = createContext<InputcnContextValue>(EMPTY)

export function useInputcnContext(): InputcnContextValue {
  return useContext(InputcnContext)
}

export interface InputcnProviderProps extends InputcnContextValue {
  children: ReactNode
}

export function InputcnProvider({
  children,
  messages,
  locale,
  mode,
}: InputcnProviderProps) {
  // Primitive deps — the object identity only changes when something real did.
  const value = useMemo<InputcnContextValue>(
    () => ({ messages, locale, mode }),
    [messages, locale, mode],
  )
  return <InputcnContext.Provider value={value}>{children}</InputcnContext.Provider>
}

/**
 * Set by a form adapter (e.g. our shadcn `<FormControl>` wrapper) to put the
 * nearest field into managed mode without the user passing a prop.
 */
export const FieldModeContext = createContext<FieldMode | undefined>(undefined)

export function useFieldModeContext(): FieldMode | undefined {
  return useContext(FieldModeContext)
}
