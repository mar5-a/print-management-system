type SummaryStatProps = {
  label: string
  value: string
  tone?: 'accent' | 'sky' | 'warn' | 'danger'
}

export function SummaryStat({ label, value, tone = 'accent' }: SummaryStatProps) {
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
      <div className="px-4 py-4">
        <div className="text-[0.8rem] font-semibold uppercase tracking-[0.2em] text-slate-700">
          {label}
        </div>
        <div className="mt-4 text-[3rem] leading-none font-semibold tracking-[-0.05em] text-ink-950">
          {value}
        </div>
      </div>
    </section>
  )
}