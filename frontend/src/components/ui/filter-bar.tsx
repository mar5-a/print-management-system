import { Search} from 'lucide-react'
import type { ReactNode } from 'react'

interface FilterBarProps {
  searchValue: string
  onSearchChange: (value: string) => void
  searchPlaceholder: string
  children?: ReactNode
}

export function FilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder,
  children,
}: FilterBarProps) {
  return (
    <div className="ui-panel-muted flex flex-col gap-3 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative min-w-0 flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            className="ui-input pl-10"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  )
}
