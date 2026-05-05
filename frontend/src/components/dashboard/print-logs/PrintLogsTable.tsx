import type { RecentPrintRow } from '@/features/admin/dashboard/api'

type PrintLogsTableProps = {
  rows: RecentPrintRow[]
  isLoading: boolean
  error: string | null
}

export function PrintLogsTable({ rows, isLoading, error }: PrintLogsTableProps) {
  return (
    <div className="mt-4 overflow-hidden border border-line bg-white">
      <div className="max-h-[17rem] overflow-y-auto">
        <table className="min-w-full table-fixed border-collapse">
          <thead className="sticky top-0 z-10 bg-mist-50">
            <tr>
              <th className="ui-table-head w-[22%] text-left">User</th>
              <th className="ui-table-head w-[22%] text-left">Device</th>
              <th className="ui-table-head w-[12%] text-left">Pages</th>
              <th className="ui-table-head w-[16%] text-left">Status</th>
              <th className="ui-table-head text-left">Time</th>
            </tr>
          </thead>
          <tbody>
            {error ? (
              <tr>
                <td className="px-4 py-10 text-center text-sm text-danger-500" colSpan={5}>
                  {error}
                </td>
              </tr>
            ) : isLoading && rows.length === 0 ? (
              <tr>
                <td className="px-4 py-10 text-center text-sm text-slate-500" colSpan={5}>
                  Loading print logs...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="px-4 py-10 text-center text-sm text-slate-500" colSpan={5}>
                  No print logs match the current filters.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-b border-line/80 last:border-b-0">
                  <td className="ui-table-cell font-mono text-[0.78rem] font-semibold text-ink-950">{row.user}</td>
                  <td className="ui-table-cell text-slate-600">{row.device}</td>
                  <td className="ui-table-cell text-slate-600">{row.pages}</td>
                  <td className="ui-table-cell">
                    <PrintLogStatusBadge status={row.status} />
                  </td>
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

function PrintLogStatusBadge({ status }: { status: string }) {
  const className =
    status === 'Completed'
      ? 'bg-accent-100 text-accent-700'
      : status === 'Failed'
        ? 'bg-danger-100 text-danger-500'
        : 'bg-warn-100 text-warn-600'

  return (
    <span className={`inline-flex min-w-[5.25rem] justify-center rounded-full px-3 py-1 text-sm font-semibold ${className}`}>
      {status}
    </span>
  )
}
