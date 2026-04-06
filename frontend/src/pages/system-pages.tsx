import { useDeferredValue, useMemo, useState } from 'react'
import {
  BookOpen,
  Download,
  FileClock,
  FileText,
  MonitorSmartphone,
  RefreshCw,
  Save,
  Settings2,
  SlidersHorizontal,
  Wallet,
} from 'lucide-react'
import { ActionRail } from '../components/ui/action-rail'
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

function StatusText({ status }: { status: DeviceRow['status'] }) {
  const className =
    status === 'Online'
      ? 'text-accent-700'
      : status === 'Offline'
        ? 'text-danger-500'
        : 'text-warn-500'

  return <span className={`text-sm ${className}`}>{status}</span>
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
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
      <div className="min-w-0">
        <PageHeader eyebrow="Accounts" title="Shared accounts" description="Minimal shared billing and access view." />

        <FilterBar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search accounts"
        />

        <div className="mt-4">
          <DataTable<SharedAccountRow>
            columns={[
              { key: 'name', header: 'Account', render: (row) => <span className="font-semibold text-ink-950">{row.name}</span> },
              { key: 'balance', header: 'Balance', render: (row) => <span className="text-sm text-slate-600">{row.balance}</span> },
              { key: 'owner', header: 'Owner', render: (row) => <span className="text-sm text-slate-600">{row.owner}</span> },
              { key: 'access', header: 'Access', render: (row) => <span className="text-sm text-slate-600">{row.access}</span> },
            ]}
            rows={filteredAccounts}
            getRowKey={(row) => row.id}
            emptyLabel="No shared accounts match the current search."
          />
        </div>
      </div>

      <ActionRail
        title="Account actions"
        items={[
          { label: 'Review balances', icon: Wallet },
          { label: 'Sync account mapping', icon: RefreshCw },
          { label: 'Export account list', icon: Download },
        ]}
      />
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
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
      <div className="min-w-0">
        <PageHeader eyebrow="Devices" title="Registered devices" description="Thin device inventory aligned with the printer fleet." />

        <FilterBar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search devices"
        />

        <div className="mt-4">
          <DataTable<DeviceRow>
            columns={[
              { key: 'hostname', header: 'Hostname', render: (row) => <span className="font-mono text-xs text-ink-950">{row.hostname}</span> },
              { key: 'printer', header: 'Printer', render: (row) => <span className="text-sm text-slate-600">{row.printer}</span> },
              { key: 'location', header: 'Location', render: (row) => <span className="text-sm text-slate-600">{row.location}</span> },
              { key: 'status', header: 'Status', render: (row) => <StatusText status={row.status} /> },
            ]}
            rows={filteredDevices}
            getRowKey={(row) => row.id}
            emptyLabel="No devices match the current search."
          />
        </div>
      </div>

      <ActionRail
        title="Device actions"
        items={[
          { label: 'Refresh device status', icon: RefreshCw },
          { label: 'Review offline devices', icon: MonitorSmartphone },
          { label: 'Export device list', icon: Download },
        ]}
      />
    </div>
  )
}

export function ReportsPage() {
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
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
                { key: 'title', header: 'Report', render: (row) => <span className="font-medium text-ink-950">{row.title}</span> },
                { key: 'category', header: 'Category', render: (row) => <span className="text-sm text-slate-600">{row.category}</span> },
                { key: 'schedule', header: 'Schedule', render: (row) => <span className="text-sm text-slate-600">{row.schedule}</span> },
                { key: 'last-run', header: 'Last run', render: (row) => <span className="text-sm text-slate-600">{row.lastRun}</span> },
              ]}
              rows={reports}
              getRowKey={(row) => row.id}
              emptyLabel="No reports configured."
            />
          </div>
        </div>
      </div>

      <ActionRail
        title="Report actions"
        items={[
          { label: 'Run selected report', icon: FileText },
          { label: 'Download latest export', icon: Download },
          { label: 'Refresh report status', icon: RefreshCw },
        ]}
      />
    </div>
  )
}

export function OptionsPage() {
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
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
            <button className="ui-button-secondary">OK</button>
            <button className="ui-button">Apply</button>
          </div>
        </section>
      </div>

      <ActionRail
        title="Option actions"
        items={[
          { label: 'Save settings', icon: Save },
          { label: 'Reload defaults', icon: RefreshCw },
          { label: 'Review integrations', icon: Settings2 },
        ]}
      />
    </div>
  )
}

export function LogsPage() {
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
      <div className="min-w-0">
        <PageHeader eyebrow="Logs" title="Audit and system logs" description="Minimal consolidated log surface for admin review." />

        <div className="ui-panel overflow-hidden">
          <div className="grid gap-0 border-b border-line md:grid-cols-4">
            <div className="border-b border-line px-5 py-4 md:border-r md:border-b-0">
              <div className="ui-heading">Audit</div>
              <div className="mt-3 text-2xl font-semibold tracking-tight text-ink-950">1</div>
            </div>
            <div className="border-b border-line px-5 py-4 md:border-r md:border-b-0">
              <div className="ui-heading">Errors</div>
              <div className="mt-3 text-2xl font-semibold tracking-tight text-ink-950">1</div>
            </div>
            <div className="border-b border-line px-5 py-4 md:border-r md:border-b-0">
              <div className="ui-heading">Queue</div>
              <div className="mt-3 text-2xl font-semibold tracking-tight text-ink-950">1</div>
            </div>
            <div className="px-5 py-4">
              <div className="ui-heading">Auth</div>
              <div className="mt-3 text-2xl font-semibold tracking-tight text-ink-950">1</div>
            </div>
          </div>

          <div className="px-5 py-4">
            <DataTable<LogRow>
              columns={[
                { key: 'type', header: 'Type', render: (row) => <span className="text-sm text-slate-600">{row.type}</span> },
                { key: 'subject', header: 'Subject', render: (row) => <span className="font-medium text-ink-950">{row.subject}</span> },
                { key: 'actor', header: 'Actor', render: (row) => <span className="font-mono text-xs text-slate-600">{row.actor}</span> },
                { key: 'time', header: 'Time', render: (row) => <span className="text-sm text-slate-600">{row.time}</span> },
              ]}
              rows={logEntries}
              getRowKey={(row) => row.id}
              emptyLabel="No logs available."
            />
          </div>
        </div>
      </div>

      <ActionRail
        title="Log actions"
        items={[
          { label: 'Filter audit log', icon: SlidersHorizontal },
          { label: 'Refresh entries', icon: RefreshCw },
          { label: 'Export logs', icon: Download },
        ]}
      />
    </div>
  )
}

export function AboutPage() {
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
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

      <ActionRail
        title="About actions"
        items={[
          { label: 'View build notes', icon: BookOpen },
          { label: 'Review release scope', icon: FileClock },
          { label: 'Export system info', icon: Download },
        ]}
      />
    </div>
  )
}
