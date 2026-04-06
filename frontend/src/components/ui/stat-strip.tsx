import type { ReactNode } from 'react'

interface StatItem {
  label: string
  value: string
  hint?: string
  icon?: ReactNode
}

export function StatStrip({ items }: { items: StatItem[] }) {
  return (
    <div className="ui-panel mb-5 grid gap-0 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="border-b border-line px-4 py-4 last:border-b-0 sm:border-b-0 sm:border-r last:sm:border-r-0"
        >
          <div className="flex items-center gap-2 text-slate-500">
            {item.icon}
            <span className="ui-heading">{item.label}</span>
          </div>
          <div className="mt-3 text-2xl font-semibold tracking-tight text-ink-950">{item.value}</div>
          {item.hint ? <div className="mt-1 text-sm text-slate-500">{item.hint}</div> : null}
        </div>
      ))}
    </div>
  )
}
