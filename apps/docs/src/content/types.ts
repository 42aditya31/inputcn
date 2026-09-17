import type { ReactNode } from "react"

export type Block =
  | { kind: "prose"; id: string; heading: string; body: ReactNode[] }
  | { kind: "code"; id: string; heading: string; code: string; caption?: ReactNode }
  | {
      kind: "table"
      id: string
      heading: string
      cols: [string, string, string] | [string, string]
      rows: (readonly ReactNode[])[]
    }

export interface GuidePage {
  slug: string
  group: string
  label: string
  title: string
  lede: ReactNode
  blocks: Block[]
  note?: ReactNode
}

/** Every page the router can reach under /docs, in sidebar order. */
export interface NavItem {
  slug: string
  label: string
  href: string
}

export interface NavGroup {
  group: string
  items: NavItem[]
}
