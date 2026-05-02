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
  onAction?: () => void
}

export function AdvancedFilterPanel({
  fields,
  actionLabel = 'Reset filters',
  compact = false,
  onAction,
}: AdvancedFilterPanelProps) {
  if (compact) {
    return (
      <section className="ui-panel-muted mb-3 flex flex-col gap-2 px-3 py-3 xl:flex-row xl:items-center">
        <div className="flex shrink-0 items-center gap-2 text-sm font-semibold text-ink-950">
          <Funnel className="size-4 text-slate-500" />
          Filters
        </div>

        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          {fields.map((field) => (
            <label key={field.id} className="min-w-[9rem] flex-1 sm:flex-none">
              <span className="sr-only">{field.label}</span>
              <select
                className="ui-select h-9 w-full min-w-[9rem]"
                aria-label={field.label}
                value={field.value}
                onChange={(event) => field.onChange?.(event.target.value)}
              >
                {field.options.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
          ))}

          <button
            type="button"
            onClick={onAction}
            className="ui-button-secondary h-9 px-3 py-0"
          >
            <RotateCcw className="size-3.5" />
            {actionLabel}
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="ui-panel mb-4 overflow-hidden">
      <div className="border-b border-line px-4 py-3">
        <div className="flex items-center gap-3 text-base font-semibold text-ink-950">
          <Funnel className="size-4 text-slate-500" />
          Filters
        </div>
      </div>

      <div className="grid gap-3 px-4 py-4 md:grid-cols-2 xl:grid-cols-5">
        {fields.map((field) => (
          <label key={field.id}>
            <div className="text-sm font-semibold text-slate-700">{field.label}</div>
            <select
              className="ui-select mt-1.5 h-9 w-full"
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
          <button
            type="button"
            onClick={onAction}
            className="ui-button-secondary h-9 w-full justify-center px-3 py-0"
          >
            <RotateCcw className="size-3.5" />
            {actionLabel}
          </button>
        </div>
      </div>
    </section>
  )
}
