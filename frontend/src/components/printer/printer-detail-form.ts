import type { AdminPrinter } from '@/types/admin'

export type PrinterDetailForm = {
  name: string
  hostedOn: string
  ipAddress: string
  status: AdminPrinter['status']
  model: string
  serialNumber: string
  toner: string
  location: string
  holdReleaseMode: AdminPrinter['holdReleaseMode']
  isColor: boolean
}

export type PrinterDetailFormChangeHandler = <Field extends keyof PrinterDetailForm>(
  field: Field,
  value: PrinterDetailForm[Field],
) => void

export function buildPrinterDetailForm(printer: AdminPrinter): PrinterDetailForm {
  return {
    name: printer.name,
    hostedOn: printer.hostedOn,
    ipAddress: printer.ipAddress,
    status: printer.status,
    model: printer.model,
    serialNumber: printer.serialNumber,
    toner: String(printer.toner),
    location: printer.location,
    holdReleaseMode: printer.holdReleaseMode,
    isColor: printer.isColor,
  }
}

export function isSamePrinterDetailForm(left: PrinterDetailForm, right: PrinterDetailForm) {
  return (
    left.name === right.name &&
    left.hostedOn === right.hostedOn &&
    left.ipAddress === right.ipAddress &&
    left.status === right.status &&
    left.model === right.model &&
    left.serialNumber === right.serialNumber &&
    left.toner === right.toner &&
    left.location === right.location &&
    left.holdReleaseMode === right.holdReleaseMode &&
    left.isColor === right.isColor
  )
}
