import { Plus, RotateCcw } from 'lucide-react'
import { FilterBar } from '../ui/filter-bar'
import type { PrinterStatusFilter } from './printer-format'

interface PrintersToolbarProps {
  search: string
  status: PrinterStatusFilter
  onSearchChange: (value: string) => void
  onStatusChange: (value: PrinterStatusFilter) => void
  onReset: () => void
  onAddPrinter?: () => void
}

export function PrintersToolbar({
  search,
  status,
  onSearchChange,
  onStatusChange,
  onReset,
  onAddPrinter,
}: PrintersToolbarProps) {
  return (
    <FilterBar
      searchValue={search}
      onSearchChange={onSearchChange}
      searchPlaceholder="Search printers"
      actions={
        <>
          <label className="min-w-[10rem] flex-1 sm:flex-none">
            <span className="sr-only">Status</span>
            <select
              className="ui-select h-9 w-full min-w-[10rem]"
              aria-label="Status"
              value={status}
              onChange={(event) => onStatusChange(event.target.value as PrinterStatusFilter)}
            >
              <option>All statuses</option>
              <option>Online</option>
              <option>Offline</option>
              <option>Maintenance</option>
            </select>
          </label>
          <button type="button" className="ui-button-secondary h-9 px-3 py-0" onClick={onReset}>
            <RotateCcw className="size-3.5" />
            Reset
          </button>
          {onAddPrinter ? (
            <button type="button" className="ui-button-action h-9 px-3 py-0" onClick={onAddPrinter}>
              <Plus className="size-4" />
              Add printer
            </button>
          ) : null}
        </>
      }
    />
  )
}
