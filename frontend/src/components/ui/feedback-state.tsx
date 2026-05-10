import { AlertTriangle, Database, LoaderCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FeedbackStateProps {
  title: string
  message: string
  tone?: 'empty' | 'loading' | 'error'
  compact?: boolean
}

const toneStyles = {
  empty: {
    wrapper: 'border-line bg-muted/60 text-muted-foreground',
    icon: Database,
  },
  loading: {
    wrapper: 'border-line bg-muted/60 text-muted-foreground',
    icon: LoaderCircle,
  },
  error: {
    wrapper: 'border-danger-500/30 bg-danger-100 text-danger-500',
    icon: AlertTriangle,
  },
} as const

export function FeedbackState({
  title,
  message,
  tone = 'empty',
  compact = false,
}: FeedbackStateProps) {
  const config = toneStyles[tone]
  const Icon = config.icon

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg border px-4 py-4',
        compact ? 'text-sm' : 'text-base',
        config.wrapper,
      )}
      role={tone === 'error' ? 'alert' : 'status'}
      aria-live={tone === 'loading' ? 'polite' : undefined}
    >
      <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-md bg-panel">
        <Icon className={cn('size-4', tone === 'loading' ? 'animate-spin' : '')} />
      </span>
      <div>
        <div className={cn('font-semibold', tone === 'error' ? 'text-danger-500' : 'text-foreground')}>
          {title}
        </div>
        <div className={cn('mt-0.5 text-sm', tone === 'error' ? 'text-danger-500/90' : 'text-muted-foreground')}>
          {message}
        </div>
      </div>
    </div>
  )
}
