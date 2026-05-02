import type { ReactNode } from 'react'

interface TechStatCardProps {
  label: string
  value: string | number
  tone?: 'accent' | 'sky' | 'warn' | 'danger'
  icon: ReactNode
}

export function TechStatCard({ label, value, tone = 'accent', icon }: TechStatCardProps) {
  const toneClass =
    tone === 'danger'
      ? 'bg-danger-500'
      : tone === 'warn'
        ? 'bg-warn-500'
        : tone === 'sky'
          ? 'bg-sky-500'
          : 'bg-accent-500'

  return (
    <section className="ui-panel overflow-hidden">
      <div className={`h-1 w-full ${toneClass}`} />
      <div className="flex items-center justify-between gap-3 px-4 py-3.5">
        <div>
          <div className="text-xs font-semibold text-slate-600">{label}</div>
          <div className="mt-1 text-2xl font-semibold tracking-tight text-ink-950">{value}</div>
        </div>
        <div className="text-slate-500">{icon}</div>
      </div>
    </section>
  )
}
