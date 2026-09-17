import type { GuidePage as Guide } from "../content/types.js"
import { DocsLayout } from "../layout/DocsLayout.js"
import { Code, Table } from "../ui.js"

export function GuidePageView({ guide }: { guide: Guide }) {
  const toc = guide.blocks.map((b) => ({ id: b.id, label: b.heading }))

  return (
    <DocsLayout
      eyebrow={`${guide.group} / ${guide.label}`}
      title={guide.title}
      lede={guide.lede}
      toc={toc}
      {...(guide.note ? { note: guide.note } : {})}
    >
      {guide.blocks.map((b) => (
        <section key={b.id}>
          <h2 className="doc-h2" id={b.id}>
            {b.heading}
          </h2>

          {b.kind === "prose" ? (
            <div className="doc-prose">
              {b.body.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          ) : null}

          {b.kind === "code" ? (
            <>
              <Code code={b.code} />
              {b.caption ? (
                <div className="doc-prose">
                  <p>{b.caption}</p>
                </div>
              ) : null}
            </>
          ) : null}

          {b.kind === "table" ? <Table cols={b.cols} rows={b.rows} /> : null}
        </section>
      ))}
    </DocsLayout>
  )
}
