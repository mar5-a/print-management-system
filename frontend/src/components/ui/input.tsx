import * as React from 'react'
import { cn } from '@/lib/utils'

export function Input({ className, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      className={cn(
        'h-10 w-full rounded-md border border-line bg-panel px-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20',
        className,
      )}
      {...props}
    />
  )
}
