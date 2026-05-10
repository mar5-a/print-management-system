import type { ReactNode } from 'react'

type StatusRowProps = {
  icon: ReactNode
  label: string
  value: string
  tone?: 'default' | 'warn' | 'danger' | 'success'
}

export function StatusRow({ icon, label, value, tone = 'default' }: StatusRowProps) {
  const toneClass =
    tone === 'danger'
      ? 'text-danger-500'
      : tone === 'warn'
        ? 'text-warn-500'
        : tone === 'success'
          ? 'text-accent-600'
          : 'text-slate-500'

  return (
    <div className="flex items-center justify-between gap-3 border-b border-line/80 py-2.5 last:border-b-0">
      <div className="flex min-w-0 items-center gap-2.5 text-sm">
        <span className={toneClass}>{icon}</span>
        <span className="truncate text-slate-600">{label}</span>
      </div>
      <span className="text-sm font-medium text-ink-950">{value}</span>
    </div>
  )
}
