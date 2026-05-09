import { useState } from 'react'
import { CheckCircle2, AlertTriangle, Info, LoaderCircle, X } from 'lucide-react'

const toneConfig = {
  success: {
    border: 'border-l-green-600',
    bg: 'bg-green-50',
    icon: CheckCircle2,
    iconClass: 'text-green-600',
  },
  error: {
    border: 'border-l-danger-500',
    bg: 'bg-danger-50',
    icon: AlertTriangle,
    iconClass: 'text-danger-500',
  },
  info: {
    border: 'border-l-blue-600',
    bg: 'bg-blue-50',
    icon: Info,
    iconClass: 'text-blue-600',
  },
  loading: {
    border: 'border-l-amber-600',
    bg: 'bg-amber-50',
    icon: LoaderCircle,
    iconClass: 'text-amber-600',
  },
} as const

export function PortalFeedbackBanner({
  tone,
  title,
  message,
  action,
  onDismiss,
}: {
  tone: 'success' | 'error' | 'info' | 'loading'
  title: string
  message: string
  action?: { label: string; onClick: () => void }
  onDismiss?: () => void
}) {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  const cfg = toneConfig[tone]
  const Icon = cfg.icon

  return (
    <div className={`flex items-start gap-3 border border-line border-l-4 ${cfg.border} ${cfg.bg} px-4 py-3`}>
      <Icon className={`mt-0.5 size-5 shrink-0 ${cfg.iconClass} ${tone === 'loading' ? 'animate-spin' : ''}`} />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-ink-950">{title}</div>
        <div className="mt-1 text-sm text-slate-600">{message}</div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {action ? (
          <button
            type="button"
            className="ui-button px-3 py-1.5 text-sm"
            onClick={action.onClick}
          >
            {action.label}
          </button>
        ) : null}
        {onDismiss ? (
          <button
            type="button"
            className="p-1 text-slate-400 hover:text-ink-950"
            onClick={() => {
              setDismissed(true)
              onDismiss()
            }}
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>
    </div>
  )
}

export function PortalProgressPanel({
  title,
  message,
  visible,
}: {
  title: string
  message: string
  visible: boolean
}) {
  if (!visible) return null

  return (
    <div className="ui-panel-muted flex flex-col items-center gap-2 px-4 py-8 text-center">
      <LoaderCircle className="size-6 animate-spin text-accent-700" />
      <div className="text-sm font-semibold text-ink-950">{title}</div>
      <div className="text-sm text-slate-500">{message}</div>
    </div>
  )
}

