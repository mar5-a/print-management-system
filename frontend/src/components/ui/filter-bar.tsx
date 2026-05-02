import { Search } from 'lucide-react'
import type { ReactNode } from 'react'

interface FilterBarProps {
  searchValue: string
  onSearchChange: (value: string) => void
  searchPlaceholder: string
  actions?: ReactNode
  children?: ReactNode
  filters?: ReactNode
}

export function FilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder,
  actions,
  children,
  filters,
}: FilterBarProps) {
  const actionContent = actions ?? children

  return (
    <div className="ui-panel-muted px-3 py-3">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-[18rem] flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <label className="relative min-w-0 flex-1 sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              className="ui-input h-9 pl-9"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(event) => onSearchChange(event.target.value)}
            />
          </label>
        </div>

        {actionContent ? <div className="flex min-w-0 flex-wrap items-center gap-2 lg:justify-end">{actionContent}</div> : null}
      </div>

      {filters ? (
        <div className="mt-3 flex flex-col gap-2 border-t border-line pt-3 xl:flex-row xl:items-center">
          <div className="shrink-0 text-xs font-semibold text-slate-600">Filters</div>
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">{filters}</div>
        </div>
      ) : null}
    </div>
  )
}
