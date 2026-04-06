import { cn } from '../../lib/utils'

export function StatusBadge({ status }: { status: string }) {
  const tone =
    status === 'Active' || status === 'Online'
      ? 'bg-accent-100 text-accent-700'
      : status === 'Suspended' || status === 'Offline'
        ? 'bg-danger-100 text-danger-500'
        : 'bg-warn-100 text-warn-500'

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-[0.72rem] font-semibold tracking-[0.08em]',
        tone,
      )}
    >
      {status}
    </span>
  )
}
