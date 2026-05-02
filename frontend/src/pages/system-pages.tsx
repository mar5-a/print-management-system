import { useDeferredValue, useMemo, useState } from 'react'
import {
  Download,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react'
import { DataTable } from '../components/ui/data-table'
import { FilterBar } from '../components/ui/filter-bar'
import { PageHeader } from '../components/ui/page-header'

interface SharedAccountRow {
  id: string
  name: string
  balance: number
  owner: string
  access: string
}

interface DeviceRow {
  id: string
  hostname: string
  printer: string
  location: string
  integration: string
  authSurface: string
  heartbeat: string
  status: 'Online' | 'Offline' | 'Maintenance'
}

interface ReportRow {
  id: string
  title: string
  category: string
  schedule: string
  lastRun: string
}

interface LogRow {
  id: string
  type: 'Audit' | 'Device' | 'Release' | 'Auth'
  subject: string
  actor: string
  time: string
}

interface PrintLogRow {
  id: string
  date: string
  user: string
  department: string
  device: string
  pages: number
  cost: string
  status: 'Completed' | 'Failed' | 'Held'
}

const sharedAccounts: SharedAccountRow[] = [
  { id: 'acc-01', name: 'Engineering Labs', balance: 8200, owner: 'Operations', access: 'Faculty + technicians' },
  { id: 'acc-02', name: 'Student Projects', balance: 3400, owner: 'CCM-Students', access: 'Students' },
  { id: 'acc-03', name: 'Dean Office', balance: 12000, owner: 'Administration', access: 'Administrators' },
]

const devices: DeviceRow[] = [
  { id: 'dev-01', hostname: 'ccm-print-a1', printer: 'Printer A1', location: 'Building A, Floor 1', integration: 'Embedded release client', authSurface: 'Card or credentials', heartbeat: '30 seconds ago', status: 'Online' },
  { id: 'dev-02', hostname: 'ccm-print-b2', printer: 'Printer B2', location: 'Building B, Floor 2', integration: 'Embedded release client', authSurface: 'Card or credentials', heartbeat: '1 minute ago', status: 'Online' },
  { id: 'dev-03', hostname: 'ccm-print-c3', printer: 'Printer C3', location: 'Building C, Floor 3', integration: 'Embedded release client', authSurface: 'Credentials fallback', heartbeat: '12 minutes ago', status: 'Maintenance' },
  { id: 'dev-04', hostname: 'ccm-print-d1', printer: 'Printer D1', location: 'Library, Ground Floor', integration: 'Device connector pending', authSurface: 'Unavailable while offline', heartbeat: '22 minutes ago', status: 'Offline' },
]

const reports: ReportRow[] = [
  { id: 'rep-01', title: 'Daily print activity', category: 'Usage', schedule: 'Daily', lastRun: 'Today 08:00' },
  { id: 'rep-02', title: 'Quota exceptions', category: 'Policy', schedule: 'Weekly', lastRun: 'Sun 09:15' },
  { id: 'rep-03', title: 'Device health summary', category: 'Operations', schedule: 'Daily', lastRun: 'Today 08:05' },
]

const logEntries: LogRow[] = [
  { id: 'log-01', type: 'Audit', subject: 'Quota policy updated for CCM-Students', actor: 'david.admin', time: 'Today 09:12' },
  { id: 'log-02', type: 'Release', subject: '11 held jobs remain visible after Printer D1 outage', actor: 'system', time: 'Today 08:44' },
  { id: 'log-03', type: 'Device', subject: 'Printer C3 entered maintenance mode after repeated feed alerts', actor: 'system', time: 'Today 08:11' },
  { id: 'log-04', type: 'Auth', subject: 'Directory sync completed successfully', actor: 'system', time: 'Today 07:42' },
  { id: 'log-05', type: 'Auth', subject: 'Printer A1 accepted 27 secure-release authentications', actor: 'device-agent', time: 'Today 07:35' },
]

const recentPrintLogs: PrintLogRow[] = [
  { id: 'print-01', date: '2026-04-06 09:45', user: 'John Doe', department: 'Engineering', device: 'Printer A1', pages: 25, cost: '$1.25', status: 'Completed' },
  { id: 'print-02', date: '2026-04-06 09:32', user: 'Jane Smith', department: 'Marketing', device: 'Printer B2', pages: 50, cost: '$2.50', status: 'Completed' },
  { id: 'print-03', date: '2026-04-06 09:15', user: 'Bob Wilson', department: 'Sales', device: 'Printer C3', pages: 12, cost: '$0.60', status: 'Failed' },
  { id: 'print-04', date: '2026-04-06 08:50', user: 'Alice Brown', department: 'HR', device: 'Printer A1', pages: 8, cost: '$0.40', status: 'Completed' },
  { id: 'print-05', date: '2026-04-06 08:30', user: 'Charlie Davis', department: 'Finance', device: 'Printer D1', pages: 35, cost: '$1.75', status: 'Held' },
]

function StatusText({ status }: { status: DeviceRow['status'] }) {
  const className =
    status === 'Online'
      ? 'text-accent-700'
      : status === 'Offline'
        ? 'text-danger-500'
        : 'text-warn-500'

  return <span className={`text-sm ${className}`}>{status}</span>
}

function OverviewMetric({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: 'blue' | 'green' | 'violet'
}) {
  const classes =
    tone === 'blue'
      ? 'bg-sky-500/10 text-sky-700'
      : tone === 'violet'
        ? 'bg-violet-500/10 text-violet-700'
        : 'bg-accent-100 text-accent-700'

  return (
    <div className={`px-4 py-3 ${classes}`}>
      <div className="text-sm font-semibold">{label}</div>
      <div className="mt-1 text-2xl font-semibold tracking-[-0.03em]">{value}</div>
    </div>
  )
}

function AdvancedFilters() {
  return (
    <section className="ui-panel-muted mb-3 flex flex-col gap-2 px-3 py-3 xl:flex-row xl:items-center">
      <div className="flex shrink-0 items-center gap-2 text-sm font-semibold text-ink-950">
        <SlidersHorizontal className="size-4 text-slate-500" />
        Filters
      </div>

      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        <label className="min-w-[9rem] flex-1 sm:flex-none">
          <span className="sr-only">Date range</span>
          <select className="ui-select h-9 w-full min-w-[9rem]" aria-label="Date range" defaultValue="Last 7 days">
            <option>Last 24 hours</option>
            <option>Last 7 days</option>
            <option>Last 30 days</option>
          </select>
        </label>
        <label className="min-w-[10rem] flex-1 sm:flex-none">
          <span className="sr-only">Department</span>
          <select className="ui-select h-9 w-full min-w-[10rem]" aria-label="Department" defaultValue="All departments">
            <option>All departments</option>
            <option>Engineering</option>
            <option>Marketing</option>
            <option>Finance</option>
          </select>
        </label>
        <label className="min-w-[9rem] flex-1 sm:flex-none">
          <span className="sr-only">Device</span>
          <select className="ui-select h-9 w-full min-w-[9rem]" aria-label="Device" defaultValue="All devices">
            <option>All devices</option>
            <option>Floor 1 Printer</option>
            <option>Floor 2 Printer</option>
            <option>Basement Printer</option>
          </select>
        </label>
        <label className="min-w-[8.5rem] flex-1 sm:flex-none">
          <span className="sr-only">User</span>
          <select className="ui-select h-9 w-full min-w-[8.5rem]" aria-label="User" defaultValue="All users">
            <option>All users</option>
            <option>John Doe</option>
            <option>Jane Smith</option>
            <option>Alice Brown</option>
          </select>
        </label>
        <button type="button" className="ui-button-secondary h-9 px-3 py-0">
          <RotateCcw className="size-3.5" />
          Reset
        </button>
      </div>
    </section>
  )
}

export function AccountsPage() {
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)

  const filteredAccounts = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase()
    return sharedAccounts.filter((account) =>
      [account.name, account.owner, account.access].some((value) => value.toLowerCase().includes(query)),
    )
  }, [deferredSearch])

  return (
    <div className="min-w-0">
      <PageHeader eyebrow="Accounts" title="Shared accounts" description="Minimal shared billing and access view." />

      <FilterBar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search accounts">
        <button className="ui-button-action px-3 py-2">
          <Plus className="size-4" />
          Add account
        </button>
        <button className="ui-button-danger-soft px-3 py-2">
          <Trash2 className="size-4" />
          Delete
        </button>
        <button className="ui-button-secondary px-3 py-2">
          <Download className="size-4" />
          Export accounts
        </button>
      </FilterBar>

      <div className="mt-4">
        <DataTable<SharedAccountRow>
          columns={[
            { key: 'name', header: 'Account', render: (row) => <span className="ui-table-primary-strong">{row.name}</span> },
            { key: 'balance', header: 'Balance', render: (row) => <span className="ui-table-secondary">{row.balance}</span> },
            { key: 'owner', header: 'Owner', render: (row) => <span className="ui-table-secondary">{row.owner}</span> },
            { key: 'access', header: 'Access', render: (row) => <span className="ui-table-secondary">{row.access}</span> },
          ]}
          rows={filteredAccounts}
          getRowKey={(row) => row.id}
          emptyLabel="No shared accounts match the current search."
        />
      </div>
    </div>
  )
}

export function DevicesPage() {
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)

  const filteredDevices = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase()
    return devices.filter((device) =>
      [device.hostname, device.printer, device.location, device.status].some((value) =>
        value.toLowerCase().includes(query),
      ),
    )
  }, [deferredSearch])

  return (
    <div className="min-w-0">
      <PageHeader eyebrow="Devices" title="Physical devices" description="Physical MFPs and embedded release clients, kept separate from logical printer and queue records." />

      <FilterBar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search devices">
        <button className="ui-button-action px-3 py-2">
          <Plus className="size-4" />
          Add device
        </button>
        <button className="ui-button-danger-soft px-3 py-2">
          <Trash2 className="size-4" />
          Delete
        </button>
        {(['All', 'Online', 'Offline', 'Maintenance'] as const).map((value) => (
          <button key={value} className="ui-button-ghost">
            {value}
          </button>
        ))}
      </FilterBar>

      <div className="mt-4">
        <DataTable<DeviceRow>
          columns={[
            { key: 'hostname', header: 'Hostname', render: (row) => <span className="ui-table-secondary-mono">{row.hostname}</span> },
            { key: 'printer', header: 'Linked printer', render: (row) => <span className="ui-table-primary">{row.printer}</span> },
            { key: 'location', header: 'Location', render: (row) => <span className="ui-table-secondary">{row.location}</span> },
            { key: 'integration', header: 'Integration', render: (row) => <span className="ui-table-secondary">{row.integration}</span> },
            { key: 'auth-surface', header: 'Auth surface', render: (row) => <span className="ui-table-secondary">{row.authSurface}</span> },
            { key: 'heartbeat', header: 'Last heartbeat', render: (row) => <span className="ui-table-secondary">{row.heartbeat}</span> },
            { key: 'status', header: 'Status', render: (row) => <StatusText status={row.status} /> },
          ]}
          rows={filteredDevices}
          getRowKey={(row) => row.id}
          emptyLabel="No devices match the current search."
        />
      </div>

      <section className="ui-panel mt-5 overflow-hidden">
        <div className="border-b border-line px-5 py-4">
          <div className="text-base font-semibold text-ink-950">Why devices are separate</div>
        </div>
        <div className="space-y-3 px-5 py-5 text-sm text-slate-600">
          <p>Devices represent the physical machine and any embedded release software installed on it.</p>
          <p>Printers and queues remain the logical records used for routing, policy, and backlog visibility.</p>
        </div>
      </section>
    </div>
  )
}

export function ReportsPage() {
  return (
    <div className="min-w-0">
      <PageHeader eyebrow="Reports" title="Reports" description="Basic report catalog until reporting specs are finalized." />

      <div className="ui-panel overflow-hidden">
        <div className="grid gap-0 border-b border-line md:grid-cols-3">
          <div className="border-b border-line px-5 py-4 md:border-r md:border-b-0">
            <div className="ui-heading">Available</div>
            <div className="mt-3 text-2xl font-semibold tracking-tight text-ink-950">{reports.length}</div>
          </div>
          <div className="border-b border-line px-5 py-4 md:border-r md:border-b-0">
            <div className="ui-heading">Scheduled</div>
            <div className="mt-3 text-2xl font-semibold tracking-tight text-ink-950">3</div>
          </div>
          <div className="px-5 py-4">
            <div className="ui-heading">Last export</div>
            <div className="mt-3 text-sm font-medium text-ink-950">Today 08:05</div>
          </div>
        </div>

        <div className="px-5 py-4">
          <DataTable<ReportRow>
            columns={[
              { key: 'title', header: 'Report', render: (row) => <span className="ui-table-primary">{row.title}</span> },
              { key: 'category', header: 'Category', render: (row) => <span className="ui-table-secondary">{row.category}</span> },
              { key: 'schedule', header: 'Schedule', render: (row) => <span className="ui-table-secondary">{row.schedule}</span> },
              { key: 'last-run', header: 'Last run', render: (row) => <span className="ui-table-secondary">{row.lastRun}</span> },
            ]}
            rows={reports}
            getRowKey={(row) => row.id}
            emptyLabel="No reports configured."
          />
        </div>
      </div>
    </div>
  )
}

export function OptionsPage() {
  return (
    <div className="min-w-0">
      <PageHeader eyebrow="Options" title="System options" description="Minimal settings surface for defaults and integrations." />

      <section className="ui-panel overflow-hidden">
        <div className="grid gap-6 border-b border-line px-5 py-5 lg:grid-cols-[220px_minmax(0,1fr)]">
          <div>
            <div className="text-sm font-medium text-ink-950">Defaults</div>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <label>
              <div className="ui-heading">Default queue</div>
              <select className="ui-select mt-2 w-full" defaultValue="Student Standard">
                <option>Student Standard</option>
                <option>Student Color</option>
                <option>Faculty Color</option>
              </select>
            </label>
            <label>
              <div className="ui-heading">Unreleased retention</div>
              <input className="ui-input mt-2" defaultValue="24 hours" />
            </label>
          </div>
        </div>

        <div className="grid gap-6 border-b border-line px-5 py-5 lg:grid-cols-[220px_minmax(0,1fr)]">
          <div>
            <div className="text-sm font-medium text-ink-950">Directory</div>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <label>
              <div className="ui-heading">Auth source</div>
              <input className="ui-input mt-2" defaultValue="Windows Active Directory" />
            </label>
            <label>
              <div className="ui-heading">Sync mode</div>
              <select className="ui-select mt-2 w-full" defaultValue="Scheduled">
                <option>Scheduled</option>
                <option>Manual</option>
              </select>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-2 px-5 py-4">
          <button className="ui-button-ghost">Cancel</button>
          <button className="ui-button">Apply</button>
        </div>
      </section>
    </div>
  )
}

export function LogsPage() {
  return (
    <div className="min-w-0">
      <PageHeader eyebrow="Logs" title="Audit and operational logs" description="Print outcomes, release/auth activity, device faults, and audit events kept together for troubleshooting." />

      <AdvancedFilters />

      <section className="ui-panel overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-base font-semibold text-ink-950">Print and release activity</div>
          </div>
          <button className="ui-button h-9 px-3 py-0">
            <Download className="size-4" />
            Export CSV
          </button>
        </div>

        <div className="grid gap-3 border-b border-line px-4 py-3 md:grid-cols-3">
          <OverviewMetric label="Total jobs" value="5" tone="blue" />
          <OverviewMetric label="Held for release" value="1" tone="violet" />
          <OverviewMetric label="Device/auth events" value="5" tone="green" />
        </div>

        <div className="px-5 py-4">
          <DataTable<PrintLogRow>
            columns={[
              { key: 'date', header: 'Date', render: (row) => <span className="ui-table-secondary">{row.date}</span> },
              { key: 'user', header: 'User', render: (row) => <span className="ui-table-primary">{row.user}</span> },
              { key: 'department', header: 'Department', render: (row) => <span className="ui-table-secondary">{row.department}</span> },
              { key: 'device', header: 'Device', render: (row) => <span className="ui-table-secondary">{row.device}</span> },
              { key: 'pages', header: 'Pages', render: (row) => <span className="ui-table-secondary">{row.pages}</span> },
              { key: 'cost', header: 'Cost', render: (row) => <span className="ui-table-secondary">{row.cost}</span> },
              {
                key: 'status',
                header: 'Status',
                render: (row) => (
                  <span
                    className={
                      row.status === 'Completed'
                        ? 'inline-flex rounded-full bg-accent-100 px-3 py-1 text-sm font-medium text-accent-700'
                        : row.status === 'Failed'
                          ? 'inline-flex rounded-full bg-danger-100 px-3 py-1 text-sm font-medium text-danger-500'
                          : 'inline-flex rounded-full bg-warn-100 px-3 py-1 text-sm font-medium text-warn-500'
                    }
                  >
                    {row.status}
                  </span>
                ),
              },
            ]}
            rows={recentPrintLogs}
            getRowKey={(row) => row.id}
            emptyLabel="No recent print logs."
          />
        </div>
      </section>

      <section className="ui-panel mt-5 overflow-hidden">
        <div className="border-b border-line px-5 py-4">
          <div className="text-base font-semibold text-ink-950">Operational events</div>
        </div>
        <div className="px-5 py-4">
          <DataTable<LogRow>
            columns={[
              { key: 'type', header: 'Type', render: (row) => <span className="ui-table-secondary">{row.type}</span> },
              { key: 'subject', header: 'Subject', render: (row) => <span className="ui-table-primary">{row.subject}</span> },
              { key: 'actor', header: 'Actor', render: (row) => <span className="ui-table-secondary-mono">{row.actor}</span> },
              { key: 'time', header: 'Time', render: (row) => <span className="ui-table-secondary">{row.time}</span> },
            ]}
            rows={logEntries}
            getRowKey={(row) => row.id}
            emptyLabel="No logs available."
          />
        </div>
      </section>
    </div>
  )
}

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
