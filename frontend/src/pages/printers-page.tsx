import { useDeferredValue, useMemo, useState } from 'react'
import { ArrowRightLeft, Plus, Trash2 } from 'lucide-react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { DetailActionBar, DetailAlert, DetailPanel, DetailSection } from '../components/ui/admin-detail'
import { DataTable } from '../components/ui/data-table'
import { FilterBar } from '../components/ui/filter-bar'
import { PageHeader } from '../components/ui/page-header'
import { SectionTabs } from '../components/ui/section-tabs'
import { StatusBadge } from '../components/ui/status-badge'
import { getPrinterByIdOrUndefined, listPrinterQueueNames, listPrinters } from '../features/admin/printers/api'
import type { AdminPrinter } from '../types/admin'

export function PrintersPage() {
  const adminPrinters = listPrinters()
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
  }, [adminPrinters, deferredSearch])

  return (
    <div className="min-w-0">
      <PageHeader
        eyebrow="Printers"
        title="Device and queue operations"
      />

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search printers"
      >
        <button className="ui-button-action px-3 py-2">
          <Plus className="size-4" />
          Add printer
        </button>
        <button className="ui-button-danger-soft px-3 py-2">
          <Trash2 className="size-4" />
          Delete
        </button>
        <button className="ui-button-secondary px-3 py-2">
          <ArrowRightLeft className="size-4" />
          Redirect jobs
        </button>
      </FilterBar>

      <div className="mt-4">
        <DataTable<AdminPrinter>
            columns={[
              {
                key: 'device',
                header: 'Printer',
                render: (printer) => <span className="ui-table-primary-strong">{printer.name}</span>,
              },
              {
                key: 'software',
                header: 'Software version',
                render: (printer) => <span className="ui-table-secondary">{printer.softwareVersion}</span>,
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
                render: (printer) => <span className="ui-table-secondary">{printer.releasedToday}</span>,
              },
              {
                key: 'held-jobs',
                header: 'Held jobs',
                render: (printer) => <span className="ui-table-secondary">{printer.pendingJobs}</span>,
              },
            ]}
            rows={filteredPrinters}
            getRowKey={(printer) => printer.id}
            onRowClick={(printer) => navigate(`/admin/printers/${printer.id}`)}
            emptyLabel="No printers match the current search."
        />
      </div>
    </div>
  )
}

export function PrinterDetailPage() {
  const navigate = useNavigate()
  const { printerId } = useParams()
  const printer = getPrinterByIdOrUndefined(printerId)
  const [activeTab, setActiveTab] = useState('Settings')
  const queueOptions = listPrinterQueueNames()

  if (!printer) {
    return <Navigate to="/admin/printers" replace />
  }

  return (
    <div className="min-w-0">
      <PageHeader
        eyebrow="Printers"
        title={printer.name}
        description={`${printer.model} · ${printer.hostedOn}`}
        meta={
          <button className="ui-button-secondary" onClick={() => navigate('/admin/printers')}>
            Back to printers
          </button>
        }
      />

      <SectionTabs
        tabs={['Settings', 'Activity']}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === 'Settings' ? (
        <DetailPanel>
          {printer.status !== 'Online' ? (
            <div className="px-5 pt-5">
              <DetailAlert
                tone={printer.status === 'Maintenance' ? 'warn' : 'danger'}
                title={printer.status === 'Maintenance' ? 'Printer under maintenance' : 'Printer offline'}
                description={`Release flow is affected while this device is ${printer.status.toLowerCase()}. ${printer.pendingJobs} jobs are still waiting in the queue.`}
              />
            </div>
          ) : null}

          <DetailSection title="Device identity">
            <label>
              <div className="ui-detail-label">Hosted on</div>
              <input className="ui-input mt-2" defaultValue={printer.hostedOn} />
            </label>
            <label>
              <div className="ui-detail-label">IP address</div>
              <input className="ui-input mt-2 font-mono" defaultValue={printer.ipAddress} />
            </label>
            <label>
              <div className="ui-detail-label">Serial number</div>
              <input className="ui-input mt-2 font-mono" defaultValue={printer.serialNumber} />
            </label>
            <label>
              <div className="ui-detail-label">Model</div>
              <input className="ui-input mt-2" defaultValue={printer.model} />
            </label>
            <label className="xl:col-span-2">
              <div className="ui-detail-label">Location</div>
              <input className="ui-input mt-2" defaultValue={printer.location} />
            </label>
          </DetailSection>

          <DetailSection title="Queue and release">
            <label>
              <div className="ui-detail-label">Queue</div>
              <select className="ui-select mt-2 w-full" defaultValue={printer.queue}>
                {queueOptions.map((queueName) => (
                  <option key={queueName}>{queueName}</option>
                ))}
              </select>
            </label>
            <label>
              <div className="ui-detail-label">Status</div>
              <select className="ui-select mt-2 w-full" defaultValue={printer.status}>
                <option>Online</option>
                <option>Offline</option>
                <option>Maintenance</option>
              </select>
            </label>
            <label className="ui-checkbox-line xl:col-span-2">
              <input type="checkbox" defaultChecked={printer.holdReleaseMode !== 'Immediate'} />
              <span>Enable hold/release queue</span>
            </label>
            <label>
              <div className="ui-detail-label">Release mode</div>
              <select className="ui-select mt-2 w-full" defaultValue={printer.holdReleaseMode}>
                <option>Secure Release</option>
                <option>Immediate</option>
              </select>
            </label>
          </DetailSection>

          <DetailSection title="Print policy">
            <label>
              <div className="ui-detail-label">Software version</div>
              <input className="ui-input mt-2" defaultValue={printer.softwareVersion} />
            </label>
            <label>
              <div className="ui-detail-label">Device group</div>
              <select className="ui-select mt-2 w-full" defaultValue={printer.deviceGroup}>
                <option>Student Devices</option>
                <option>Faculty Devices</option>
                <option>Project Studio</option>
                <option>Library Devices</option>
              </select>
            </label>
            <label>
              <div className="ui-detail-label">Alternate ID</div>
              <input className="ui-input mt-2" defaultValue={printer.alternateId} />
            </label>
            <label>
              <div className="ui-detail-label">Failure mode</div>
              <select className="ui-select mt-2 w-full" defaultValue={printer.failureMode}>
                <option>Hold until redirected</option>
                <option>Retry then notify</option>
                <option>Cancel and notify</option>
              </select>
            </label>
            <label className="xl:col-span-2">
              <div className="ui-detail-label">Toner</div>
              <div className="mt-2 border border-line bg-white px-4 py-4">
                <div className="h-2 bg-slate-100">
                  <div
                    className={printer.toner <= 20 ? 'h-full bg-warn-500' : 'h-full bg-ink-950'}
                    style={{ width: `${printer.toner}%` }}
                  />
                </div>
                <div className="mt-3 text-sm font-medium text-ink-950">{printer.toner}% remaining</div>
              </div>
            </label>
            <label className="xl:col-span-2">
              <div className="ui-detail-label">Notes</div>
              <textarea className="ui-textarea mt-2" defaultValue={printer.notes} />
            </label>
          </DetailSection>

          <DetailActionBar>
            <button className="ui-button-ghost">Cancel</button>
            <button className="ui-button">Apply</button>
          </DetailActionBar>
        </DetailPanel>
      ) : null}

      {activeTab === 'Activity' ? (
        <DetailPanel>
          <DetailSection title="Current state">
            <div>
              <div className="ui-detail-label">Status</div>
              <div className="mt-2 flex h-10 items-center border border-line bg-white px-3">
                <StatusBadge status={printer.status} />
              </div>
            </div>
            <label>
              <div className="ui-detail-label">Assigned queue</div>
              <input className="ui-input mt-2" defaultValue={printer.queue} />
            </label>
            <label>
              <div className="ui-detail-label">Released today</div>
              <input className="ui-input mt-2" defaultValue={printer.releasedToday} />
            </label>
            <label>
              <div className="ui-detail-label">Held jobs</div>
              <input className="ui-input mt-2" defaultValue={printer.pendingJobs} />
            </label>
          </DetailSection>

          <DetailSection title="Operational metrics">
            <label>
              <div className="ui-detail-label">Hosted on</div>
              <input className="ui-input mt-2" defaultValue={printer.hostedOn} />
            </label>
            <label>
              <div className="ui-detail-label">Software version</div>
              <input className="ui-input mt-2" defaultValue={printer.softwareVersion} />
            </label>
            <label>
              <div className="ui-detail-label">Toner</div>
              <input className="ui-input mt-2" defaultValue={`${printer.toner}%`} />
            </label>
            <label>
              <div className="ui-detail-label">Failure mode</div>
              <input className="ui-input mt-2" defaultValue={printer.failureMode} />
            </label>
          </DetailSection>
        </DetailPanel>
      ) : null}
    </div>
  )
}
