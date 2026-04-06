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
    <aside className="ui-panel h-fit min-w-0">
      <div className="border-b border-line bg-mist-50 px-4 py-3">
        <div className="ui-kicker">Actions</div>
        <div className="mt-1 text-sm font-semibold text-ink-950">{title}</div>
      </div>
      <div className="divide-y divide-line">
        {items.map((item) => (
          <button
            key={item.label}
            className={cn(
              'flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-mist-50',
              item.tone === 'danger' ? 'text-danger-500' : 'text-ink-950',
            )}
          >
            <item.icon className="mt-0.5 size-4 shrink-0" />
            <span className="min-w-0">
              <span className="block text-sm font-medium">{item.label}</span>
              {item.hint ? <span className="mt-1 block text-xs text-slate-500">{item.hint}</span> : null}
            </span>
          </button>
        ))}
      </div>
    </aside>
  )
}
