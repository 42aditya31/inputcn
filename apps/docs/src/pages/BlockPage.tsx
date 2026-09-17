import { useState } from "react"

import type { Block } from "../content/blocks.js"
import { BY_SLUG } from "../content/components.js"
import { buildBlockPrompt, claudeCodeLink, CLAUDE_LIMIT } from "../prompt.js"
import { Link } from "../router.js"
import { Code, Table } from "../ui.js"

export function BlockPage({ block }: { block: Block }) {
  const [tab, setTab] = useState<"preview" | "code">("preview")
  const [copied, setCopied] = useState<"code" | "prompt" | null>(null)

  const prompt = buildBlockPrompt(block)
  const overLimit = prompt.length > CLAUDE_LIMIT
  const Demo = block.demo

  function copy(what: "code" | "prompt") {
    navigator.clipboard?.writeText(what === "code" ? block.source : prompt).catch(() => {})
    setCopied(what)
    window.setTimeout(() => setCopied(null), 1400)
  }

  return (
    <>
      <div className="page-hero">
        <div className="gridlines wide" />
        <div className="glow left" />
        <div className="page-hero-in">
          <div className="eyebrow">
            <Link to="/blocks">Blocks</Link> / {block.name}
          </div>
          <h1 className="gradient-title">{block.name}</h1>
          <p>{block.tagline}</p>
        </div>
      </div>

      <div className="sec" style={{ paddingTop: 34, paddingBottom: 80 }}>
        <div className="block-bar">
          <div className="seg">
            <button type="button" aria-pressed={tab === "preview"} onClick={() => setTab("preview")}>
              Preview
            </button>
            <button type="button" aria-pressed={tab === "code"} onClick={() => setTab("code")}>
              Code
            </button>
          </div>

          <span style={{ flex: 1 }} />

          <a
            className="bwa-btn primary"
            href={claudeCodeLink(prompt)}
            {...(overLimit
              ? { "aria-disabled": true, onClick: (e: React.MouseEvent) => e.preventDefault() }
              : {})}
          >
            Open in Claude Code
          </a>
          <button className="bwa-btn" type="button" onClick={() => copy("prompt")}>
            {copied === "prompt" ? "Copied" : "Copy prompt"}
          </button>
          <button className="bwa-btn" type="button" onClick={() => copy("code")}>
            {copied === "code" ? "Copied" : "Copy code"}
          </button>
        </div>

        {tab === "preview" ? (
          <div className="block-stage">
            <div className="block-form">
              <Demo />
            </div>
          </div>
        ) : (
          <Code code={block.source} />
        )}

        <p className="bwa-note" style={{ marginTop: 14 }}>
          This is a live form, not a screenshot — fill it in and submit it. The code tab is
          the exact file that is running, read from disk at build time, so the two cannot
          drift.{" "}
          {overLimit ? (
            <>
              <strong>The prompt for this block exceeds the 5,000-character deep-link
              limit</strong>, so use Copy prompt instead.
            </>
          ) : null}
        </p>

        <h2 className="doc-h2" id="what" style={{ marginTop: 44 }}>
          What it is doing
        </h2>
        <div className="doc-prose">
          <p>{block.about}</p>
        </div>

        <h2 className="doc-h2" id="submits">
          What it submits
        </h2>
        <Table
          cols={["FIELD", "VALUE"]}
          rows={block.emits.map(([name, what]) => [name, what] as const)}
        />

        <h2 className="doc-h2" id="uses">
          Components used
        </h2>
        <div className="lib-grid">
          {block.uses.map((slug) => {
            const c = BY_SLUG.get(slug)
            if (!c) return null
            return (
              <Link className="lib-card" key={slug} to={`/components/${slug}`}>
                <div className="top">
                  <span className="nm">{c.name}</span>
                  <span style={{ flex: 1 }} />
                  <span className="pill-t">{c.t}</span>
                </div>
                <p>{c.tagline}</p>
                <div className="go">
                  <span>Open docs</span>
                  <i>→</i>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </>
  )
}
