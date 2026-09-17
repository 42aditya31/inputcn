/**
 * Colour parsing, conversion and contrast. Framework-free.
 *
 * Canonical value is a hex string: `"#3A3FD6"`. Uppercase, always 6 digits
 * (alpha is carried separately when present), so two equal colours are always
 * string-equal — which matters the moment you diff or dedupe them.
 *
 * The contrast maths is the point of this module. `contrastAgainst` +
 * `minContrast` stops a customer picking a brand colour nobody can read, which
 * is an accessibility bug caught at the source rather than in an audit.
 */

import { scrub } from "@inputcn/core/paste"

export type ColorFormat = "hex" | "rgb" | "hsl"

export interface RGB {
  r: number
  g: number
  b: number
  /** 0–1. */
  a: number
}

// Hoisted — these run on every keystroke.
const HEX_RE = /^#?([a-f\d]{3,8})$/i
const RGB_RE = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.%]+))?\s*\)$/i
const HSL_RE = /^hsla?\(\s*([\d.]+)(?:deg)?[\s,]+([\d.]+)%[\s,]+([\d.]+)%(?:[\s,/]+([\d.%]+))?\s*\)$/i

const clamp = (n: number, lo: number, hi: number) => (n < lo ? lo : n > hi ? hi : n)
const byte = (n: number) => clamp(Math.round(n), 0, 255)

/** Parse hex, rgb() or hsl(). Returns null when unrecognisable. */
export function parseColor(input: string): RGB | null {
  const text = scrub(input).toLowerCase()
  if (!text) return null

  const hex = HEX_RE.exec(text)
  if (hex) return fromHexDigits(hex[1]!)

  const rgb = RGB_RE.exec(text)
  if (rgb) {
    return {
      r: byte(Number(rgb[1])),
      g: byte(Number(rgb[2])),
      b: byte(Number(rgb[3])),
      a: parseAlpha(rgb[4]),
    }
  }

  const hsl = HSL_RE.exec(text)
  if (hsl) {
    return {
      ...hslToRgb(Number(hsl[1]), Number(hsl[2]) / 100, Number(hsl[3]) / 100),
      a: parseAlpha(hsl[4]),
    }
  }

  return null
}

function parseAlpha(raw: string | undefined): number {
  if (raw === undefined) return 1
  const n = raw.endsWith("%") ? Number(raw.slice(0, -1)) / 100 : Number(raw)
  return Number.isFinite(n) ? clamp(n, 0, 1) : 1
}

function fromHexDigits(digits: string): RGB | null {
  // 3 and 4 digit shorthands expand by doubling each nibble.
  const expand = (s: string) => s.split("").map((c) => c + c).join("")
  let hex = digits
  if (hex.length === 3 || hex.length === 4) hex = expand(hex)
  if (hex.length !== 6 && hex.length !== 8) return null

  const int = Number.parseInt(hex, 16)
  if (!Number.isFinite(int)) return null

  if (hex.length === 6) {
    return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255, a: 1 }
  }
  return {
    r: (int >>> 24) & 255,
    g: (int >>> 16) & 255,
    b: (int >>> 8) & 255,
    a: (int & 255) / 255,
  }
}

function hslToRgb(h: number, s: number, l: number): Omit<RGB, "a"> {
  const hue = ((h % 360) + 360) % 360
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1))
  const m = l - c / 2
  const [r, g, b] =
    hue < 60 ? [c, x, 0]
    : hue < 120 ? [x, c, 0]
    : hue < 180 ? [0, c, x]
    : hue < 240 ? [0, x, c]
    : hue < 300 ? [x, 0, c]
    : [c, 0, x]
  return { r: byte((r + m) * 255), g: byte((g + m) * 255), b: byte((b + m) * 255) }
}

/* ------------------------------------------------------------------ *
 * Output
 * ------------------------------------------------------------------ */

const hex2 = (n: number) => byte(n).toString(16).padStart(2, "0").toUpperCase()

/** Canonical hex. Uppercase, with alpha only when it is not fully opaque. */
export function toHex({ r, g, b, a }: RGB): string {
  const base = `#${hex2(r)}${hex2(g)}${hex2(b)}`
  return a >= 1 ? base : base + hex2(a * 255)
}

export function toRgbString({ r, g, b, a }: RGB): string {
  return a >= 1 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${round2(a)})`
}

export function toHslString(rgb: RGB): string {
  const { h, s, l } = rgbToHsl(rgb)
  return rgb.a >= 1
    ? `hsl(${Math.round(h)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`
    : `hsla(${Math.round(h)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%, ${round2(rgb.a)})`
}

export function format(rgb: RGB, as: ColorFormat): string {
  return as === "rgb" ? toRgbString(rgb) : as === "hsl" ? toHslString(rgb) : toHex(rgb)
}

const round2 = (n: number) => Math.round(n * 100) / 100

export function rgbToHsl({ r, g, b }: RGB): { h: number; s: number; l: number } {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  const d = max - min
  if (d === 0) return { h: 0, s: 0, l }

  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  const h =
    max === rn ? ((gn - bn) / d + (gn < bn ? 6 : 0))
    : max === gn ? (bn - rn) / d + 2
    : (rn - gn) / d + 4
  return { h: h * 60, s, l }
}

/* ------------------------------------------------------------------ *
 * Contrast — WCAG 2.x relative luminance
 * ------------------------------------------------------------------ */

function channelLuminance(c: number): number {
  const v = c / 255
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
}

/** WCAG relative luminance, 0 (black) to 1 (white). */
export function luminance({ r, g, b }: RGB): number {
  return (
    0.2126 * channelLuminance(r) +
    0.7152 * channelLuminance(g) +
    0.0722 * channelLuminance(b)
  )
}

/** WCAG contrast ratio between two colours. 1:1 to 21:1. */
export function contrastRatio(a: RGB, b: RGB): number {
  const la = luminance(a)
  const lb = luminance(b)
  const lighter = Math.max(la, lb)
  const darker = Math.min(la, lb)
  return (lighter + 0.05) / (darker + 0.05)
}

/** Whichever of black or white reads better on this colour. */
export function bestForeground(bg: RGB): "#000000" | "#FFFFFF" {
  const white = contrastRatio(bg, { r: 255, g: 255, b: 255, a: 1 })
  const black = contrastRatio(bg, { r: 0, g: 0, b: 0, a: 1 })
  return white >= black ? "#FFFFFF" : "#000000"
}

export type WcagLevel = "AA" | "AAA" | "AA-large" | "fail"

/** Which WCAG threshold this ratio clears. */
export function wcagLevel(ratio: number): WcagLevel {
  if (ratio >= 7) return "AAA"
  if (ratio >= 4.5) return "AA"
  if (ratio >= 3) return "AA-large"
  return "fail"
}

/* ------------------------------------------------------------------ *
 * Paste
 * ------------------------------------------------------------------ */

/**
 * Extract a colour from pasted text — a bare hex, a devtools `rgb(...)`, or a
 * CSS declaration like `color: #3A3FD6;`.
 */
export function parsePastedColor(input: string): RGB | null {
  const text = scrub(input)
  if (!text) return null

  const direct = parseColor(text)
  if (direct) return direct

  // Pull the first colour-ish token out of a longer string.
  const token =
    /#[a-f\d]{3,8}\b/i.exec(text)?.[0] ??
    /rgba?\([^)]*\)/i.exec(text)?.[0] ??
    /hsla?\([^)]*\)/i.exec(text)?.[0]

  return token ? parseColor(token) : null
}

/** A small, deliberately neutral default palette. */
export const DEFAULT_SWATCHES: readonly string[] = [
  "#0F172A",
  "#DC2626",
  "#EA580C",
  "#CA8A04",
  "#16A34A",
  "#0891B2",
  "#2563EB",
  "#7C3AED",
  "#DB2777",
]
