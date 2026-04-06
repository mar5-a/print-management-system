import { useDeferredValue, useMemo, useState } from 'react'
import { Ban, FileText, Plus, RefreshCw, UserRoundSearch } from 'lucide-react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { ActionRail } from '../components/ui/action-rail'
import { DataTable } from '../components/ui/data-table'
import { FilterBar } from '../components/ui/filter-bar'
import { PageHeader } from '../components/ui/page-header'
import { StatusBadge } from '../components/ui/status-badge'
import { adminUsers, getUserById } from '../data/admin-data'
import type { AdminUser } from '../types/admin'

export function UsersPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [scope, setScope] = useState<'All' | 'Active' | 'Suspended'>('All')
  const deferredSearch = useDeferredValue(search)

  const filteredUsers = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase()
    return adminUsers.filter((user) => {
      const matchesSearch =
        !query ||
        [user.displayName, user.username, user.department, user.role].some((value) =>
          value.toLowerCase().includes(query),
        )
      const matchesScope = scope === 'All' ? true : user.status === scope
      return matchesSearch && matchesScope
    })
  }, [deferredSearch, scope])

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
      <div className="min-w-0">
        <PageHeader
          eyebrow="Users"
          title="Identity and access control"
          meta={
            <>
              <button className="ui-button-secondary">
                <RefreshCw className="size-4" />
                Sync AD
              </button>
              <button className="ui-button">
                <Plus className="size-4" />
                Add override
              </button>
            </>
          }
        />

        <FilterBar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by account or name"
        >
          {(['All', 'Active', 'Suspended'] as const).map((value) => (
            <button
              key={value}
              className={scope === value ? 'ui-button-secondary border-accent-500 text-accent-700' : 'ui-button-ghost'}
              onClick={() => setScope(value)}
            >
              {value}
            </button>
          ))}
        </FilterBar>

        <div className="mt-4">
          <DataTable<AdminUser>
            columns={[
              {
                key: 'account',
                header: 'Account',
                render: (user) => (
                  <span className="font-mono text-xs text-ink-950">{user.username}</span>
                ),
              },
              {
                key: 'full-name',
                header: 'Full name',
                render: (user) => <span className="text-sm text-slate-600">{user.displayName}</span>,
              },
              {
                key: 'balance',
                header: 'Balance',
                render: (user) => (
                  <span className="font-semibold text-ink-950">{user.quotaTotal - user.quotaUsed}</span>
                ),
              },
              {
                key: 'restricted',
                header: 'Restricted',
                render: (user) => <span className="text-sm text-slate-600">{user.status === 'Suspended' ? 'Yes' : 'No'}</span>,
              },
              {
                key: 'cards',
                header: 'Cards',
                render: (user) => <span className="text-sm text-slate-600">{user.cardId ? '1' : '0'}</span>,
              },
              {
                key: 'jobs',
                header: 'Jobs',
                render: (user) => <span className="text-sm text-slate-600">{user.jobCount}</span>,
              },
            ]}
            rows={filteredUsers}
            getRowKey={(user) => user.id}
            onRowClick={(user) => navigate(`/admin/users/${user.id}`)}
            emptyLabel="No users match the current search."
          />
        </div>
      </div>

      <ActionRail
        title="User controls"
        items={[
          { label: 'Adjust quotas', icon: Plus },
          { label: 'Suspend selected users', icon: Ban },
          { label: 'View auth activity', icon: UserRoundSearch },
          { label: 'Refresh directory sync', icon: RefreshCw },
        ]}
      />
    </div>
  )
}

export function UserDetailPage() {
  const { userId } = useParams()
  const user = getUserById(userId)

  if (!user) {
    return <Navigate to="/admin/users" replace />
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
      <div className="min-w-0">
        <PageHeader
          eyebrow="Users"
          title="User details"
          description={`${user.displayName} · ${user.username}`}
        />

        <section className="ui-panel overflow-hidden">
          <div className="grid gap-0 border-b border-line md:grid-cols-4">
            <div className="border-b border-line px-5 py-4 md:border-r md:border-b-0">
              <div className="ui-heading">Account</div>
              <div className="mt-3 font-mono text-xs text-ink-950">{user.username}</div>
            </div>
            <div className="border-b border-line px-5 py-4 md:border-r md:border-b-0">
              <div className="ui-heading">Status</div>
              <div className="mt-3">
                <StatusBadge status={user.status} />
              </div>
            </div>
            <div className="border-b border-line px-5 py-4 md:border-r md:border-b-0">
              <div className="ui-heading">Balance</div>
              <div className="mt-3 text-lg font-semibold text-ink-950">{user.quotaTotal - user.quotaUsed}</div>
            </div>
            <div className="px-5 py-4">
              <div className="ui-heading">Print jobs</div>
              <div className="mt-3 text-lg font-semibold text-ink-950">{user.jobCount}</div>
            </div>
          </div>

          <div className="grid gap-6 border-b border-line px-5 py-5 lg:grid-cols-[220px_minmax(0,1fr)]">
            <div>
              <div className="text-sm font-medium text-ink-950">Other details</div>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <label>
                <div className="ui-heading">Department</div>
                <input className="ui-input mt-2" defaultValue={user.department} />
              </label>
              <label>
                <div className="ui-heading">Office</div>
                <input className="ui-input mt-2" defaultValue={user.office} />
              </label>

              <div className="lg:col-span-2">
                <div className="ui-heading">Card/identity numbers</div>
                <div className="mt-2 grid gap-4 md:grid-cols-2">
                  <input className="ui-input font-mono" defaultValue={user.primaryIdentity} />
                  <input className="ui-input font-mono" defaultValue={user.secondaryIdentity} />
                </div>
              </div>

              <label className="lg:col-span-2">
                <div className="ui-heading">Card number (physically)</div>
                <input className="ui-input mt-2 font-mono" defaultValue={user.cardId} />
              </label>

              <label className="lg:col-span-2">
                <div className="ui-heading">Notes</div>
                <textarea className="ui-textarea mt-2" defaultValue={user.notes} />
              </label>

              <label className="lg:col-span-2">
                <div className="ui-heading">Group membership(s)</div>
                <select className="ui-select mt-2 w-full" defaultValue={user.groups[0]}>
                  {user.groups.map((group) => (
                    <option key={group}>{group}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 px-5 py-4">
            <button className="ui-button-ghost">Cancel</button>
            <button className="ui-button-secondary">OK</button>
            <button className="ui-button">Apply</button>
          </div>
        </section>
      </div>

      <ActionRail
        title="User actions"
        items={[
          { label: 'Modify user details', icon: Plus },
          { label: 'View user transaction history', icon: FileText },
          { label: 'View user print history', icon: UserRoundSearch },
          { label: 'Export user history', icon: RefreshCw },
          { label: 'Delete user', icon: Ban, tone: 'danger' },
        ]}
      />
    </div>
  )
}
