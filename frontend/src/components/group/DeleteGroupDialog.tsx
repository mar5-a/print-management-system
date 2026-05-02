import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import type { AdminGroup } from '@/types/admin'

interface DeleteGroupDialogProps {
  open: boolean
  group: AdminGroup
  confirmation: string
  isDeleting: boolean
  canConfirm: boolean
  onOpenChange: (open: boolean) => void
  onConfirmationChange: (value: string) => void
  onConfirm: () => void
}

export function DeleteGroupDialog({
  open,
  group,
  confirmation,
  isDeleting,
  canConfirm,
  onOpenChange,
  onConfirmationChange,
  onConfirm,
}: DeleteGroupDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(92vw,460px)]">
        <div className="px-5 py-5">
          <DialogTitle className="text-lg font-semibold text-ink-950">Delete group?</DialogTitle>
          <DialogDescription className="mt-3 text-sm leading-6 text-slate-600">
            This will permanently remove {group.name} from the system and remove its user memberships.
            To confirm, type <span className="font-mono font-semibold text-ink-950">{group.name}</span>.
          </DialogDescription>
          <label className="mt-5 block">
            <span className="ui-detail-label">Confirm group name</span>
            <input
              className="ui-input mt-2 font-mono"
              value={confirmation}
              onChange={(event) => onConfirmationChange(event.target.value)}
              placeholder={group.name}
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
