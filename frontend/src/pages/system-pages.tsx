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
  type: 'Audit' | 'Error' | 'Queue' | 'Auth'
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
  { id: 'dev-01', hostname: 'ccm-print-a1', printer: 'Printer A1', location: 'Building A, Floor 1', status: 'Online' },
  { id: 'dev-02', hostname: 'ccm-print-b2', printer: 'Printer B2', location: 'Building B, Floor 2', status: 'Online' },
  { id: 'dev-03', hostname: 'ccm-print-c3', printer: 'Printer C3', location: 'Building C, Floor 3', status: 'Maintenance' },
  { id: 'dev-04', hostname: 'ccm-print-d1', printer: 'Printer D1', location: 'Library, Ground Floor', status: 'Offline' },
]

const reports: ReportRow[] = [
  { id: 'rep-01', title: 'Daily print activity', category: 'Usage', schedule: 'Daily', lastRun: 'Today 08:00' },
  { id: 'rep-02', title: 'Quota exceptions', category: 'Policy', schedule: 'Weekly', lastRun: 'Sun 09:15' },
  { id: 'rep-03', title: 'Device health summary', category: 'Operations', schedule: 'Daily', lastRun: 'Today 08:05' },
]

const logEntries: LogRow[] = [
  { id: 'log-01', type: 'Audit', subject: 'Quota policy updated for CCM-Students', actor: 'david.admin', time: 'Today 09:12' },
  { id: 'log-02', type: 'Queue', subject: '11 held jobs redirected from Printer D1', actor: 'sarah.tech', time: 'Today 08:44' },
  { id: 'log-03', type: 'Error', subject: 'Printer C3 entered maintenance mode', actor: 'system', time: 'Today 08:11' },
  { id: 'log-04', type: 'Auth', subject: 'Directory sync completed successfully', actor: 'system', time: 'Today 07:42' },
]

const recentPrintLogs: PrintLogRow[] = [
  { id: 'print-01', date: '2026-04-06 09:45', user: 'John Doe', department: 'Engineering', device: 'Floor 1 Printer', pages: 25, cost: '$1.25', status: 'Completed' },
  { id: 'print-02', date: '2026-04-06 09:32', user: 'Jane Smith', department: 'Marketing', device: 'Floor 2 Printer', pages: 50, cost: '$2.50', status: 'Completed' },
  { id: 'print-03', date: '2026-04-06 09:15', user: 'Bob Wilson', department: 'Sales', device: 'Floor 3 Printer', pages: 12, cost: '$0.60', status: 'Failed' },
  { id: 'print-04', date: '2026-04-06 08:50', user: 'Alice Brown', department: 'HR', device: 'Floor 1 Printer', pages: 8, cost: '$0.40', status: 'Completed' },
  { id: 'print-05', date: '2026-04-06 08:30', user: 'Charlie Davis', department: 'Finance', device: 'Basement Printer', pages: 35, cost: '$1.75', status: 'Held' },
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
    <div className={`px-5 py-4 ${classes}`}>
      <div className="text-sm font-semibold">{label}</div>
      <div className="mt-3 text-4xl font-semibold tracking-[-0.04em]">{value}</div>
    </div>
  )
}

function AdvancedFilters() {
  return (
    <section className="ui-panel mb-5 overflow-hidden">
      <div className="border-b border-line px-5 py-4">
        <div className="flex items-center gap-3 text-xl font-semibold text-ink-950">
          <SlidersHorizontal className="size-5 text-slate-500" />
          Filters
        </div>
      </div>
      <div className="grid gap-4 px-5 py-5 md:grid-cols-2 xl:grid-cols-5">
        <label>
          <div className="text-sm font-semibold text-slate-700">Date range</div>
          <select className="ui-select mt-2 w-full" defaultValue="Last 7 days">
            <option>Last 24 hours</option>
            <option>Last 7 days</option>
            <option>Last 30 days</option>
          </select>
        </label>
        <label>
          <div className="text-sm font-semibold text-slate-700">Department</div>
          <select className="ui-select mt-2 w-full" defaultValue="All departments">
            <option>All departments</option>
            <option>Engineering</option>
            <option>Marketing</option>
            <option>Finance</option>
          </select>
        </label>
        <label>
          <div className="text-sm font-semibold text-slate-700">Device</div>
          <select className="ui-select mt-2 w-full" defaultValue="All devices">
            <option>All devices</option>
            <option>Floor 1 Printer</option>
            <option>Floor 2 Printer</option>
            <option>Basement Printer</option>
          </select>
        </label>
        <label>
          <div className="text-sm font-semibold text-slate-700">User</div>
          <select className="ui-select mt-2 w-full" defaultValue="All users">
            <option>All users</option>
            <option>John Doe</option>
            <option>Jane Smith</option>
            <option>Alice Brown</option>
          </select>
        </label>
        <div className="flex items-end">
          <button className="ui-button-secondary w-full justify-center">
            <RotateCcw className="size-4" />
            Reset filters
          </button>
        </div>
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
      <PageHeader eyebrow="Devices" title="Registered devices" description="Thin device inventory aligned with the printer fleet." />

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
            { key: 'printer', header: 'Printer', render: (row) => <span className="ui-table-primary">{row.printer}</span> },
            { key: 'location', header: 'Location', render: (row) => <span className="ui-table-secondary">{row.location}</span> },
            { key: 'status', header: 'Status', render: (row) => <StatusText status={row.status} /> },
          ]}
          rows={filteredDevices}
          getRowKey={(row) => row.id}
          emptyLabel="No devices match the current search."
        />
      </div>
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
      <PageHeader eyebrow="Logs" title="Audit and print logs" description="Recent print activity with high-level filters and system activity below." />

      <AdvancedFilters />

      <section className="ui-panel overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-line px-5 py-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-2xl font-semibold tracking-tight text-ink-950">Recent print logs</div>
            <div className="mt-2 text-sm text-slate-500">Overview of recent printing activity</div>
          </div>
          <button className="ui-button">
            <Download className="size-4" />
            Export CSV
          </button>
        </div>

        <div className="grid gap-4 border-b border-line px-5 py-5 md:grid-cols-3">
          <OverviewMetric label="Total jobs" value="5" tone="blue" />
          <OverviewMetric label="Total pages" value="130" tone="violet" />
          <OverviewMetric label="Total cost" value="$6.50" tone="green" />
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
          <div className="text-base font-semibold text-ink-950">System activity</div>
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
