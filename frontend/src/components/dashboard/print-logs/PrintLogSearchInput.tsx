import { Search } from 'lucide-react'

type PrintLogSearchInputProps = {
  value: string
  ariaLabel?: string
  placeholder?: string
  onChange: (value: string) => void
}

export function PrintLogSearchInput({
  value,
  ariaLabel = 'Search users',
  placeholder = 'Search users...',
  onChange,
}: PrintLogSearchInputProps) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
      <input
        aria-label={ariaLabel}
        className="h-10 w-full border border-line bg-white pl-10 pr-3 text-sm text-ink-950 outline-none transition placeholder:text-slate-400 focus:border-accent-500 focus:ring-2 focus:ring-accent-500/10"
        placeholder={placeholder}
        type="search"
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
      />
    </div>
  )
}
