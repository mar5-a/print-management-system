import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Bell, CheckCircle2 } from 'lucide-react'
import { DetailAlert } from '@/components/ui/admin-detail'
import { DataTable } from '@/components/ui/data-table'
import { FilterBar } from '@/components/ui/filter-bar'
import { PageHeader } from '@/components/ui/page-header'
import { listTechAlerts } from './api'
import type { TechAlert } from '@/types/technician'

function severityIcon(severity: TechAlert['severity']) {
  if (severity === 'critical') return <AlertTriangle className="size-4 text-danger-500" />
  if (severity === 'warning') return <Bell className="size-4 text-warn-500" />
  return <CheckCircle2 className="size-4 text-slate-400" />
}

export function TechAlertsScreen() {
  const [alerts, setAlerts] = useState<TechAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'All' | 'Active' | 'Acknowledged'>('All')
  const deferredSearch = useDeferredValue(search)

  useEffect(() => {
    listTechAlerts()
      .then(setAlerts)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load alerts'))
      .finally(() => setLoading(false))
  }, [])

  const filteredAlerts = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase()
    return alerts.filter((alert) => {
      const matchesSearch =
        !query ||
        [alert.title, alert.description, alert.deviceName ?? ''].some((v) =>
          v.toLowerCase().includes(query),
        )
      const matchesFilter =
        filter === 'All'
          ? true
          : filter === 'Active'
            ? !alert.acknowledged
            : alert.acknowledged
      return matchesSearch && matchesFilter
    })
  }, [alerts, deferredSearch, filter])

  return (
    <div className="min-w-0">
      <PageHeader eyebrow="Alerts" title="System alerts" description="Printer, device, and directory events that require technician review. Configuration changes remain outside this surface." />

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search alerts"
      >
        {(['All', 'Active', 'Acknowledged'] as const).map((value) => (
          <button
            key={value}
            className={filter === value ? 'ui-button-secondary border-accent-500 text-accent-700' : 'ui-button-ghost'}
            onClick={() => setFilter(value)}
          >
            {value}
          </button>
        ))}
      </FilterBar>

      {error ? (
        <div className="mt-4">
          <DetailAlert title="Unable to load alerts" description={error} />
        </div>
      ) : null}

      {loading ? <div className="mt-4 text-sm text-slate-500">Loading alerts...</div> : null}

      <div className="mt-4">
        <DataTable<TechAlert>
          columns={[
            {
              key: 'severity',
              header: '',
              className: 'w-10',
              render: (a) => severityIcon(a.severity),
            },
            {
              key: 'title',
              header: 'Alert',
              render: (a) => (
                <div>
                  <span className={a.acknowledged ? 'ui-table-secondary' : 'ui-table-primary-strong'}>
                    {a.title}
                  </span>
                  <div className="mt-0.5 text-xs text-slate-400">{a.createdAt}</div>
                </div>
              ),
            },
            {
              key: 'source',
              header: 'Source',
              render: (a) => <span className="ui-table-secondary">{a.source}</span>,
            },
            {
              key: 'device',
              header: 'Device',
              render: (a) => (
                <span className="ui-table-secondary">{a.deviceName ?? '—'}</span>
              ),
            },
            {
              key: 'status',
              header: 'Status',
              render: (a) => (
                <span
                  className={
                    a.acknowledged
                      ? 'text-sm text-slate-400'
                      : 'text-sm font-medium text-danger-500'
                  }
                >
                  {a.acknowledged ? 'Acknowledged' : 'Active'}
                </span>
              ),
            },
          ]}
          rows={filteredAlerts}
          getRowKey={(a) => a.id}
          onRowClick={(a) => navigate(`/tech/alerts/${a.id}`)}
          emptyLabel="No alerts match the current search."
        />
      </div>
    </div>
  )
}
