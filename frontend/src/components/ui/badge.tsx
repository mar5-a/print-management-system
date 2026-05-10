import type { HTMLAttributes } from 'react'
import { cn, cva, type VariantProps } from '@/lib/utils'

const badgeVariants = cva('inline-flex items-center rounded-full px-2.5 py-1 text-[0.72rem] font-semibold', {
  variants: {
    variant: {
      default: 'bg-muted text-muted-foreground',
      success: 'bg-accent-100 text-accent-700',
      warn: 'bg-warn-100 text-warn-500',
      danger: 'bg-danger-100 text-danger-500',
      dark: 'bg-ink-950 text-white',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}
