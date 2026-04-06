import {
  AlertTriangle,
  ArrowRightLeft,
  Ban,
  Clock3,
  FileText,
  Power,
  Printer,
  RefreshCw,
  ShieldCheck,
  Wrench,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { PageHeader } from '../components/ui/page-header'
import { adminPrinters, adminUsers } from '../data/admin-data'

const trendValues = [180, 45, 20, 95, 170, 145, 205, 210, 120, 18, 25, 260, 190, 680, 90, 12, 32, 260, 82, 12, 18, 590, 70, 205, 15, 80]
const trendLabels = ['01', '03', '05', '07', '09', '11', '13', '15', '17', '19', '21', '23']

function linePoints(values: number[], width: number, height: number) {
  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = Math.max(max - min, 1)

  return values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width
      const y = height - ((value - min) / range) * height
      return `${x},${y}`
    })
    .join(' ')
}

function SummaryStat({
  label,
  value,
  note,
  tone = 'accent',
}: {
  label: string
  value: string
  note: string
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
      <div className="px-5 py-4">
        <div className="font-mono text-[0.74rem] uppercase tracking-[0.28em] text-slate-500">{label}</div>
        <div className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-ink-950">{value}</div>
        <div className="mt-2 text-sm text-slate-500">{note}</div>
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

function QuickTool({
  label,
  icon,
}: {
  label: string
  icon: ReactNode
}) {
  return (
    <button className="inline-flex items-center gap-2 rounded-none border border-line bg-white px-3 py-2 text-sm text-slate-600 transition hover:border-slate-300 hover:text-ink-950">
      {icon}
      {label}
    </button>
  )
}

export function DashboardPage() {
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

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <QuickTool label="Review printers" icon={<Printer className="size-4" />} />
        <QuickTool label="Sync directory" icon={<RefreshCw className="size-4" />} />
        <QuickTool label="Redirect jobs" icon={<ArrowRightLeft className="size-4" />} />
        <QuickTool label="Maintenance queue" icon={<Wrench className="size-4" />} />
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <SummaryStat label="Active users" value={`${activeUsers}`} note="Can sign in" tone="accent" />
        <SummaryStat label="Suspended" value={`${suspendedUsers}`} note="Blocked after auth" tone="danger" />
        <SummaryStat label="Pages today" value={`${pagesToday}`} note="Current print volume" tone="sky" />
        <SummaryStat label="Pending release" value={`${holdReleaseJobs}`} note="Jobs waiting on devices" tone="warn" />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
        <section className="ui-panel overflow-hidden">
          <div className="border-b border-line bg-mist-50/80 px-5 py-4">
            <div className="text-base font-medium text-ink-950">System status</div>
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
            <div className="text-base font-medium text-ink-950">Print activity</div>
          </div>
          <div className="px-5 py-5">
            <div className="rounded-none border border-line bg-white p-4">
              <svg viewBox="0 0 760 320" className="h-[21rem] w-full">
                {[0, 1, 2, 3, 4, 5].map((row) => (
                  <line
                    key={row}
                    x1="0"
                    x2="760"
                    y1={20 + row * 50}
                    y2={20 + row * 50}
                    stroke="#e7edf3"
                  />
                ))}
                <polyline
                  fill="none"
                  points={linePoints(trendValues, 760, 260)}
                  transform="translate(0 20)"
                  stroke="#43a047"
                  strokeWidth="3"
                />
                {linePoints(trendValues, 760, 260)
                  .split(' ')
                  .map((point, index) => {
                    const [x, y] = point.split(',').map(Number)
                    return (
                      <circle
                        key={`${point}-${index}`}
                        cx={x}
                        cy={y + 20}
                        r="3.5"
                        fill="#43a047"
                      />
                    )
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

      <section className="ui-panel mt-5 overflow-hidden">
        <div className="border-b border-line bg-mist-50/80 px-5 py-4">
          <div className="text-base font-medium text-ink-950">Printer status</div>
        </div>
        <div className="grid gap-5 px-5 py-5 lg:grid-cols-[minmax(0,1fr)_220px]">
          <div className="space-y-3">
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

          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <span className="size-2.5 rounded-full bg-danger-500" />
              <span className="text-slate-600">Device is offline</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="size-2.5 rounded-full bg-warn-500" />
              <span className="text-slate-600">Needs maintenance</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="size-2.5 rounded-full bg-accent-500" />
              <span className="text-slate-600">Online</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="size-2.5 rounded-full bg-sky-500" />
              <span className="text-slate-600">{pagesToday} pages today</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
