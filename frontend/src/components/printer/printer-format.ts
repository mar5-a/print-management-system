import type { AdminPrinter } from '@/types/admin'

export type PrinterStatusFilter = AdminPrinter['status'] | 'All statuses'

export function getPrinterStatusClass(status: AdminPrinter['status']) {
  return status === 'Online'
    ? 'text-sm text-accent-700'
    : status === 'Offline'
      ? 'text-sm text-danger-500'
      : 'text-sm text-warn-500'
}

export function getPrinterReleaseSummary(printer: AdminPrinter) {
  return printer.holdReleaseMode === 'Immediate' ? 'Immediate output' : 'Device authentication required'
}

export function getPrinterOperationalIssue(printer: AdminPrinter) {
  if (printer.status === 'Offline') {
    return 'Offline. Release attempts stay held until the device reconnects.'
  }

  if (printer.status === 'Maintenance') {
    return 'Under maintenance. Redirect or wait before releasing more jobs.'
  }

  if (printer.toner <= 20) {
    return 'Low toner warning. Device still available for release.'
  }

  return 'No active device faults reported.'
}
