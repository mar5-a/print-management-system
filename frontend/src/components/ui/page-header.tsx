import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description?: string
  eyebrow?: string
  meta?: ReactNode
}

export function PageHeader({ title, description, eyebrow, meta }: PageHeaderProps) {
  return (
    <header className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
      <div>
        {eyebrow ? <div className="ui-kicker">{eyebrow}</div> : null}
        <h2 className="mt-2 text-[clamp(1.7rem,2vw,2.5rem)] font-semibold tracking-tight text-ink-950">
          {title}
        </h2>
        {description ? (
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
        ) : null}
      </div>
      {meta ? <div className="flex flex-wrap items-center gap-2">{meta}</div> : null}
    </header>
  )
}
