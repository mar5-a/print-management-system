import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

interface Column<T> {
  key: string
  header: string
  className?: string
  render: (row: T) => ReactNode
}

interface DataTableProps<T> {
  columns: Column<T>[]
  rows: T[]
  getRowKey: (row: T) => string
  onRowClick?: (row: T) => void
  emptyLabel: string
  selectedKeys?: Set<string>
  onSelectionChange?: (keys: Set<string>) => void
}

export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  onRowClick,
  emptyLabel,
  selectedKeys,
  onSelectionChange,
}: DataTableProps<T>) {
  const selectable = !!onSelectionChange
  const allKeys = rows.map(getRowKey)
  const allSelected = allKeys.length > 0 && allKeys.every(k => selectedKeys?.has(k))
  const someSelected = !allSelected && allKeys.some(k => selectedKeys?.has(k))

  function toggleAll() {
    if (!onSelectionChange) return
    if (allSelected) {
      onSelectionChange(new Set())
    } else {
      onSelectionChange(new Set(allKeys))
    }
  }

  function toggleRow(key: string) {
    if (!onSelectionChange || !selectedKeys) return
    const next = new Set(selectedKeys)
    next.has(key) ? next.delete(key) : next.add(key)
    onSelectionChange(next)
  }

  return (
    <div className="ui-panel overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr>
              {selectable && (
                <th className="ui-table-head w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={el => { if (el) el.indeterminate = someSelected }}
                    onChange={toggleAll}
                    className="cursor-pointer"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th key={column.key} className={cn('ui-table-head text-left', column.className)}>
                  {column.header}
                </th>
              ))}
              {onRowClick ? <th className="ui-table-head w-14 text-right"></th> : null}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  className="px-4 py-10 text-center text-sm text-slate-500"
                  colSpan={columns.length + (onRowClick ? 1 : 0) + (selectable ? 1 : 0)}
                >
                  {emptyLabel}
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const key = getRowKey(row)
                const isSelected = selectedKeys?.has(key) ?? false
                return (
                  <motion.tr
                    key={key}
                    layout
                    className={cn(
                      'border-b border-line/80 transition last:border-b-0',
                      onRowClick ? 'cursor-pointer hover:bg-accent-100/40' : '',
                      isSelected ? 'bg-accent-50' : '',
                    )}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                  >
                    {selectable && (
                      <td className="ui-table-cell w-10" onClick={e => { e.stopPropagation(); toggleRow(key) }}>
                        <input type="checkbox" checked={isSelected} onChange={() => toggleRow(key)} className="cursor-pointer" />
                      </td>
                    )}
                    {columns.map((column) => (
                      <td key={column.key} className={cn('ui-table-cell align-top', column.className)}>
                        {column.render(row)}
                      </td>
                    ))}
                    {onRowClick ? (
                      <td className="ui-table-cell text-right text-slate-400">
                        <ChevronRight className="ml-auto size-4" />
                      </td>
                    ) : null}
                  </motion.tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

