interface PrinterTonerFieldProps {
  value: string
  onChange: (value: string) => void
}

export function PrinterTonerField({ value, onChange }: PrinterTonerFieldProps) {
  const percentage = Math.max(0, Math.min(100, Number(value || 0)))
  const barClassName = percentage <= 20 ? 'h-full bg-warn-500' : 'h-full bg-accent-500'

  return (
    <label>
      <div className="ui-detail-label">Toner status</div>
      <div className="mt-2 border border-line bg-white px-3 py-3">
        <div className="flex items-center gap-3">
          <input
            className="ui-input h-9 max-w-28"
            type="number"
            min="0"
            max="100"
            step="1"
            value={value}
            onChange={(event) => onChange(event.target.value)}
          />
          <span className="text-sm font-medium text-ink-950">%</span>
        </div>
        <div className="mt-3 h-2 bg-slate-100">
          <div className={barClassName} style={{ width: `${percentage}%` }} />
        </div>
      </div>
    </label>
  )
}
