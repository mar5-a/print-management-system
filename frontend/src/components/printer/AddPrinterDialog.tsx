import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import type { CreatePrinterInput } from '@/features/admin/printers/api'
import type { AdminPrinter } from '@/types/admin'

type FormState = {
  name: string
  hostedOn: string
  ipAddress: string
  status: AdminPrinter['status'] | ''
  model: string
  serialNumber: string
  toner: string
  location: string
  holdReleaseMode: AdminPrinter['holdReleaseMode'] | ''
  isColor: 'Yes' | 'No' | ''
}

const initialForm: FormState = {
  name: '',
  hostedOn: '',
  ipAddress: '',
  status: '',
  model: '',
  serialNumber: '',
  toner: '100',
  location: '',
  holdReleaseMode: '',
  isColor: '',
}

interface AddPrinterDialogProps {
  open: boolean
  isSubmitting: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (input: CreatePrinterInput) => Promise<void>
}

export function AddPrinterDialog({
  open,
  isSubmitting,
  onOpenChange,
  onSubmit,
}: AddPrinterDialogProps) {
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

    if (!form.status || !form.holdReleaseMode || !form.isColor) {
      setSubmitError('Please complete all required fields.')
      return
    }

    try {
      await onSubmit({
        name: form.name,
        hostedOn: form.hostedOn,
        ipAddress: form.ipAddress,
        status: form.status,
        model: form.model,
        serialNumber: form.serialNumber,
        toner: Math.max(0, Math.min(100, Number(form.toner || 0))),
        location: form.location,
        holdReleaseMode: form.holdReleaseMode,
        isColor: form.isColor === 'Yes',
      })
      setForm(initialForm)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Unable to add printer.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[min(92vw,640px)] overflow-y-auto">
        <div className="border-b border-line px-5 py-4">
          <DialogTitle className="text-base font-semibold text-ink-950">Add printer</DialogTitle>
          <DialogDescription className="sr-only">Create a new printer record.</DialogDescription>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-5">
          <div className="space-y-4">
            <label className="grid items-center gap-2 sm:grid-cols-[8rem_minmax(0,1fr)]">
              <span className="text-sm font-medium text-slate-600">Printer name</span>
              <input
                className="ui-input"
                value={form.name}
                onChange={(event) => updateForm('name', event.target.value)}
                required
                maxLength={150}
              />
            </label>

            <label className="grid items-center gap-2 sm:grid-cols-[8rem_minmax(0,1fr)]">
              <span className="text-sm font-medium text-slate-600">Hosted on</span>
              <input
                className="ui-input"
                value={form.hostedOn}
                onChange={(event) => updateForm('hostedOn', event.target.value)}
                maxLength={255}
              />
            </label>

            <label className="grid items-center gap-2 sm:grid-cols-[8rem_minmax(0,1fr)]">
              <span className="text-sm font-medium text-slate-600">IP address</span>
              <input
                className="ui-input font-mono"
                value={form.ipAddress}
                onChange={(event) => updateForm('ipAddress', event.target.value)}
                maxLength={45}
              />
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
                <option>Online</option>
                <option>Offline</option>
                <option>Maintenance</option>
              </select>
            </label>

            <label className="grid items-center gap-2 sm:grid-cols-[8rem_minmax(0,1fr)]">
              <span className="text-sm font-medium text-slate-600">Type/Model</span>
              <input
                className="ui-input"
                value={form.model}
                onChange={(event) => updateForm('model', event.target.value)}
                maxLength={150}
              />
            </label>

            <label className="grid items-center gap-2 sm:grid-cols-[8rem_minmax(0,1fr)]">
              <span className="text-sm font-medium text-slate-600">Serial number</span>
              <input
                className="ui-input font-mono"
                value={form.serialNumber}
                onChange={(event) => updateForm('serialNumber', event.target.value)}
                maxLength={255}
              />
            </label>

            <label className="grid items-center gap-2 sm:grid-cols-[8rem_minmax(0,1fr)]">
              <span className="text-sm font-medium text-slate-600">Toner status</span>
              <input
                className="ui-input"
                type="number"
                min="0"
                max="100"
                step="1"
                value={form.toner}
                onChange={(event) => updateForm('toner', event.target.value)}
              />
            </label>

            <label className="grid items-center gap-2 sm:grid-cols-[8rem_minmax(0,1fr)]">
              <span className="text-sm font-medium text-slate-600">Location</span>
              <input
                className="ui-input"
                value={form.location}
                placeholder="Room 339 - Building 22"
                onChange={(event) => updateForm('location', event.target.value)}
                maxLength={255}
              />
            </label>

            <label className="grid items-center gap-2 sm:grid-cols-[8rem_minmax(0,1fr)]">
              <span className="text-sm font-medium text-slate-600">Device release</span>
              <select
                className="ui-select"
                value={form.holdReleaseMode}
                onChange={(event) => updateForm('holdReleaseMode', event.target.value as FormState['holdReleaseMode'])}
                required
              >
                <option value="">Select release</option>
                <option>Secure Release</option>
                <option>Immediate</option>
              </select>
            </label>

            <label className="grid items-center gap-2 sm:grid-cols-[8rem_minmax(0,1fr)]">
              <span className="text-sm font-medium text-slate-600">Color</span>
              <select
                className="ui-select"
                value={form.isColor}
                onChange={(event) => updateForm('isColor', event.target.value as FormState['isColor'])}
                required
              >
                <option value="">Select option</option>
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
              {isSubmitting ? 'Saving...' : 'Save printer'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
