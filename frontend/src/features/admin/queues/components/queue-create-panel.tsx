import { Plus } from 'lucide-react'
import type { QueueDraft } from '../types'
import type { AdminGroup, AdminPrinter, QueueAccessScope, QueueReleaseMode } from '@/types/admin'

interface QueueCreatePanelProps {
  draft: QueueDraft
  groups: AdminGroup[]
  printers: AdminPrinter[]
  onCancel: () => void
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
  setDraft: React.Dispatch<React.SetStateAction<QueueDraft>>
  toggleDraftSelection: (field: 'printerIds' | 'allowedGroups', value: string) => void
}

export function QueueCreatePanel({
  draft,
  groups,
  onCancel,
  onSubmit,
  printers,
  setDraft,
  toggleDraftSelection,
}: QueueCreatePanelProps) {
  return (
    <section className="ui-panel mb-5 overflow-hidden">
      <div className="border-b border-line bg-accent-100/35 px-5 py-4">
        <div className="ui-kicker text-accent-700">New queue draft</div>
        <div className="mt-1 text-base font-semibold text-ink-950">Create a first-class queue record</div>
      </div>

      <form onSubmit={onSubmit}>
        <div className="grid gap-6 border-b border-line px-5 py-5 lg:grid-cols-[220px_minmax(0,1fr)]">
          <div><div className="text-sm font-medium text-ink-950">Queue identity</div></div>
          <div className="grid gap-4 lg:grid-cols-2">
            <label><div className="ui-heading">Queue name</div><input className="ui-input mt-2" value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} placeholder="Student Duplex Queue" /></label>
            <label>
              <div className="ui-heading">Audience</div>
              <select className="ui-select mt-2 w-full" value={draft.audience} onChange={(event) => setDraft((current) => ({ ...current, audience: event.target.value as QueueAccessScope }))}>
                <option>Students</option><option>Staff</option><option>Faculty</option><option>Mixed</option>
              </select>
            </label>
            <label>
              <div className="ui-heading">Recorded release path</div>
              <select className="ui-select mt-2 w-full" value={draft.releaseMode} onChange={(event) => setDraft((current) => ({ ...current, releaseMode: event.target.value as QueueReleaseMode }))}>
                <option>Secure Release</option><option>Immediate</option><option>Kiosk Release</option>
              </select>
            </label>
            <label className="flex items-center gap-3 pt-7"><input type="checkbox" checked={draft.enabled} onChange={(event) => setDraft((current) => ({ ...current, enabled: event.target.checked }))} /><span className="text-sm text-ink-950">Queue enabled on creation</span></label>
            <label className="lg:col-span-2"><div className="ui-heading">Description</div><textarea className="ui-textarea mt-2" value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} placeholder="Describe queue purpose, restriction scope, and routing assumptions." /></label>
            <div className="rounded-none border border-line bg-mist-50 px-4 py-4 text-sm text-slate-600 lg:col-span-2">
              This field records the planned release path for the queue. Actual secure release still depends on printer-side software and device capabilities.
            </div>
          </div>
        </div>

        <div className="grid gap-6 border-b border-line px-5 py-5 lg:grid-cols-[220px_minmax(0,1fr)]">
          <div><div className="text-sm font-medium text-ink-950">Assignments and access</div></div>
          <div className="grid gap-5 lg:grid-cols-2">
            <div>
              <div className="ui-heading">Assigned printers</div>
              <div className="mt-2 text-sm text-slate-500">Each printer belongs to one queue at a time. Selecting it here reassigns it from any existing queue.</div>
              <div className="mt-3 grid gap-2">
                {printers.map((printer) => (
                  <label key={printer.id} className="flex items-start gap-3 border border-line bg-mist-50 px-3 py-3">
                    <input type="checkbox" checked={draft.printerIds.includes(printer.id)} onChange={() => toggleDraftSelection('printerIds', printer.id)} />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-ink-950">{printer.name}</span>
                      <span className="mt-1 block text-sm text-slate-500">{printer.location} · {printer.status}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <div className="ui-heading">Allowed groups</div>
              <div className="mt-3 grid gap-2">
                {groups.map((group) => (
                  <label key={group.id} className="flex items-start gap-3 border border-line bg-white px-3 py-3">
                    <input type="checkbox" checked={draft.allowedGroups.includes(group.name)} onChange={() => toggleDraftSelection('allowedGroups', group.name)} />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-ink-950">{group.name}</span>
                      <span className="mt-1 block text-sm text-slate-500">{group.description}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
          <p className="max-w-3xl text-sm text-slate-500">Deletion stays blocked automatically whenever the queue later accumulates active or held jobs.</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="ui-button-ghost" onClick={onCancel}>Cancel</button>
            <button type="submit" className="ui-button"><Plus className="size-4" />Create queue</button>
          </div>
        </div>
      </form>
    </section>
  )
}
