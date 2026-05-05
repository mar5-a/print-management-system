import { Plus, RotateCcw } from 'lucide-react'
import { FilterBar } from '../composite/filter-bar'
import type { AdminQueue } from '@/types/admin'

export type QueueStatusFilter = AdminQueue['status'] | 'All statuses'

interface QueuesToolbarProps {
  search: string
  status: QueueStatusFilter
  onSearchChange: (value: string) => void
  onStatusChange: (value: QueueStatusFilter) => void
  onReset: () => void
  onAddQueue: () => void
}

export function QueuesToolbar({
  search,
  status,
  onSearchChange,
  onStatusChange,
  onReset,
  onAddQueue,
}: QueuesToolbarProps) {
  return (
    <FilterBar
      searchValue={search}
      onSearchChange={onSearchChange}
      searchPlaceholder="Search queues"
      actions={
        <>
          <label className="min-w-[10rem] flex-1 sm:flex-none">
            <span className="sr-only">Status</span>
            <select
              aria-label="Status"
              className="ui-select h-9 w-full min-w-[10rem]"
              value={status}
              onChange={(event) => onStatusChange(event.target.value as QueueStatusFilter)}
            >
              <option>All statuses</option>
              <option>Online</option>
              <option>Offline</option>
            </select>
          </label>
          <button type="button" className="ui-button-secondary h-9 px-3 py-0" onClick={onReset}>
            <RotateCcw className="size-3.5" />
            Reset
          </button>
          <button type="button" className="ui-button-action h-9 px-3 py-0" onClick={onAddQueue}>
            <Plus className="size-4" />
            New queue
          </button>
        </>
      }
    />
  )
}
