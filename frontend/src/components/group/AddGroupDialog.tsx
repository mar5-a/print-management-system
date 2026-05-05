import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import type { GroupMutationInput } from '@/features/admin/groups/api'

type FormState = {
  name: string
  description: string
  schedule: GroupMutationInput['schedule']
  quotaPerPeriod: string
  studentRestricted: boolean
  defaultForNewUsers: boolean
}

const initialForm: FormState = {
  name: '',
  description: '',
  schedule: 'Monthly',
  quotaPerPeriod: '1000',
  studentRestricted: true,
  defaultForNewUsers: false,
}

interface AddGroupDialogProps {
  open: boolean
  isSubmitting: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (input: GroupMutationInput) => Promise<void>
}

export function AddGroupDialog({
  open,
  isSubmitting,
  onOpenChange,
  onSubmit,
}: AddGroupDialogProps) {
  const [form, setForm] = useState<FormState>(initialForm)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setForm(initialForm)
      setSubmitError(null)
    }
  }, [open])

  function updateForm<Field extends keyof FormState>(field: Field, value: FormState[Field]) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitError(null)

    try {
      await onSubmit({
        name: form.name,
        description: form.description,
        schedule: form.schedule,
        quotaPerPeriod: Math.max(0, Number(form.quotaPerPeriod || 0)),
        studentRestricted: form.studentRestricted,
        defaultForNewUsers: form.defaultForNewUsers,
      })
      setForm(initialForm)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Unable to create group.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(92vw,560px)]">
        <div className="border-b border-line px-5 py-4">
          <DialogTitle className="text-base font-semibold text-ink-950">Add new group</DialogTitle>
          <DialogDescription className="sr-only">Create a new quota and access group.</DialogDescription>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-5">
          <div className="space-y-4">
            <label className="grid items-center gap-2 sm:grid-cols-[8rem_minmax(0,1fr)]">
              <span className="text-sm font-medium text-slate-600">Group name</span>
              <input
                className="ui-input"
                value={form.name}
                onChange={(event) => updateForm('name', event.target.value)}
                required
                maxLength={120}
              />
            </label>

            <label className="grid gap-2 sm:grid-cols-[8rem_minmax(0,1fr)]">
              <span className="pt-2 text-sm font-medium text-slate-600">Description</span>
              <textarea
                className="ui-textarea min-h-20"
                value={form.description}
                onChange={(event) => updateForm('description', event.target.value)}
                maxLength={1000}
              />
            </label>

            <label className="grid items-center gap-2 sm:grid-cols-[8rem_minmax(0,1fr)]">
              <span className="text-sm font-medium text-slate-600">Period</span>
              <select
                className="ui-select"
                value={form.schedule}
                onChange={(event) => updateForm('schedule', event.target.value as FormState['schedule'])}
              >
                <option>Weekly</option>
                <option>Monthly</option>
                <option>Semester</option>
              </select>
            </label>

            <label className="grid items-center gap-2 sm:grid-cols-[8rem_minmax(0,1fr)]">
              <span className="text-sm font-medium text-slate-600">Initial balance</span>
              <input
                className="ui-input"
                type="number"
                min="0"
                step="1"
                value={form.quotaPerPeriod}
                onChange={(event) => updateForm('quotaPerPeriod', event.target.value)}
              />
            </label>

            <label className="grid items-center gap-2 sm:grid-cols-[8rem_minmax(0,1fr)]">
              <span className="text-sm font-medium text-slate-600">Restricted</span>
              <select
                className="ui-select"
                value={form.studentRestricted ? 'Yes' : 'No'}
                onChange={(event) => updateForm('studentRestricted', event.target.value === 'Yes')}
              >
                <option>No</option>
                <option>Yes</option>
              </select>
            </label>

            <label className="grid items-center gap-2 sm:grid-cols-[8rem_minmax(0,1fr)]">
              <span className="text-sm font-medium text-slate-600">Default group</span>
              <select
                className="ui-select"
                value={form.defaultForNewUsers ? 'Yes' : 'No'}
                onChange={(event) => updateForm('defaultForNewUsers', event.target.value === 'Yes')}
              >
                <option>No</option>
                <option>Yes</option>
              </select>
            </label>
          </div>

          {submitError ? (
            <div className="mt-4 border border-danger-500/30 bg-danger-100 px-3 py-2 text-sm text-danger-500">
              {submitError}
            </div>
          ) : null}

          <div className="mt-7 flex justify-end gap-2">
            <button
              type="button"
              className="ui-button-secondary h-9 px-4 py-0"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button type="submit" className="ui-button h-9 px-4 py-0" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create group'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
