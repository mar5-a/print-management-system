import {
  AlertTriangle,
  ArrowRightLeft,
  Ban,
  Clock3,
  FileText,
  Power,
  Printer,
  ShieldCheck,
} from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { AdvancedFilterPanel } from '../components/ui/advanced-filter-panel'
import { DataTable } from '../components/ui/data-table'
import { PageHeader } from '../components/ui/page-header'
import { getDashboardSnapshot } from '../features/admin/dashboard/api'
import { buildLinePoints } from '../lib/charts'

function SummaryStat({
  label,
  value,
  tone = 'accent',
}: {
  label: string
  value: string
  tone?: 'accent' | 'sky' | 'warn' | 'danger'
}) {
  const toneClass =
    tone === 'danger'
      ? 'bg-danger-500'
      : tone === 'warn'
        ? 'bg-warn-500'
        : tone === 'sky'
          ? 'bg-sky-500'
          : 'bg-accent-500'

  return (
    <section className="ui-panel overflow-hidden">
      <div className={`h-1 w-full ${toneClass}`} />
      <div className="px-4 py-4">
        <div className="text-[0.8rem] font-semibold uppercase tracking-[0.2em] text-slate-700">{label}</div>
        <div className="mt-4 text-[3rem] leading-none font-semibold tracking-[-0.05em] text-ink-950">{value}</div>
      </div>
    </section>
  )
}

function StatusRow({
  icon,
  label,
  value,
  tone = 'default',
}: {
  icon: ReactNode
  label: string
  value: string
  tone?: 'default' | 'warn' | 'danger' | 'success'
}) {
  const toneClass =
    tone === 'danger'
      ? 'text-danger-500'
      : tone === 'warn'
        ? 'text-warn-500'
        : tone === 'success'
          ? 'text-accent-600'
          : 'text-slate-500'

  return (
    <div className="flex items-center justify-between gap-4 border-b border-line py-3 last:border-b-0">
      <div className="flex items-center gap-3 text-sm">
        <span className={toneClass}>{icon}</span>
        <span className="text-slate-600">{label}</span>
      </div>
      <span className="text-sm font-medium text-ink-950">{value}</span>
    </div>
  )
}

export function DashboardPage() {
  const [snap, setSnap] = useState<Awaited<ReturnType<typeof getDashboardSnapshot>> | null>(null)
  useEffect(() => { getDashboardSnapshot().then(setSnap) }, [])
  const adminUsers = snap?.adminUsers ?? []
  const adminPrinters = snap?.adminPrinters ?? []
  const recentPrintRows = snap?.recentPrintRows ?? []
  const trendLabels = snap?.trendLabels ?? ['01', '03', '05', '07', '09', '11', '13', '15', '17', '19', '21', '23']
  const trendValues = snap?.trendValues ?? Array.from({ length: 13 }, () => 0)
  const [dateRange, setDateRange] = useState('Last 7 days')
  const [department, setDepartment] = useState('All departments')
  const [device, setDevice] = useState('All devices')
  const [userFilter, setUserFilter] = useState('All users')
  const activeUsers = adminUsers.filter((user) => user.status === 'Active').length
  const suspendedUsers = adminUsers.filter((user) => user.status === 'Suspended').length
  const printersCount = adminPrinters.length
  const devicesCount = adminPrinters.length
  const offlineCount = adminPrinters.filter((printer) => printer.status === 'Offline').length
  const maintenanceCount = adminPrinters.filter((printer) => printer.status === 'Maintenance').length
  const totalPages = adminUsers.reduce((total, user) => total + user.quotaUsed, 0)
  const pagesToday = trendValues[trendValues.length - 1]
  const holdReleaseJobs = adminPrinters.reduce((total, printer) => total + printer.pendingJobs, 0)

  return (
    <div className="min-w-0">
      <PageHeader eyebrow="Dashboard" title="Dashboard" />

      <AdvancedFilterPanel
        fields={[
          {
            id: 'date-range',
            label: 'Date range',
            value: dateRange,
            options: ['Last 24 hours', 'Last 7 days', 'Last 30 days'],
            onChange: setDateRange,
          },
          {
            id: 'department',
            label: 'Department',
            value: department,
            options: ['All departments', 'Computer Science', 'Data Science', 'Information Systems', 'Operations'],
            onChange: setDepartment,
          },
          {
            id: 'device',
            label: 'Device',
            value: device,
            options: ['All devices', 'Printer A1', 'Printer B2', 'Printer C3', 'Printer D1'],
            onChange: setDevice,
          },
          {
            id: 'user',
            label: 'User',
            value: userFilter,
            options: ['All users', 'john.smith', 'emma.wilson', 'michael.brown', 'lisa.anderson'],
            onChange: setUserFilter,
          },
        ]}
        compact
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryStat label="Active users" value={`${activeUsers}`} tone="accent" />
        <SummaryStat label="Suspended" value={`${suspendedUsers}`} tone="danger" />
        <SummaryStat label="Pages today" value={`${pagesToday}`} tone="sky" />
        <SummaryStat label="Pending release" value={`${holdReleaseJobs}`} tone="warn" />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
        <section className="ui-panel overflow-hidden">
          <div className="border-b border-line bg-mist-50/80 px-5 py-4">
            <div className="text-base font-semibold text-ink-950">System status</div>
          </div>
          <div className="px-5 py-2">
            <StatusRow icon={<Clock3 className="size-4" />} label="System uptime" value="46d 6h" />
            <StatusRow icon={<ShieldCheck className="size-4" />} label="Users" value={`${activeUsers + suspendedUsers}`} />
            <StatusRow icon={<Printer className="size-4" />} label="Printers" value={`${printersCount}`} />
            <StatusRow icon={<FileText className="size-4" />} label="Devices" value={`${devicesCount}`} />
            <StatusRow icon={<Ban className="size-4" />} label="Recent errors" value={`${offlineCount}`} tone="danger" />
            <StatusRow icon={<AlertTriangle className="size-4" />} label="Recent warnings" value={`${maintenanceCount}`} tone="warn" />
            <StatusRow icon={<FileText className="size-4" />} label="Total pages" value={`${totalPages.toLocaleString()}`} tone="success" />
            <StatusRow icon={<ArrowRightLeft className="size-4" />} label="Hold/release jobs" value={`${holdReleaseJobs}`} />
            <StatusRow icon={<Power className="size-4" />} label="Active user clients" value={`${activeUsers}`} />
          </div>
        </section>

        <section className="ui-panel overflow-hidden">
          <div className="border-b border-line bg-mist-50/80 px-5 py-4">
            <div className="text-base font-semibold text-ink-950">Print activity</div>
          </div>
          <div className="px-5 py-5">
            <div className="rounded-none border border-line bg-white p-4">
              <svg viewBox="0 0 760 320" className="h-[21rem] w-full">
                {[0, 1, 2, 3, 4, 5].map((row) => (
                  <line key={row} x1="0" x2="760" y1={20 + row * 50} y2={20 + row * 50} stroke="#e7edf3" />
                ))}
                <polyline
                  fill="none"
                  points={buildLinePoints(trendValues, 760, 260)}
                  transform="translate(0 20)"
                  stroke="#43a047"
                  strokeWidth="3"
                />
                {buildLinePoints(trendValues, 760, 260)
                  .split(' ')
                  .map((point, index) => {
                    const [x, y] = point.split(',').map(Number)
                    return <circle key={`${point}-${index}`} cx={x} cy={y + 20} r="3.5" fill="#43a047" />
                  })}
              </svg>
              <div className="mt-3 grid grid-cols-12 text-center font-mono text-[0.68rem] uppercase tracking-[0.16em] text-slate-500">
                {trendLabels.map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="ui-panel overflow-hidden">
          <div className="flex items-center justify-between gap-4 border-b border-line bg-mist-50/80 px-5 py-4">
            <div className="text-base font-semibold text-ink-950">Recent print logs</div>
            <button className="ui-button-secondary px-3 py-1.5">
              <FileText className="size-4" />
              Export print logs
            </button>
          </div>
          <div className="px-5 py-4">
            <DataTable<typeof recentPrintRows[number]>
              columns={[
                { key: 'user', header: 'User', render: (row) => <span className="ui-table-primary-mono">{row.user}</span> },
                { key: 'device', header: 'Device', render: (row) => <span className="ui-table-secondary">{row.device}</span> },
                { key: 'pages', header: 'Pages', render: (row) => <span className="ui-table-secondary">{row.pages}</span> },
                {
                  key: 'status',
                  header: 'Status',
                  render: (row) => (
                    <span
                      className={
                        row.status === 'Completed'
                          ? 'text-sm text-accent-700'
                          : row.status === 'Failed'
                            ? 'text-sm text-danger-500'
                            : 'text-sm text-warn-500'
                      }
                    >
                      {row.status}
                    </span>
                  ),
                },
              ]}
              rows={recentPrintRows}
              getRowKey={(row) => row.id}
              emptyLabel="No recent print logs."
            />
          </div>
        </section>

        <section className="ui-panel overflow-hidden">
          <div className="border-b border-line bg-mist-50/80 px-5 py-4">
            <div className="text-base font-semibold text-ink-950">Printer status</div>
          </div>
          <div className="space-y-3 px-5 py-5">
            {adminPrinters.map((printer) => (
              <div key={printer.id} className="flex items-center justify-between gap-4 border-b border-line py-2.5 last:border-b-0">
                <div className="flex items-center gap-3">
                  <span
                    className={
                      printer.status === 'Online'
                        ? 'size-2.5 rounded-full bg-accent-500'
                        : printer.status === 'Offline'
                          ? 'size-2.5 rounded-full bg-danger-500'
                          : 'size-2.5 rounded-full bg-warn-500'
                    }
                  />
                  <span className="text-sm font-medium text-ink-950">{printer.name}</span>
                </div>
                <span className="text-sm text-slate-500">{printer.pendingJobs} pending</span>
              </div>
            ))}
          </div>
        </section>
      </div>

    </div>
  )
}
