import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cn, cva, type VariantProps } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-md border text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500/20 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        default: 'border-ink-950 bg-ink-950 px-4 py-2 font-semibold text-white hover:border-accent-600 hover:bg-accent-600',
        secondary: 'border-line bg-panel px-4 py-2 font-medium text-foreground hover:border-slate-300 hover:bg-muted',
        ghost: 'border-transparent bg-transparent px-3 py-2 font-medium text-muted-foreground hover:bg-muted hover:text-foreground',
        danger: 'border-danger-500 bg-danger-500 px-4 py-2 font-semibold text-white hover:bg-danger-500/90',
      },
      size: {
        default: '',
        sm: 'px-3 py-1.5 text-sm',
        icon: 'size-10 px-0 py-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : 'button'

  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />
}
