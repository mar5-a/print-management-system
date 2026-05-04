import { Trash2 } from 'lucide-react'

interface UserDetailActionsProps {
  isSaving: boolean
  controlsDisabled: boolean
  isReadOnly?: boolean
  onCancel: () => void
  onSave: () => void
  onDelete: () => void
}

export function UserDetailActions({
  isSaving,
  controlsDisabled,
  isReadOnly = false,
  onCancel,
  onSave,
  onDelete,
}: UserDetailActionsProps) {
  return (
    <section className="ui-panel mt-4 flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
      <button
        type="button"
        className="ui-button-danger-soft h-10 px-4 disabled:pointer-events-none disabled:opacity-45"
        disabled={isReadOnly}
        onClick={onDelete}
      >
        <Trash2 className="size-4" />
        Delete user
      </button>
      <div className="flex justify-end gap-3">
        <button
          type="button"
          className="ui-button-ghost h-10 px-4 disabled:pointer-events-none disabled:opacity-45"
          disabled={controlsDisabled}
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          type="button"
          className="ui-button h-10 px-5 disabled:pointer-events-none disabled:opacity-45"
          disabled={controlsDisabled}
          onClick={onSave}
        >
          {isSaving ? 'Saving...' : 'Save changes'}
        </button>
      </div>
    </section>
  )
}
