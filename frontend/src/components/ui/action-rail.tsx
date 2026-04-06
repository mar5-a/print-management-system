import type { LucideIcon } from 'lucide-react'
import { cn } from '../../lib/utils'

interface ActionItem {
  label: string
  hint?: string
  tone?: 'default' | 'danger'
  icon: LucideIcon
}

interface ActionRailProps {
  title: string
  items: ActionItem[]
}

export function ActionRail({ title, items }: ActionRailProps) {
  return (
    <section className="ui-panel mb-5 overflow-hidden">
      <div className="border-b border-line bg-accent-100/35 px-5 py-4">
        <div className="ui-kicker text-accent-700">Actions</div>
        <div className="mt-1 text-base font-semibold text-ink-950">{title}</div>
      </div>
      <div className="grid gap-px bg-line md:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <button
            key={item.label}
            className={cn(
              'flex min-h-22 w-full items-start gap-3 bg-white px-5 py-4 text-left transition hover:bg-mist-50',
              item.tone === 'danger' ? 'text-danger-500' : 'text-ink-950',
            )}
          >
            <div
              className={cn(
                'flex size-9 shrink-0 items-center justify-center border',
                item.tone === 'danger'
                  ? 'border-danger-100 bg-danger-100 text-danger-500'
                  : 'border-accent-100 bg-accent-100 text-accent-700',
              )}
            >
              <item.icon className="size-4" />
            </div>
            <span className="min-w-0">
              <span className="block text-sm font-semibold">{item.label}</span>
              {item.hint ? <span className="mt-1 block text-xs text-slate-500">{item.hint}</span> : null}
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}
