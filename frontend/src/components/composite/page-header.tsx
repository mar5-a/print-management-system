import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description?: string
  eyebrow?: string
  meta?: ReactNode
}

export function PageHeader({ title, description, eyebrow, meta }: PageHeaderProps) {
  const showEyebrow = Boolean(eyebrow && eyebrow.trim().toLowerCase() !== title.trim().toLowerCase())

  return (
    <header className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
      <div>
        {showEyebrow ? <div className="ui-kicker">{eyebrow}</div> : null}
        <h2 className={`${showEyebrow ? 'mt-1.5 ' : ''}text-[clamp(1.45rem,1.7vw,2rem)] font-semibold tracking-normal text-ink-950`}>
          {title}
        </h2>
        {description ? <p className="mt-1.5 max-w-3xl text-sm leading-5 text-slate-600">{description}</p> : null}
      </div>
      {meta ? <div className="flex flex-wrap items-center gap-2">{meta}</div> : null}
    </header>
  )
}
