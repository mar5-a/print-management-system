import { ChevronLeft, ChevronRight } from 'lucide-react'

type PrintLogsPaginationProps = {
  page: number
  limit: number
  total: number
  totalPages: number
  onPageChange: (page: number) => void
  onLimitChange: (limit: number) => void
}

const limitOptions = [10, 25, 50]

export function PrintLogsPagination({
  page,
  limit,
  total,
  totalPages,
  onPageChange,
  onLimitChange,
}: PrintLogsPaginationProps) {
  const firstResult = total === 0 ? 0 : (page - 1) * limit + 1
  const lastResult = Math.min(page * limit, total)
  const pages = buildVisiblePages(page, totalPages)

  return (
    <div className="mt-4 flex flex-col gap-3 text-sm text-slate-600 xl:flex-row xl:items-center xl:justify-between">
      <div>
        Showing {firstResult} to {lastResult} of {total} logs
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <button
            aria-label="Previous page"
            className="flex size-8 items-center justify-center rounded-lg border border-transparent text-slate-600 transition hover:border-line hover:bg-mist-50 disabled:cursor-not-allowed disabled:text-slate-300"
            disabled={page <= 1}
            type="button"
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeft className="size-4" />
          </button>

          {pages.map((item, index) =>
            item === 'gap' ? (
              <span key={`${item}-${index}`} className="px-1.5 text-slate-500">
                ...
              </span>
            ) : (
              <button
                key={item}
                className={
                  item === page
                    ? 'flex size-8 items-center justify-center rounded-lg border border-accent-500 bg-accent-100 text-xs font-semibold text-accent-700'
                    : 'flex size-8 items-center justify-center rounded-lg border border-transparent text-xs font-medium text-slate-600 transition hover:border-line hover:bg-mist-50'
                }
                type="button"
                onClick={() => onPageChange(item)}
              >
                {item}
              </button>
            ),
          )}

          <button
            aria-label="Next page"
            className="flex size-8 items-center justify-center rounded-lg border border-transparent text-slate-600 transition hover:border-line hover:bg-mist-50 disabled:cursor-not-allowed disabled:text-slate-300"
            disabled={page >= totalPages}
            type="button"
            onClick={() => onPageChange(page + 1)}
          >
            <ChevronRight className="size-4" />
          </button>
        </div>

        <select
          aria-label="Rows per page"
          className="h-9 rounded-lg border border-line bg-panel px-2.5 text-xs text-slate-600 outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20"
          value={limit}
          onChange={(event) => onLimitChange(Number(event.currentTarget.value))}
        >
          {limitOptions.map((option) => (
            <option key={option} value={option}>
              {option} / page
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

function buildVisiblePages(page: number, totalPages: number): Array<number | 'gap'> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  if (page <= 4) {
    return [1, 2, 3, 4, 5, 'gap', totalPages]
  }

  if (page >= totalPages - 3) {
    return [1, 'gap', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
  }

  return [1, 'gap', page - 1, page, page + 1, 'gap', totalPages]
}
