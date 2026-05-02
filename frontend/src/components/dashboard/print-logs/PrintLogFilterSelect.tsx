import { ChevronDown } from 'lucide-react'
import type { PrintLogFilterOption } from '@/features/admin/dashboard/api'

type PrintLogFilterSelectProps = {
  ariaLabel: string
  placeholder: string
  value: string
  options: PrintLogFilterOption[]
  onChange: (value: string) => void
}

export function PrintLogFilterSelect({
  ariaLabel,
  placeholder,
  value,
  options,
  onChange,
}: PrintLogFilterSelectProps) {
  return (
    <div className="relative">
      <select
        aria-label={ariaLabel}
        className="h-10 w-full appearance-none border border-line bg-white px-3 pr-10 text-sm text-slate-600 outline-none transition focus:border-accent-500 focus:ring-2 focus:ring-accent-500/10"
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
      >
        <option value="all">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
    </div>
  )
}
