import { RotateCcw, Save } from 'lucide-react'
import { DetailActionBar, DetailPanel, DetailSection } from '@/components/ui/admin-detail'
import { formatSar } from '@/lib/formatters'
import type { AdminQueue, QueueAccessScope, QueueReleaseMode } from '@/types/admin'

interface QueueConfigurationPanelProps {
  form: AdminQueue
  onApply: () => void
  onReset: () => void
  saveMessage: string
  updateForm: <K extends keyof AdminQueue>(field: K, value: AdminQueue[K]) => void
}

export function QueueConfigurationPanel({
  form,
  onApply,
  onReset,
  saveMessage,
  updateForm,
}: QueueConfigurationPanelProps) {
  return (
    <DetailPanel>
      <DetailSection title="Identity">
        <label><div className="ui-detail-label">Queue name</div><input className="ui-input mt-2" value={form.name} onChange={(event) => updateForm('name', event.target.value)} /></label>
        <label><div className="ui-detail-label">Status</div><select className="ui-select mt-2 w-full" value={form.status} onChange={(event) => updateForm('status', event.target.value as AdminQueue['status'])}><option>Online</option><option>Offline</option></select></label>
        <label><div className="ui-detail-label">Audience</div><select className="ui-select mt-2 w-full" value={form.audience} onChange={(event) => updateForm('audience', event.target.value as QueueAccessScope)}><option>Students</option><option>Staff</option><option>Faculty</option><option>Mixed</option></select></label>
        <label className="ui-checkbox-line pt-7"><input type="checkbox" checked={form.enabled} onChange={(event) => updateForm('enabled', event.target.checked)} /><span>Queue enabled for submission and held-job routing</span></label>
        <label className="xl:col-span-2"><div className="ui-detail-label">Description</div><textarea className="ui-textarea mt-2" value={form.description} onChange={(event) => updateForm('description', event.target.value)} /></label>
      </DetailSection>

      <DetailSection title="Routing and release">
        <label><div className="ui-detail-label">Recorded release path</div><select className="ui-select mt-2 w-full" value={form.releaseMode} onChange={(event) => updateForm('releaseMode', event.target.value as QueueReleaseMode)}><option>Secure Release</option><option>Immediate</option><option>Kiosk Release</option></select></label>
        <label><div className="ui-detail-label">Cost per page</div><input type="number" step="0.01" className="ui-input mt-2" value={form.costPerPage} onChange={(event) => updateForm('costPerPage', Number(event.target.value))} /></label>
        <div>
          <div className="ui-detail-label">Current rate</div>
          <div className="mt-2 flex h-10 items-center border border-line bg-white px-3 text-sm font-medium text-ink-950">{formatSar(form.costPerPage)}</div>
        </div>
        <label className="ui-checkbox-line"><input type="checkbox" checked={form.defaultDuplex} onChange={(event) => updateForm('defaultDuplex', event.target.checked)} /><span>Default jobs to duplex printing</span></label>
        <div className="xl:col-span-2 rounded-none border border-line bg-mist-50 px-4 py-4 text-sm text-slate-600">
          Queues record the intended release path, but actual secure release behavior depends on the physical device and its embedded software. Device-specific authentication and color controls should be reviewed on the printer side, not here.
        </div>
      </DetailSection>

      <DetailSection title="Retention">
        <label><div className="ui-detail-label">Auto-delete after (hours)</div><input type="number" className="ui-input mt-2" value={form.autoDeleteAfterHours} onChange={(event) => updateForm('autoDeleteAfterHours', Number(event.target.value))} /></label>
        <div>
          <div className="ui-detail-label">Default failure handling</div>
          <div className="mt-2 flex min-h-10 items-center border border-line bg-white px-3 text-sm text-slate-600">
            {form.failureMode}
          </div>
        </div>
        <label className="xl:col-span-2"><div className="ui-detail-label">Notes</div><textarea className="ui-textarea mt-2" value={form.notes} onChange={(event) => updateForm('notes', event.target.value)} /></label>
      </DetailSection>

      <DetailActionBar className="xl:justify-between">
        <div className="text-sm text-slate-500">{saveMessage || 'Apply changes when the queue policy is ready.'}</div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="ui-button-ghost" onClick={onReset}><RotateCcw className="size-4" />Reset</button>
          <button type="button" className="ui-button" onClick={onApply}><Save className="size-4" />Apply</button>
        </div>
      </DetailActionBar>
    </DetailPanel>
  )
}
