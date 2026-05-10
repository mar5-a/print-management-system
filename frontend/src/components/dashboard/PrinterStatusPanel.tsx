type Printer = {
  id: string | number
  name: string
  status: 'Online' | 'Offline' | 'Maintenance' | string
  pendingJobs: number
}

type PrinterStatusPanelProps = {
  printers: Printer[]
}

type StatusBucket = {
  label: string
  value: number
  toneClass: string
}

export function PrinterStatusPanel({ printers }: PrinterStatusPanelProps) {
  const total = printers.length
  const online = printers.filter((printer) => printer.status === 'Online').length
  const offline = printers.filter((printer) => printer.status === 'Offline').length
  const maintenance = printers.filter((printer) => printer.status === 'Maintenance').length
  const other = Math.max(total - online - offline - maintenance, 0)

  const segments = [
    { value: online, color: 'var(--color-accent-500)' },
    { value: maintenance, color: 'var(--color-warn-500)' },
    { value: offline, color: 'var(--color-danger-500)' },
    { value: other, color: 'var(--color-slate-300)' },
  ].filter((segment) => segment.value > 0)

  let cursor = 0
  const ringStops = segments.length
    ? segments
        .map((segment) => {
          const start = cursor
          const ratio = segment.value / Math.max(total, 1)
          cursor += ratio * 360
          return `${segment.color} ${start.toFixed(2)}deg ${cursor.toFixed(2)}deg`
        })
        .join(', ')
    : 'var(--color-slate-200) 0deg 360deg'

  const statusBreakdown: StatusBucket[] = [
    { label: 'Online', value: online, toneClass: 'bg-accent-500' },
    { label: 'Maintenance', value: maintenance, toneClass: 'bg-warn-500' },
    { label: 'Offline', value: offline, toneClass: 'bg-danger-500' },
    { label: 'Other', value: other, toneClass: 'bg-slate-300' },
  ].filter((entry) => entry.value > 0)

  return (
    <section className="ui-panel overflow-hidden">
      <div className="border-b border-line bg-violet-100/65 px-4 py-3.5">
        <div className="text-base font-semibold text-ink-950">Device health</div>
      </div>

      <div className="space-y-4 px-4 py-4">
        <div className="grid items-center gap-4 sm:grid-cols-[8.5rem_minmax(0,1fr)]">
          <div className="mx-auto grid size-32 place-items-center rounded-full border border-line bg-panel" style={{ backgroundImage: `conic-gradient(${ringStops})` }}>
            <div className="grid size-[5.7rem] place-items-center rounded-full bg-panel shadow-[inset_0_0_0_1px_var(--color-line)]">
              <div className="text-center">
                <div className="text-[1.35rem] leading-none font-semibold text-ink-950">{total}</div>
                <div className="mt-1 text-[0.65rem] font-medium tracking-[0.08em] text-slate-500 uppercase">Printers</div>
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            {statusBreakdown.length === 0 ? (
              <div className="rounded-xl border border-line bg-mist-50 px-3 py-2.5 text-sm text-slate-500">No printer status data.</div>
            ) : (
              statusBreakdown.map((entry) => (
                <div key={entry.label} className="flex items-center justify-between gap-3 text-sm">
                  <span className="inline-flex items-center gap-2 text-slate-600">
                    <span className={`size-2.5 rounded-full ${entry.toneClass}`} />
                    {entry.label}
                  </span>
                  <span className="font-medium text-ink-950">{entry.value}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border border-line bg-mist-50/75">
          <div className="border-b border-line px-3.5 py-2.5 text-sm font-semibold text-ink-950">Printer status</div>
          {printers.length === 0 ? (
            <div className="px-3.5 py-4 text-sm text-slate-500">No printers available.</div>
          ) : (
            <div className="divide-y divide-line/80 px-3.5">
              {printers.slice(0, 6).map((printer) => (
                <div key={printer.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-ink-950">{printer.name}</div>
                    <div className={getStatusTextClass(printer.status)}>{printer.status}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-ink-950">{printer.pendingJobs}</div>
                    <div className="text-[0.7rem] uppercase tracking-[0.07em] text-slate-500">Pending</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function getStatusTextClass(status: string) {
  if (status === 'Online') {
    return 'mt-0.5 text-xs font-medium text-accent-700'
  }

  if (status === 'Offline') {
    return 'mt-0.5 text-xs font-medium text-danger-500'
  }

  if (status === 'Maintenance') {
    return 'mt-0.5 text-xs font-medium text-warn-500'
  }

  return 'mt-0.5 text-xs font-medium text-slate-500'
}
