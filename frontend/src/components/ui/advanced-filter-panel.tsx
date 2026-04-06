import { Funnel, RotateCcw } from 'lucide-react'

interface FilterField {
  id: string
  label: string
  value: string
  options: string[]
  onChange?: (value: string) => void
}

interface AdvancedFilterPanelProps {
  fields: FilterField[]
  actionLabel?: string
  compact?: boolean
}

export function AdvancedFilterPanel({
  fields,
  actionLabel = 'Reset filters',
  compact = false,
}: AdvancedFilterPanelProps) {
  return (
    <section className="ui-panel mb-5 overflow-hidden">
      <div className={compact ? 'border-b border-line px-4 py-3' : 'border-b border-line px-5 py-4'}>
        <div className={compact ? 'flex items-center gap-3 text-lg font-semibold text-ink-950' : 'flex items-center gap-3 text-xl font-semibold text-ink-950'}>
          <Funnel className={compact ? 'size-4.5 text-slate-500' : 'size-5 text-slate-500'} />
          Filters
        </div>
      </div>

      <div className={compact ? 'grid gap-3 px-4 py-4 md:grid-cols-2 xl:grid-cols-5' : 'grid gap-4 px-5 py-5 md:grid-cols-2 xl:grid-cols-5'}>
        {fields.map((field) => (
          <label key={field.id}>
            <div className={compact ? 'text-[0.92rem] font-semibold text-slate-700' : 'text-sm font-semibold text-slate-700'}>{field.label}</div>
            <select
              className={compact ? 'ui-select mt-1.5 h-9 w-full' : 'ui-select mt-2 w-full'}
              value={field.value}
              onChange={(event) => field.onChange?.(event.target.value)}
            >
              {field.options.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
        ))}

        <div className="flex items-end">
          <button className={compact ? 'ui-button-secondary h-9 w-full justify-center px-3 py-0' : 'ui-button-secondary w-full justify-center'}>
            <RotateCcw className={compact ? 'size-3.5' : 'size-4'} />
            {actionLabel}
          </button>
        </div>
      </div>
    </section>
  )
}
