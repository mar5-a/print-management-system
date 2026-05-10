import { Toaster as Sonner } from 'sonner'
import { useTheme } from '@/lib/theme'

export function Toaster() {
  const { theme } = useTheme()

  return (
    <Sonner
      theme={theme}
      closeButton
      position="top-right"
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: 'rounded-lg border border-line bg-panel px-4 py-3 text-sm text-foreground shadow-[0_10px_26px_-16px_rgba(4,18,36,0.55)]',
          title: 'font-semibold text-foreground',
          description: 'text-sm text-muted-foreground',
          actionButton: 'ui-button',
          cancelButton: 'ui-button-secondary',
        },
      }}
    />
  )
}
