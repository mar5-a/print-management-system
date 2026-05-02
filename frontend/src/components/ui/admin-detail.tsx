import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

interface DetailPanelProps {
  children: ReactNode
  className?: string
}

interface DetailSectionProps {
  title: string
  children: ReactNode
  className?: string
  columns?: 'single' | 'paired'
  hint?: string
}

interface DetailAlertProps {
  title: string
  description: string
  actions?: ReactNode
  className?: string
  tone?: 'danger' | 'warn' | 'success'
}

interface DetailActionBarProps {
  children: ReactNode
  className?: string
}

export function DetailPanel({ children, className }: DetailPanelProps) {
  return <div className={cn('space-y-3', className)}>{children}</div>
}

export function DetailSection({
  title,
  children,
  className,
  columns = 'paired',
  hint,
}: DetailSectionProps) {
  return (
    <section className={cn('ui-panel px-4 py-4', className)}>
      <div className="ui-detail-title">{title}</div>
      {hint ? <p className="ui-detail-hint mt-1">{hint}</p> : null}
      <div className={cn('mt-3 grid gap-3', columns === 'paired' ? 'xl:grid-cols-2' : '')}>
        {children}
      </div>
    </section>
  )
}

export function DetailAlert({
  title,
  description,
  actions,
  className,
  tone = 'danger',
}: DetailAlertProps) {
  const toneClasses =
    tone === 'success'
      ? 'border-accent-500/20 bg-accent-100/50'
      : tone === 'warn'
        ? 'border-warn-500/20 bg-warn-100/60'
        : 'border-danger-500/20 bg-danger-100/80'

  const titleClasses =
    tone === 'success'
      ? 'text-accent-700'
      : tone === 'warn'
        ? 'text-warn-500'
        : 'text-danger-500'

  return (
    <section className={cn('mb-4 border px-4 py-3', toneClasses, className)}>
      <div className={cn('text-sm font-semibold', titleClasses)}>{title}</div>
      <p className="mt-1.5 max-w-3xl text-sm leading-5 text-slate-700">{description}</p>
      {actions ? <div className="mt-3 flex flex-wrap gap-2">{actions}</div> : null}
    </section>
  )
}

export function DetailActionBar({ children, className }: DetailActionBarProps) {
  return <div className={cn('ui-detail-actions', className)}>{children}</div>
}
