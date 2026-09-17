import { useState } from "react"

import type { ComponentDoc } from "../content/components.js"
import {
  buildPrompt,
  claudeCodeLink,
  CLAUDE_LIMIT,
  cursorLink,
  vscodeLink,
  type Integration,
} from "../prompt.js"

const INTEGRATIONS: [Integration, string][] = [
  ["rhf", "react-hook-form"],
  ["action", "Server Action"],
  ["standalone", "No form library"],
]

/**
 * "Build this with Claude Code".
 *
 * The page below this block is written for a person. This block is written for
 * the agent that person is actually going to delegate to: pick how you want it
 * wired, and leave with a prompt that already contains the canonical value, the
 * real prop names and the traps.
 */
export function BuildWithAI({ c }: { c: ComponentDoc }) {
  const [integration, setIntegration] = useState<Integration>("rhf")
  const [withTests, setWithTests] = useState(false)
  const [copied, setCopied] = useState(false)
  const [shown, setShown] = useState(false)

  const prompt = buildPrompt(c, { integration, withTests })
  const chars = prompt.length
  const overClaude = chars > CLAUDE_LIMIT

  function copy() {
    navigator.clipboard?.writeText(prompt).catch(() => {})
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1400)
  }

  return (
    <section className="bwa" aria-labelledby="bwa-h">
      <div className="bwa-head">
        <div>
          <div className="eyebrow ac">Build with an agent</div>
          <h2 id="bwa-h">Hand this to Claude Code</h2>
        </div>
        <span className="bwa-count" aria-live="polite">
          {chars.toLocaleString("en-GB")} chars
        </span>
      </div>

      <p className="bwa-lede">
        Most people reach this component through an agent rather than by reading the page.
        Pick how you want it wired and take a prompt that already carries the canonical
        value, the real prop names and the mistakes worth avoiding.
      </p>

      <div className="bwa-controls">
        <div className="ctl">
          <span>Wiring</span>
          <div className="seg">
            {INTEGRATIONS.map(([key, label]) => (
              <button
                key={key}
                type="button"
                aria-pressed={integration === key}
                onClick={() => setIntegration(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="ctl">
          <span>Extras</span>
          <div className="seg">
            <button
              type="button"
              aria-pressed={withTests}
              onClick={() => setWithTests((v) => !v)}
            >
              Include a test
            </button>
          </div>
        </div>
      </div>

      <div className="bwa-actions">
        <a
          className="bwa-btn primary"
          href={claudeCodeLink(prompt)}
          {...(overClaude ? { "aria-disabled": true, onClick: (e: React.MouseEvent) => e.preventDefault() } : {})}
        >
          <ClaudeMark />
          Open in Claude Code
        </a>

        <a className="bwa-btn" href={vscodeLink(prompt)}>
          VS Code
        </a>

        <a className="bwa-btn" href={cursorLink(prompt)} target="_blank" rel="noreferrer noopener">
          Cursor
        </a>

        <button className="bwa-btn" type="button" onClick={copy}>
          {copied ? "Copied" : "Copy prompt"}
        </button>

        <button
          className="bwa-btn ghost"
          type="button"
          aria-expanded={shown}
          onClick={() => setShown((v) => !v)}
        >
          {shown ? "Hide" : "Read it first"}
        </button>
      </div>

      {shown ? (
        <pre className="bwa-prompt">
          <code>{prompt}</code>
        </pre>
      ) : null}

      <p className="bwa-note">
        {overClaude ? (
          <>
            <strong>This prompt is over Claude Code&rsquo;s 5,000-character limit.</strong> Turn
            an option off, or use Copy prompt. Cursor allows 10,000.
          </>
        ) : (
          <>
            Nothing runs on its own. The link opens the tool with the prompt typed into the
            box; you read it and press Enter. If the button does nothing, Claude Code is not
            installed on this machine — use <strong>Copy prompt</strong> instead.
          </>
        )}
      </p>
    </section>
  )
}

function ClaudeMark() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2.6 21.4 19H2.6L12 2.6Zm0 4.6L6.6 16.7h10.8L12 7.2Z" />
    </svg>
  )
}
