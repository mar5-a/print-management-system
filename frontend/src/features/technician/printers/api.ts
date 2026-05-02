import { listPrinters, type ListPrintersInput } from '@/features/admin/printers/api'

export type { ListPrintersInput }

export function listTechPrinters(input: ListPrintersInput = {}) {
  return listPrinters(input)
}
