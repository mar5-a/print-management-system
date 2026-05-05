import { RotateCcw, SlidersHorizontal } from 'lucide-react'
import type { LogsRange } from '@/features/admin/system-logs/api'

interface LogsFiltersProps {
  range: LogsRange
  onRangeChange: (range: LogsRange) => void
  onReset: () => void
}

export function LogsFilters({
  range,
  onRangeChange,
  onReset,
}: LogsFiltersProps) {
  return (
    <section className="ui-panel-muted mb-4 flex flex-col gap-3 px-4 py-4 xl:flex-row xl:items-center">
      <div className="flex shrink-0 items-center gap-2 text-sm font-semibold text-ink-950">
        <SlidersHorizontal className="size-4 text-slate-500" />
        Filters
      </div>

      <div className="grid min-w-0 flex-1 gap-3 md:grid-cols-[12rem_auto]">
        <label>
          <span className="sr-only">Date range</span>
          <select
            aria-label="Date range"
            className="ui-select h-10 w-full"
            value={range}
            onChange={(event) => onRangeChange(event.target.value as LogsRange)}
          >
            <option value="day">Last 24 hours</option>
            <option value="week">Last 7 days</option>
            <option value="month">Last 30 days</option>
          </select>
        </label>

        <button type="button" className="ui-button-secondary h-10 px-3 py-0" onClick={onReset}>
          <RotateCcw className="size-3.5" />
          Reset
        </button>
      </div>
    </section>
  )
}
