/**
 * IPv4 address and CIDR parsing. Framework-free.
 *
 * Canonical value is the address as typed: `"10.0.0.0/24"` or `"192.168.1.1"`.
 *
 * `maxPrefix` is the constraint that earns its keep: it stops an admin
 * allow-listing `0.0.0.0/0` by accident, which is a security incident rather
 * than a validation error.
 */

import { scrub } from "@inputcn/core/paste"

export interface ParsedIp {
  octets: [number, number, number, number]
  /** 0–32. 32 when no CIDR suffix was written. */
  prefix: number
  /** True when the input carried an explicit `/n`. */
  hasPrefix: boolean
  /** Dotted quad without the suffix. */
  address: string
  /** Canonical text, including the suffix only if one was given. */
  canonical: string
}

// Hoisted — runs on every keystroke.
const IPV4_RE = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})(?:\/(\d{1,2}))?$/

/** Parse an IPv4 address with an optional CIDR suffix. */
export function parseIp(input: string): ParsedIp | null {
  const text = scrub(input)
  const m = IPV4_RE.exec(text)
  if (!m) return null

  const octets = [m[1]!, m[2]!, m[3]!, m[4]!].map(Number) as [number, number, number, number]
  for (const o of octets) {
    if (!Number.isInteger(o) || o < 0 || o > 255) return null
  }
  // Reject "01.2.3.4": a leading zero means octal in some resolvers, which is
  // a classic parser-confusion bug.
  for (const part of [m[1]!, m[2]!, m[3]!, m[4]!]) {
    if (part.length > 1 && part.startsWith("0")) return null
  }

  const hasPrefix = m[5] !== undefined
  const prefix = hasPrefix ? Number(m[5]) : 32
  if (prefix < 0 || prefix > 32) return null

  const address = octets.join(".")
  return {
    octets,
    prefix,
    hasPrefix,
    address,
    canonical: hasPrefix ? `${address}/${prefix}` : address,
  }
}

export function isValidIp(input: string): boolean {
  return parseIp(input) !== null
}

/** Address as a 32-bit unsigned integer. */
export function toInt({ octets }: ParsedIp): number {
  return ((octets[0] << 24) >>> 0) + (octets[1] << 16) + (octets[2] << 8) + octets[3]
}

export function fromInt(n: number): string {
  return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join(".")
}

export interface Range {
  network: string
  broadcast: string
  firstHost: string
  lastHost: string
  /** Usable host addresses. /31 and /32 are special-cased per RFC 3021. */
  hosts: number
  netmask: string
}

/** Network, broadcast and usable host range for a CIDR block. */
export function cidrRange(parsed: ParsedIp): Range {
  const { prefix } = parsed
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0
  const addr = toInt(parsed)
  const network = (addr & mask) >>> 0
  const broadcast = (network | (~mask >>> 0)) >>> 0
  const size = 2 ** (32 - prefix)

  // /31 is a point-to-point link (2 usable), /32 is a single host (1).
  const hosts = prefix >= 31 ? size : Math.max(0, size - 2)
  const firstHost = prefix >= 31 ? network : network + 1
  const lastHost = prefix >= 31 ? broadcast : Math.max(network, broadcast - 1)

  return {
    network: fromInt(network),
    broadcast: fromInt(broadcast),
    firstHost: fromInt(firstHost),
    lastHost: fromInt(lastHost),
    hosts,
    netmask: fromInt(mask),
  }
}

/* ------------------------------------------------------------------ *
 * Classification
 * ------------------------------------------------------------------ */

/** RFC 1918 private ranges. */
export function isPrivate({ octets }: ParsedIp): boolean {
  const [a, b] = octets
  if (a === 10) return true
  if (a === 172 && b >= 16 && b <= 31) return true
  if (a === 192 && b === 168) return true
  return false
}

export function isLoopback({ octets }: ParsedIp): boolean {
  return octets[0] === 127
}

/** RFC 3927 link-local. */
export function isLinkLocal({ octets }: ParsedIp): boolean {
  return octets[0] === 169 && octets[1] === 254
}

export function isMulticast({ octets }: ParsedIp): boolean {
  return octets[0] >= 224 && octets[0] <= 239
}

export function isReserved({ octets }: ParsedIp): boolean {
  return octets[0] === 0 || octets[0] >= 240
}

/** A short human label for the address class, or null when it is ordinary. */
export function classify(parsed: ParsedIp): string | null {
  if (isLoopback(parsed)) return "loopback"
  if (isPrivate(parsed)) return "private"
  if (isLinkLocal(parsed)) return "link-local"
  if (isMulticast(parsed)) return "multicast"
  if (isReserved(parsed)) return "reserved"
  return null
}

/** Smart paste — pull an address out of a log line or a config snippet. */
export function parsePastedIp(input: string): string | null {
  const text = scrub(input)
  if (!text) return null
  if (parseIp(text)) return text

  const token = /\b\d{1,3}(?:\.\d{1,3}){3}(?:\/\d{1,2})?\b/.exec(text)
  return token && parseIp(token[0]) ? token[0] : null
}
