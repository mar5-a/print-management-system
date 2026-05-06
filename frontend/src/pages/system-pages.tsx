import { PageHeader } from '../components/ui/page-header'

export function AboutPage() {
  return (
    <div className="min-w-0">
      <PageHeader eyebrow="About" title="System information" description="Minimal operational metadata for the in-house build." />

      <section className="ui-panel overflow-hidden">
        <div className="grid gap-0 md:grid-cols-3">
          <div className="border-b border-line px-5 py-4 md:border-r md:border-b-0">
            <div className="ui-heading">Build</div>
            <div className="mt-3 text-lg font-semibold text-ink-950">Admin pilot</div>
            <div className="mt-1 text-sm text-slate-500">Frontend prototype</div>
          </div>
          <div className="border-b border-line px-5 py-4 md:border-r md:border-b-0">
            <div className="ui-heading">Auth target</div>
            <div className="mt-3 text-lg font-semibold text-ink-950">Windows AD</div>
            <div className="mt-1 text-sm text-slate-500">Final integration deferred</div>
          </div>
          <div className="px-5 py-4">
            <div className="ui-heading">Current scope</div>
            <div className="mt-3 text-lg font-semibold text-ink-950">Admin operations</div>
            <div className="mt-1 text-sm text-slate-500">Users, groups, printers, logs</div>
          </div>
        </div>

        <div className="border-t border-line px-5 py-5">
          <div className="ui-heading">Project notes</div>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <p>This page exists as a placeholder until system metadata and deployment details are formally specified.</p>
            <p>The current UI is intentionally minimal and oriented toward admin workflows rather than PaperCut feature parity.</p>
          </div>
        </div>
      </section>
    </div>
  )
}
