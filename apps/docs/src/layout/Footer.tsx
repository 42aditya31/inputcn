import { Link } from "../router.js"
import { AUTHOR, REPO_URL } from "../site.js"

export function Footer() {
  return (
    <footer>
      <div className="foot">
        <span className="nm">inputcn</span>
        <span className="meta">MIT · v1.0 · 2026</span>
        <Link to="/docs">Docs</Link>
        <Link to="/components">Components</Link>
        <Link to="/blocks">Blocks</Link>
        <Link to="/docs/accessibility">Accessibility</Link>
        <a href={REPO_URL}>GitHub</a>
        <a href="/llms.txt">llms.txt</a>
        <span className="sp" />
        <span className="fine">
          Built by{" "}
          <a href={AUTHOR.url} target="_blank" rel="noreferrer noopener">
            {AUTHOR.name}
          </a>
          . Not affiliated with or endorsed by shadcn.
        </span>
      </div>

      <p className="foot-note">
        Accessibility: 50 axe-core checks run on every commit, and the four ARIA bugs they
        caught are written up in the audit. Screen readers have <b>not</b> been tested yet —
        until they are, this library is structurally accessible, not screen-reader verified.
      </p>
    </footer>
  )
}
