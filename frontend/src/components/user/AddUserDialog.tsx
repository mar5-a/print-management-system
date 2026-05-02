import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import type { CreateUserInput, NewUserRole } from '@/features/admin/users/api'

type FormState = {
  username: string
  displayName: string
  email: string
  groupName: string
  role: NewUserRole | ''
  status: CreateUserInput['status'] | ''
  restricted: 'Yes' | 'No' | ''
  balance: string
}

const initialForm: FormState = {
  username: '',
  displayName: '',
  email: '',
  groupName: '',
  role: '',
  status: '',
  restricted: '',
  balance: '0',
}

interface AddUserDialogProps {
  open: boolean
  groupOptions: string[]
  roleOptions?: NewUserRole[]
  isSubmitting: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (input: CreateUserInput) => Promise<void>
}

export function AddUserDialog({
  open,
  groupOptions,
  roleOptions = ['Administrator', 'Technician', 'Student'],
  isSubmitting,
  onOpenChange,
  onSubmit,
}: AddUserDialogProps) {
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

    if (!form.groupName || !form.role || !form.status || !form.restricted) {
      setSubmitError('Please complete all required fields.')
      return
    }

    try {
      await onSubmit({
        username: form.username,
        displayName: form.displayName,
        email: form.email,
        groupName: form.groupName,
        role: form.role,
        status: form.status,
        restricted: form.restricted === 'Yes',
        balance: Math.max(0, Number(form.balance || 0)),
      })
      setForm(initialForm)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Unable to add user.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(92vw,560px)]">
        <div className="border-b border-line px-5 py-4">
          <DialogTitle className="text-base font-semibold text-ink-950">Add user</DialogTitle>
          <DialogDescription className="sr-only">Create a new user account.</DialogDescription>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-5">
          <div className="space-y-4">
            <label className="grid items-center gap-2 sm:grid-cols-[8rem_minmax(0,1fr)]">
              <span className="text-sm font-medium text-slate-600">Username</span>
              <input
                className="ui-input"
                value={form.username}
                onChange={(event) => updateForm('username', event.target.value)}
                required
                maxLength={120}
              />
            </label>

            <label className="grid items-center gap-2 sm:grid-cols-[8rem_minmax(0,1fr)]">
              <span className="text-sm font-medium text-slate-600">Full Name</span>
              <input
                className="ui-input"
                value={form.displayName}
                onChange={(event) => updateForm('displayName', event.target.value)}
                required
                maxLength={255}
              />
            </label>

            <label className="grid items-center gap-2 sm:grid-cols-[8rem_minmax(0,1fr)]">
              <span className="text-sm font-medium text-slate-600">Email address</span>
              <input
                className="ui-input"
                type="email"
                value={form.email}
                onChange={(event) => updateForm('email', event.target.value)}
                required
                maxLength={255}
              />
            </label>

            <label className="grid items-center gap-2 sm:grid-cols-[8rem_minmax(0,1fr)]">
              <span className="text-sm font-medium text-slate-600">Group</span>
              <select
                className="ui-select"
                value={form.groupName}
                onChange={(event) => updateForm('groupName', event.target.value)}
                required
              >
                <option value="">Select group</option>
                {groupOptions.map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid items-center gap-2 sm:grid-cols-[8rem_minmax(0,1fr)]">
              <span className="text-sm font-medium text-slate-600">Role</span>
              <select
                className="ui-select"
                value={form.role}
                onChange={(event) => updateForm('role', event.target.value as FormState['role'])}
                required
              >
                <option value="">Select role</option>
                {roleOptions.map((roleOption) => (
                  <option key={roleOption}>{roleOption}</option>
                ))}
              </select>
            </label>

            <label className="grid items-center gap-2 sm:grid-cols-[8rem_minmax(0,1fr)]">
              <span className="text-sm font-medium text-slate-600">Status</span>
              <select
                className="ui-select"
                value={form.status}
                onChange={(event) => updateForm('status', event.target.value as FormState['status'])}
                required
              >
                <option value="">Select status</option>
                <option>Active</option>
                <option>Suspended</option>
              </select>
            </label>

            <label className="grid items-center gap-2 sm:grid-cols-[8rem_minmax(0,1fr)]">
              <span className="text-sm font-medium text-slate-600">Restricted</span>
              <select
                className="ui-select"
                value={form.restricted}
                onChange={(event) => updateForm('restricted', event.target.value as FormState['restricted'])}
                required
              >
                <option value="">Select option</option>
                <option>No</option>
                <option>Yes</option>
              </select>
            </label>

            <label className="grid items-center gap-2 sm:grid-cols-[8rem_minmax(0,1fr)]">
              <span className="text-sm font-medium text-slate-600">Balance</span>
              <input
                className="ui-input"
                type="number"
                min="0"
                step="1"
                value={form.balance}
                onChange={(event) => updateForm('balance', event.target.value)}
              />
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
              {isSubmitting ? 'Saving...' : 'Save user'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
