import { useEffect, useDeferredValue, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Bell, CheckCircle2, RotateCcw } from 'lucide-react'
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
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  useEffect(() => {
    listTechAlerts().then(setAlerts)
  }, [])
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Acknowledged'>('All')
  const [severityFilter, setSeverityFilter] = useState<'All severities' | TechAlert['severity']>('All severities')
  const deferredSearch = useDeferredValue(search)

  const filteredAlerts = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase()
    return alerts.filter((alert) => {
      const matchesSearch =
        !query ||
        [alert.title, alert.description, alert.deviceName ?? ''].some((v) =>
          v.toLowerCase().includes(query),
        )
      const matchesFilter =
        statusFilter === 'All'
          ? true
          : statusFilter === 'Active'
            ? !alert.acknowledged
            : alert.acknowledged
      const matchesSeverity =
        severityFilter === 'All severities' ? true : alert.severity === severityFilter
      return matchesSearch && matchesFilter && matchesSeverity
    })
  }, [alerts, deferredSearch, statusFilter, severityFilter])

  function resetFilters() {
    setSearch('')
    setStatusFilter('All')
    setSeverityFilter('All severities')
  }

  return (
    <div className="min-w-0">
      <PageHeader eyebrow="Alerts" title="Alert triage" />

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search alerts"
        filters={
          <>
            <label className="min-w-[10rem] flex-1 sm:flex-none">
              <span className="sr-only">Status</span>
              <select
                className="ui-select h-9 w-full min-w-[10rem]"
                aria-label="Status"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as 'All' | 'Active' | 'Acknowledged')}
              >
                <option>All</option>
                <option>Active</option>
                <option>Acknowledged</option>
              </select>
            </label>
            <label className="min-w-[11rem] flex-1 sm:flex-none">
              <span className="sr-only">Severity</span>
              <select
                className="ui-select h-9 w-full min-w-[11rem]"
                aria-label="Severity"
                value={severityFilter}
                onChange={(event) => setSeverityFilter(event.target.value as 'All severities' | TechAlert['severity'])}
              >
                <option>All severities</option>
                <option value="critical">Critical</option>
                <option value="warning">Warning</option>
                <option value="info">Info</option>
              </select>
            </label>
            <button type="button" className="ui-button-secondary h-9 px-3 py-0" onClick={resetFilters}>
              <RotateCcw className="size-3.5" />
              Reset
            </button>
          </>
        }
      />

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
