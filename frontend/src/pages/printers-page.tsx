import { useCallback, useDeferredValue, useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { PageHeader } from '../components/ui/page-header'
import { AddPrinterDialog } from '../components/printer/AddPrinterDialog'
import { DeletePrinterDialog } from '../components/printer/DeletePrinterDialog'
import { PrinterDetailActions } from '../components/printer/PrinterDetailActions'
import { PrinterDetailsPanel } from '../components/printer/PrinterDetailsPanel'
import { PrintersHeader } from '../components/printer/PrintersHeader'
import { PrintersTable } from '../components/printer/PrintersTable'
import { PrintersToolbar } from '../components/printer/PrintersToolbar'
import {
  buildPrinterDetailForm,
  isSamePrinterDetailForm,
  type PrinterDetailForm,
} from '../components/printer/printer-detail-form'
import {
  type PrinterStatusFilter,
} from '../components/printer/printer-format'
import {
  createPrinter,
  deletePrinter,
  getPrinterByIdOrUndefined,
  listPrinters,
  updatePrinter,
  type CreatePrinterInput,
} from '../features/admin/printers/api'
import type { AdminPrinter } from '../types/admin'

export function PrintersPage() {
  const [adminPrinters, setAdminPrinters] = useState<AdminPrinter[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<PrinterStatusFilter>('All statuses')
  const [isAddPrinterOpen, setIsAddPrinterOpen] = useState(false)
  const [isCreatingPrinter, setIsCreatingPrinter] = useState(false)
  const deferredSearch = useDeferredValue(search)

  const loadPrinters = useCallback(
    async () =>
      listPrinters({
        search: deferredSearch,
        status,
        limit: 100,
      }),
    [deferredSearch, status],
  )

  useEffect(() => {
    let cancelled = false

    loadPrinters()
      .then((printers) => {
        if (!cancelled) {
          setAdminPrinters(printers)
          setLoadError(null)
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : 'Unable to load printers.')
        }
      })

    return () => {
      cancelled = true
    }
  }, [loadPrinters])

  function resetPrinterFilters() {
    setSearch('')
    setStatus('All statuses')
  }

  async function handleCreatePrinter(input: CreatePrinterInput) {
    setIsCreatingPrinter(true)
    try {
      const createdPrinter = await createPrinter(input)
      const printers = await loadPrinters()
      setAdminPrinters(printers)
      setLoadError(null)
      setIsAddPrinterOpen(false)
      toast.success('Printer has been added', {
        description: `${createdPrinter.name} is now saved in the database.`,
      })
    } finally {
      setIsCreatingPrinter(false)
    }
  }

  return (
    <div className="min-w-0">
      <PrintersHeader />

      <PrintersToolbar
        search={search}
        status={status}
        onSearchChange={setSearch}
        onStatusChange={setStatus}
        onReset={resetPrinterFilters}
        onAddPrinter={() => setIsAddPrinterOpen(true)}
      />

      {loadError ? (
        <div className="mt-4 border border-danger-500/30 bg-danger-100 px-4 py-3 text-sm text-danger-500">
          {loadError}
        </div>
      ) : null}

      <div className="mt-4">
        <PrintersTable
          rows={adminPrinters}
          onRowClick={(printer) => navigate(`/admin/printers/${printer.id}`)}
        />
      </div>

      <AddPrinterDialog
        open={isAddPrinterOpen}
        isSubmitting={isCreatingPrinter}
        onOpenChange={setIsAddPrinterOpen}
        onSubmit={handleCreatePrinter}
      />
    </div>
  )
}

export function PrinterDetailPage() {
  const navigate = useNavigate()
  const { printerId } = useParams()
  const [printer, setPrinter] = useState<AdminPrinter | undefined>()
  const [loaded, setLoaded] = useState(false)
  const [initialForm, setInitialForm] = useState<PrinterDetailForm | null>(null)
  const [form, setForm] = useState<PrinterDetailForm | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoaded(false)

    getPrinterByIdOrUndefined(printerId)
      .then((nextPrinter) => {
        if (!cancelled) {
          setPrinter(nextPrinter)
          if (nextPrinter) {
            const nextForm = buildPrinterDetailForm(nextPrinter)
            setInitialForm(nextForm)
            setForm(nextForm)
          }
          setLoaded(true)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPrinter(undefined)
          setInitialForm(null)
          setForm(null)
          setLoaded(true)
        }
      })

    return () => {
      cancelled = true
    }
  }, [printerId])

  if (!loaded) {
    return <div className="ui-panel px-4 py-6 text-sm text-slate-500">Loading printer...</div>
  }

  if (!printer || !form || !initialForm) {
    return <Navigate to="/admin/printers" replace />
  }

  const hasChanges = !isSamePrinterDetailForm(form, initialForm)
  const controlsDisabled = !hasChanges || isSaving
  const canConfirmDelete = deleteConfirmation.trim() === printer.name

  function updateForm<Field extends keyof PrinterDetailForm>(field: Field, value: PrinterDetailForm[Field]) {
    setForm((current) => (current ? { ...current, [field]: value } : current))
  }

  async function handleSaveChanges() {
    if (!hasChanges || !form || !printer) return

    setIsSaving(true)
    try {
      const updatedPrinter = await updatePrinter(printer.id, {
        name: form.name,
        hostedOn: form.hostedOn,
        ipAddress: form.ipAddress,
        status: form.status,
        model: form.model,
        serialNumber: form.serialNumber,
        toner: Math.max(0, Math.min(100, Number(form.toner || 0))),
        location: form.location,
        holdReleaseMode: form.holdReleaseMode,
        isColor: form.isColor,
      })
      const nextForm = buildPrinterDetailForm(updatedPrinter)
      setPrinter(updatedPrinter)
      setInitialForm(nextForm)
      setForm(nextForm)
      toast.success('Printer info has been updated', {
        description: `${updatedPrinter.name}'s changes were saved to the database.`,
      })
    } catch (error) {
      toast.error('Unable to update printer', {
        description: error instanceof Error ? error.message : 'Please try again.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDeletePrinter() {
    if (!printer || !canConfirmDelete) return

    setIsDeleting(true)
    try {
      const currentPrinter = printer
      await deletePrinter(currentPrinter.id)
      toast.success('Printer removed', {
        description: `${currentPrinter.name} was removed from active printer management.`,
      })
      navigate('/admin/printers', { replace: true })
    } catch (error) {
      toast.error('Unable to delete printer', {
        description: error instanceof Error ? error.message : 'Please try again.',
      })
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
      setDeleteConfirmation('')
    }
  }

  function handleDeleteDialogOpenChange(open: boolean) {
    setIsDeleteDialogOpen(open)
    if (!open) {
      setDeleteConfirmation('')
    }
  }

  return (
    <div className="min-w-0">
      <PageHeader
        eyebrow="Printers"
        title={printer.name}
        description={`${printer.model} · ${printer.hostedOn}`}
        meta={
          <button className="ui-button-secondary" onClick={() => navigate('/admin/printers')}>
            Back to printers
          </button>
        }
      />

      <PrinterDetailsPanel form={form} onFieldChange={updateForm} />
      <PrinterDetailActions
        isSaving={isSaving}
        controlsDisabled={controlsDisabled}
        onCancel={() => setForm(initialForm)}
        onSave={handleSaveChanges}
        onDelete={() => setIsDeleteDialogOpen(true)}
      />
      <DeletePrinterDialog
        open={isDeleteDialogOpen}
        printer={printer}
        confirmation={deleteConfirmation}
        isDeleting={isDeleting}
        canConfirm={canConfirmDelete}
        onOpenChange={handleDeleteDialogOpenChange}
        onConfirmationChange={setDeleteConfirmation}
        onConfirm={handleDeletePrinter}
      />
    </div>
  )
}
