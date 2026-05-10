import * as React from 'react'
import { cn } from '@/lib/utils'

export function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      className={cn(
        'min-h-28 w-full rounded-md border border-line bg-panel px-3 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20',
        className,
      )}
      {...props}
    />
  )
}
