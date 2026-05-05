type Printer = {
  id: string | number
  name: string
  status: 'Online' | 'Offline' | 'Maintenance' | string
  pendingJobs: number
}

type PrinterStatusPanelProps = {
  printers: Printer[]
}

export function PrinterStatusPanel({ printers }: PrinterStatusPanelProps) {
  return (
    <section className="ui-panel overflow-hidden">
      <div className="border-b border-line bg-mist-50/80 px-5 py-4">
        <div className="text-base font-semibold text-ink-950">Printer status</div>
      </div>

      <div className="space-y-3 px-5 py-5">
        {printers.map((printer) => (
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
  )
}