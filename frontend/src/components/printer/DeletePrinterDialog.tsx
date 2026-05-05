import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import type { AdminPrinter } from '@/types/admin'

interface DeletePrinterDialogProps {
  open: boolean
  printer: AdminPrinter
  confirmation: string
  isDeleting: boolean
  canConfirm: boolean
  onOpenChange: (open: boolean) => void
  onConfirmationChange: (value: string) => void
  onConfirm: () => void
}

export function DeletePrinterDialog({
  open,
  printer,
  confirmation,
  isDeleting,
  canConfirm,
  onOpenChange,
  onConfirmationChange,
  onConfirm,
}: DeletePrinterDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(92vw,460px)]">
        <div className="px-5 py-5">
          <DialogTitle className="text-lg font-semibold text-ink-950">Delete printer?</DialogTitle>
          <DialogDescription className="mt-3 text-sm leading-6 text-slate-600">
            This will remove {printer.name} from active printer management. To confirm, type{' '}
            <span className="font-mono font-semibold text-ink-950">{printer.name}</span>.
          </DialogDescription>
          <label className="mt-5 block">
            <span className="ui-detail-label">Confirm printer name</span>
            <input
              className="ui-input mt-2 font-mono"
              value={confirmation}
              onChange={(event) => onConfirmationChange(event.target.value)}
              placeholder={printer.name}
              autoComplete="off"
            />
          </label>
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              className="ui-button-secondary h-10 px-4"
              disabled={isDeleting}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="ui-button-danger-soft h-10 px-4 disabled:pointer-events-none disabled:opacity-45"
              disabled={isDeleting || !canConfirm}
              onClick={onConfirm}
            >
              {isDeleting ? 'Deleting...' : 'Permanently delete'}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
