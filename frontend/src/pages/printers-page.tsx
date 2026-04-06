import { useDeferredValue, useMemo, useState } from 'react'
import { ArrowRightLeft, Power, Printer, Wrench } from 'lucide-react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { ActionRail } from '../components/ui/action-rail'
import { DataTable } from '../components/ui/data-table'
import { FilterBar } from '../components/ui/filter-bar'
import { PageHeader } from '../components/ui/page-header'
import { SectionTabs } from '../components/ui/section-tabs'
import { StatusBadge } from '../components/ui/status-badge'
import { adminPrinters, getPrinterById } from '../data/admin-data'
import type { AdminPrinter } from '../types/admin'

export function PrintersPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)

  const filteredPrinters = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase()
    return adminPrinters.filter((printer) =>
      [printer.name, printer.model, printer.location, printer.queue].some((value) =>
        value.toLowerCase().includes(query),
      ),
    )
  }, [deferredSearch])

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
      <div className="min-w-0">
        <PageHeader
          eyebrow="Printers"
          title="Device and queue operations"
        />

        <FilterBar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search printers"
        />

        <div className="mt-4">
          <DataTable<AdminPrinter>
            columns={[
              {
                key: 'device',
                header: 'Printer',
                render: (printer) => <span className="font-semibold text-ink-950">{printer.name}</span>,
              },
              {
                key: 'software',
                header: 'Software version',
                render: (printer) => <span className="text-sm text-slate-600">{printer.softwareVersion}</span>,
              },
              {
                key: 'status',
                header: 'Activation status',
                render: (printer) => (
                  <span
                    className={
                      printer.status === 'Online'
                        ? 'text-sm text-accent-700'
                        : printer.status === 'Offline'
                          ? 'text-sm text-danger-500'
                          : 'text-sm text-warn-500'
                    }
                  >
                    {printer.status}
                  </span>
                ),
              },
              {
                key: 'jobs',
                header: 'Jobs',
                render: (printer) => <span className="text-sm text-slate-600">{printer.releasedToday}</span>,
              },
              {
                key: 'held-jobs',
                header: 'Held jobs',
                render: (printer) => <span className="text-sm text-slate-600">{printer.pendingJobs}</span>,
              },
            ]}
            rows={filteredPrinters}
            getRowKey={(printer) => printer.id}
            onRowClick={(printer) => navigate(`/admin/printers/${printer.id}`)}
            emptyLabel="No printers match the current search."
          />
        </div>
      </div>

      <ActionRail
        title="Printer controls"
        items={[
          { label: 'Redirect blocked jobs', icon: ArrowRightLeft },
          { label: 'Enable or disable queue link', icon: Power },
          { label: 'Update service mode', icon: Wrench },
        ]}
      />
    </div>
  )
}

export function PrinterDetailPage() {
  const { printerId } = useParams()
  const printer = getPrinterById(printerId)
  const [activeTab, setActiveTab] = useState('Summary')

  if (!printer) {
    return <Navigate to="/admin/printers" replace />
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
      <div className="min-w-0">
        <PageHeader
          eyebrow="Printers"
          title={`Printer details: ${printer.name}`}
          description={printer.model}
        />

        <SectionTabs
          tabs={['Summary', 'Device rules', 'Jobs']}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        {activeTab === 'Summary' ? (
          <section className="ui-panel overflow-hidden">
            <div className="grid gap-6 border-b border-line px-5 py-5 lg:grid-cols-[220px_minmax(0,1fr)]">
              <div>
                <div className="text-sm font-medium text-ink-950">Configuration</div>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <label>
                  <div className="ui-heading">Hosted on</div>
                  <input className="ui-input mt-2" defaultValue={printer.hostedOn} />
                </label>
                <label>
                  <div className="ui-heading">IP address</div>
                  <input className="ui-input mt-2 font-mono" defaultValue={printer.ipAddress} />
                </label>
                <label>
                  <div className="ui-heading">Serial number</div>
                  <input className="ui-input mt-2 font-mono" defaultValue={printer.serialNumber} />
                </label>
                <label>
                  <div className="ui-heading">Physical identifier</div>
                  <input className="ui-input mt-2" defaultValue={printer.model} />
                </label>
                <div>
                  <div className="ui-heading">Toner status</div>
                  <div className="mt-3 h-2 bg-slate-100">
                    <div
                      className={printer.toner <= 20 ? 'h-full bg-warn-500' : 'h-full bg-ink-950'}
                      style={{ width: `${printer.toner}%` }}
                    />
                  </div>
                  <div className="mt-2 text-sm text-slate-500">{printer.toner}%</div>
                </div>
                <label>
                  <div className="ui-heading">Software version</div>
                  <input className="ui-input mt-2" defaultValue={printer.softwareVersion} />
                </label>
                <label>
                  <div className="ui-heading">Location/department</div>
                  <input className="ui-input mt-2" defaultValue={printer.location} />
                </label>
                <label>
                  <div className="ui-heading">Queue type</div>
                  <select className="ui-select mt-2 w-full" defaultValue={printer.queue}>
                    <option>Student Standard</option>
                    <option>Student Color</option>
                    <option>Faculty Color</option>
                    <option>Project Studio</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="grid gap-6 border-b border-line px-5 py-5 lg:grid-cols-[220px_minmax(0,1fr)]">
              <div>
                <div className="text-sm font-medium text-ink-950">Hold/release queue settings</div>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <label className="flex items-center gap-3 lg:col-span-2">
                  <input type="checkbox" defaultChecked={printer.holdReleaseMode !== 'Immediate'} />
                  <span className="text-sm text-ink-950">Enable hold/release queue</span>
                </label>
                <label>
                  <div className="ui-heading">Release mode</div>
                  <select className="ui-select mt-2 w-full" defaultValue={printer.holdReleaseMode}>
                    <option>Secure Release</option>
                    <option>User release</option>
                    <option>Immediate</option>
                  </select>
                </label>
                <div className="flex items-end">
                  <div className="flex items-center gap-3">
                    <StatusBadge status={printer.status} />
                    <span className="text-sm text-slate-500">{printer.pendingJobs} pending</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 px-5 py-4">
              <button className="ui-button-ghost">Cancel</button>
              <button className="ui-button-secondary">OK</button>
              <button className="ui-button">Apply</button>
            </div>
          </section>
        ) : null}

        {activeTab === 'Device rules' ? (
          <section className="ui-panel overflow-hidden">
            <div className="grid gap-6 border-b border-line px-5 py-5 lg:grid-cols-[220px_minmax(0,1fr)]">
              <div>
                <div className="text-sm font-medium text-ink-950">Printer/device groups</div>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <label className="lg:col-span-2">
                  <div className="ui-heading">Device group</div>
                  <select className="ui-select mt-2 w-full" defaultValue={printer.deviceGroup}>
                    <option>Student Devices</option>
                    <option>Faculty Devices</option>
                    <option>Project Studio</option>
                    <option>Library Devices</option>
                  </select>
                </label>
                <label>
                  <div className="ui-heading">Alternate ID</div>
                  <input className="ui-input mt-2" defaultValue={printer.alternateId} />
                </label>
                <label>
                  <div className="ui-heading">Failure mode</div>
                  <select className="ui-select mt-2 w-full" defaultValue={printer.failureMode}>
                    <option>Hold until redirected</option>
                    <option>Retry then notify</option>
                    <option>Cancel and notify</option>
                  </select>
                </label>
                <label className="lg:col-span-2">
                  <div className="ui-heading">Notes</div>
                  <textarea className="ui-textarea mt-2" defaultValue={printer.notes} />
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 px-5 py-4">
              <button className="ui-button-ghost">Cancel</button>
              <button className="ui-button-secondary">OK</button>
              <button className="ui-button">Apply</button>
            </div>
          </section>
        ) : null}

        {activeTab === 'Jobs' ? (
          <section className="ui-panel overflow-hidden">
            <div className="grid gap-0 md:grid-cols-4">
              <div className="border-b border-line px-5 py-4 md:border-r md:border-b-0">
                <div className="ui-heading">Queue</div>
                <div className="mt-3 text-sm font-medium text-ink-950">{printer.queue}</div>
              </div>
              <div className="border-b border-line px-5 py-4 md:border-r md:border-b-0">
                <div className="ui-heading">Released today</div>
                <div className="mt-3 text-lg font-semibold text-ink-950">{printer.releasedToday}</div>
              </div>
              <div className="border-b border-line px-5 py-4 md:border-r md:border-b-0">
                <div className="ui-heading">Held jobs</div>
                <div className="mt-3 text-lg font-semibold text-ink-950">{printer.pendingJobs}</div>
              </div>
              <div className="px-5 py-4">
                <div className="ui-heading">Status</div>
                <div className="mt-3">
                  <StatusBadge status={printer.status} />
                </div>
              </div>
            </div>
          </section>
        ) : null}
      </div>

      <ActionRail
        title="Printer actions"
        items={[
          { label: 'Select queue', icon: Printer },
          { label: 'Redirect active jobs', icon: ArrowRightLeft },
          { label: 'Toggle availability', icon: Power },
          { label: 'View job log', icon: Wrench },
        ]}
      />
    </div>
  )
}
