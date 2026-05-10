import type { LucideIcon } from 'lucide-react'
import { ArrowDownRight, ArrowRight, ArrowUpRight } from 'lucide-react'

type SummaryStatTone = 'accent' | 'success' | 'info' | 'violet' | 'warn' | 'danger'

type SummaryStatProps = {
  label: string
  value: string | number
  icon: LucideIcon
  tone?: SummaryStatTone
  hint?: string
  delta?: {
    value: string
    direction: 'up' | 'down' | 'flat'
  }
  progress?: {
    value: number
    total: number
    label?: string
  }
}

const toneStyles: Record<SummaryStatTone, { strip: string; chip: string; text: string }> = {
  accent: {
    strip: 'bg-accent-500',
    chip: 'bg-accent-100 text-accent-700',
    text: 'text-accent-700',
  },
  success: {
    strip: 'bg-accent-500',
    chip: 'bg-accent-100 text-accent-700',
    text: 'text-accent-700',
  },
  info: {
    strip: 'bg-info-500',
    chip: 'bg-info-100 text-info-700',
    text: 'text-info-700',
  },
  violet: {
    strip: 'bg-violet-500',
    chip: 'bg-violet-100 text-violet-700',
    text: 'text-violet-700',
  },
  warn: {
    strip: 'bg-warn-500',
    chip: 'bg-warn-100 text-warn-500',
    text: 'text-warn-500',
  },
  danger: {
    strip: 'bg-danger-500',
    chip: 'bg-danger-100 text-danger-500',
    text: 'text-danger-500',
  },
}

export function SummaryStat({
  label,
  value,
  icon: Icon,
  tone = 'accent',
  hint,
  delta,
  progress,
}: SummaryStatProps) {
  const style = toneStyles[tone]
  const progressRatio = progress ? Math.min(Math.max(progress.value / Math.max(progress.total, 1), 0), 1) : 0

  return (
    <section className="ui-panel overflow-hidden">
      <div className={`h-1 w-full ${style.strip}`} />

      <div className="px-4 py-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[0.72rem] font-semibold tracking-[0.08em] text-slate-500 uppercase">{label}</div>
            <div className="mt-1.5 text-[1.95rem] leading-none font-semibold tracking-tight text-ink-950">{value}</div>
          </div>
          <span className={`inline-flex size-9 shrink-0 items-center justify-center rounded-xl ${style.chip}`}>
            <Icon className="size-4.5" />
          </span>
        </div>

        {progress ? (
          <div className="mt-3.5">
            <div className="flex items-center justify-between gap-2 text-xs text-slate-600">
              <span>{progress.label ?? `${progress.value}/${progress.total} online`}</span>
              <span className="font-medium text-ink-950">{Math.round(progressRatio * 100)}%</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-mist-100">
              <div className={`h-full rounded-full ${style.strip}`} style={{ width: `${progressRatio * 100}%` }} />
            </div>
          </div>
        ) : hint || delta ? (
          <div className="mt-3.5 flex items-center justify-between gap-3 text-xs">
            <span className="truncate text-slate-500">{hint ?? ' '}</span>
            {delta ? (
              <span className={`inline-flex items-center gap-1 font-medium ${style.text}`}>
                {delta.direction === 'up' ? (
                  <ArrowUpRight className="size-3.5" />
                ) : delta.direction === 'down' ? (
                  <ArrowDownRight className="size-3.5" />
                ) : (
                  <ArrowRight className="size-3.5" />
                )}
                {delta.value}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  )
}
