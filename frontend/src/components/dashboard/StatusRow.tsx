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
    <div className="flex items-center justify-between gap-4 border-b border-line py-3 last:border-b-0">
      <div className="flex items-center gap-3 text-sm">
        <span className={toneClass}>{icon}</span>
        <span className="text-slate-600">{label}</span>
      </div>
      <span className="text-sm font-medium text-ink-950">{value}</span>
    </div>
  )
}