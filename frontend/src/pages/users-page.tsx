import { useDeferredValue, useMemo, useState } from 'react'
import { Ban, Download, FileText, Plus, RefreshCw, UserRoundSearch } from 'lucide-react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { ActionRail } from '../components/ui/action-rail'
import { AdvancedFilterPanel } from '../components/ui/advanced-filter-panel'
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
  const [department, setDepartment] = useState('All departments')
  const [role, setRole] = useState('All roles')
  const [groupFilter, setGroupFilter] = useState('All groups')
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
      const matchesDepartment = department === 'All departments' ? true : user.department === department
      const matchesRole = role === 'All roles' ? true : user.role === role
      const matchesGroup = groupFilter === 'All groups' ? true : user.groups.includes(groupFilter)
      return matchesSearch && matchesScope && matchesDepartment && matchesRole && matchesGroup
    })
  }, [deferredSearch, scope, department, role, groupFilter])

  return (
    <div className="min-w-0">
      <PageHeader
        eyebrow="Users"
        title="Identity and access control"
        meta={
          <button className="ui-button-secondary">
            <RefreshCw className="size-4" />
            Sync AD
          </button>
        }
      />

      <AdvancedFilterPanel
        fields={[
          {
            id: 'status',
            label: 'Status',
            value: scope,
            options: ['All', 'Active', 'Suspended'],
            onChange: (value) => setScope(value as 'All' | 'Active' | 'Suspended'),
          },
          {
            id: 'department',
            label: 'Department',
            value: department,
            options: ['All departments', 'Computer Science', 'Data Science', 'Information Systems', 'Mathematics', 'Operations'],
            onChange: setDepartment,
          },
          {
            id: 'role',
            label: 'Role',
            value: role,
            options: ['All roles', 'Administrator', 'Technician', 'Faculty', 'Student'],
            onChange: setRole,
          },
          {
            id: 'group',
            label: 'Group',
            value: groupFilter,
            options: ['All groups', 'CCM-Students', 'Faculty', 'Technicians', 'Administrators', 'AI Lab'],
            onChange: setGroupFilter,
          },
        ]}
      />

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by account or name"
      >
        <div className="flex w-full flex-wrap items-center justify-end gap-2 xl:flex-nowrap">
          <button className="ui-button px-3 py-2">
            <Plus className="size-4" />
            Add user
          </button>
          <button className="inline-flex items-center justify-center gap-2 rounded-none border border-danger-500 bg-danger-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-danger-500/90">
            <Ban className="size-4" />
            Delete
          </button>
          <button className="ui-button-secondary px-3 py-2">
            <Download className="size-4" />
            Export users
          </button>
          {(['All', 'Active', 'Suspended'] as const).map((value) => (
            <button
              key={value}
              className={scope === value ? 'ui-button-secondary border-accent-500 text-accent-700' : 'ui-button-ghost'}
              onClick={() => setScope(value)}
            >
              {value}
            </button>
          ))}
        </div>
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
  )
}

export function UserDetailPage() {
  const { userId } = useParams()
  const user = getUserById(userId)

  if (!user) {
    return <Navigate to="/admin/users" replace />
  }

  return (
    <div className="min-w-0">
      <PageHeader
        eyebrow="Users"
        title="User details"
        description={`${user.displayName} · ${user.username}`}
      />

      <ActionRail
        title="User actions"
        items={[
          { label: 'Modify user details', icon: Plus },
          { label: 'View transaction history', icon: FileText },
          { label: 'View print history', icon: UserRoundSearch },
          { label: 'Delete user', icon: Ban, tone: 'danger' },
        ]}
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
  )
}
