import type { AdminPrinter } from '@/types/admin'
import { PrinterTonerField } from './PrinterTonerField'
import type { PrinterDetailForm, PrinterDetailFormChangeHandler } from './printer-detail-form'

interface PrinterDetailsPanelProps {
  form: PrinterDetailForm
  onFieldChange: PrinterDetailFormChangeHandler
}

export function PrinterDetailsPanel({ form, onFieldChange }: PrinterDetailsPanelProps) {
  return (
    <section className="ui-panel px-5 py-5">
      <div className="grid gap-4 xl:grid-cols-2">
        <label>
          <div className="ui-detail-label">Printer name</div>
          <input
            className="ui-input mt-2"
            value={form.name}
            onChange={(event) => onFieldChange('name', event.target.value)}
          />
        </label>
        <label>
          <div className="ui-detail-label">Hosted on</div>
          <input
            className="ui-input mt-2"
            value={form.hostedOn}
            onChange={(event) => onFieldChange('hostedOn', event.target.value)}
          />
        </label>
        <label>
          <div className="ui-detail-label">IP address</div>
          <input
            className="ui-input mt-2 font-mono"
            value={form.ipAddress}
            onChange={(event) => onFieldChange('ipAddress', event.target.value)}
          />
        </label>
        <label>
          <div className="ui-detail-label">Status</div>
          <select
            className="ui-select mt-2 w-full"
            value={form.status}
            onChange={(event) => onFieldChange('status', event.target.value as AdminPrinter['status'])}
          >
            <option>Online</option>
            <option>Offline</option>
            <option>Maintenance</option>
          </select>
        </label>
        <label>
          <div className="ui-detail-label">Type/Model</div>
          <input
            className="ui-input mt-2"
            value={form.model}
            onChange={(event) => onFieldChange('model', event.target.value)}
          />
        </label>
        <label>
          <div className="ui-detail-label">Serial number</div>
          <input
            className="ui-input mt-2 font-mono"
            value={form.serialNumber}
            onChange={(event) => onFieldChange('serialNumber', event.target.value)}
          />
        </label>
        <PrinterTonerField value={form.toner} onChange={(value) => onFieldChange('toner', value)} />
        <label>
          <div className="ui-detail-label">Location</div>
          <input
            className="ui-input mt-2"
            value={form.location}
            placeholder="Room 339 - Building 22"
            onChange={(event) => onFieldChange('location', event.target.value)}
          />
        </label>
        <label>
          <div className="ui-detail-label">Device release</div>
          <select
            className="ui-select mt-2 w-full"
            value={form.holdReleaseMode}
            onChange={(event) =>
              onFieldChange('holdReleaseMode', event.target.value as AdminPrinter['holdReleaseMode'])
            }
          >
            <option>Secure Release</option>
            <option>Immediate</option>
          </select>
        </label>
        <label>
          <div className="ui-detail-label">Color</div>
          <select
            className="ui-select mt-2 w-full"
            value={form.isColor ? 'Yes' : 'No'}
            onChange={(event) => onFieldChange('isColor', event.target.value === 'Yes')}
          >
            <option>No</option>
            <option>Yes</option>
          </select>
        </label>
      </div>
    </section>
  )
}
