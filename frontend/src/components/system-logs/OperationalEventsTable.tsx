import type { OperationalEvent } from '@/features/admin/system-logs/api'

interface OperationalEventsTableProps {
  rows: OperationalEvent[]
  isLoading: boolean
  error: string | null
}

export function OperationalEventsTable({ rows, isLoading, error }: OperationalEventsTableProps) {
  return (
    <div className="mt-4 overflow-hidden border border-line bg-white">
      <div className="max-h-[17rem] overflow-y-auto">
        <table className="min-w-full table-fixed border-collapse">
          <thead className="sticky top-0 z-10 bg-mist-50">
            <tr>
              <th className="ui-table-head w-[24%] text-left">Type</th>
              <th className="ui-table-head w-[26%] text-left">Action</th>
              <th className="ui-table-head w-[25%] text-left">Actor</th>
              <th className="ui-table-head text-left">Time</th>
            </tr>
          </thead>
          <tbody>
            {error ? (
              <tr>
                <td className="px-4 py-10 text-center text-sm text-danger-500" colSpan={4}>
                  {error}
                </td>
              </tr>
            ) : isLoading && rows.length === 0 ? (
              <tr>
                <td className="px-4 py-10 text-center text-sm text-slate-500" colSpan={4}>
                  Loading operational events...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="px-4 py-10 text-center text-sm text-slate-500" colSpan={4}>
                  No operational events match the current filters.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-b border-line/80 last:border-b-0">
                  <td className="ui-table-cell text-slate-600">{row.type}</td>
                  <td className="ui-table-cell text-slate-600">{row.action}</td>
                  <td className="ui-table-cell font-mono text-[0.78rem] font-semibold text-ink-950">{row.actor}</td>
                  <td className="ui-table-cell text-slate-600">{row.time}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
