import { useDeferredValue, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RotateCcw } from 'lucide-react'
import { DataTable } from '@/components/ui/data-table'
import { FilterBar } from '@/components/ui/filter-bar'
import { PageHeader } from '@/components/ui/page-header'
import { listTechUsers } from './api'
import type { AdminUser } from '@/types/admin'

export function TechUsersScreen() {
  const users = listTechUsers()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [scope, setScope] = useState<'All' | 'Active' | 'Suspended'>('All')
  const [role, setRole] = useState<'All roles' | 'Technician' | 'Student' | 'Faculty'>('All roles')
  const deferredSearch = useDeferredValue(search)

  const filteredUsers = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase()
    return users.filter((user) => {
      const matchesSearch =
        !query ||
        [user.displayName, user.username, user.role].some((v) =>
          v.toLowerCase().includes(query),
        )
      const matchesScope = scope === 'All' ? true : user.status === scope
      const matchesRole = role === 'All roles' ? true : user.role === role
      return matchesSearch && matchesScope && matchesRole
    })
  }, [users, deferredSearch, scope, role])

  function resetFilters() {
    setSearch('')
    setScope('All')
    setRole('All roles')
  }

  return (
    <div className="min-w-0">
      <PageHeader eyebrow="Users" title="User restrictions and quotas" />

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name or account"
        filters={
          <>
            <label className="min-w-[8.5rem] flex-1 sm:flex-none">
              <span className="sr-only">Status</span>
              <select
                className="ui-select h-9 w-full min-w-[8.5rem]"
                aria-label="Status"
                value={scope}
                onChange={(event) => setScope(event.target.value as 'All' | 'Active' | 'Suspended')}
              >
                <option>All</option>
                <option>Active</option>
                <option>Suspended</option>
              </select>
            </label>
            <label className="min-w-[9rem] flex-1 sm:flex-none">
              <span className="sr-only">Role</span>
              <select
                className="ui-select h-9 w-full min-w-[9rem]"
                aria-label="Role"
                value={role}
                onChange={(event) => setRole(event.target.value as 'All roles' | 'Technician' | 'Student' | 'Faculty')}
              >
                <option>All roles</option>
                <option>Technician</option>
                <option>Faculty</option>
                <option>Student</option>
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
        <DataTable<AdminUser>
          columns={[
            {
              key: 'account',
              header: 'Account',
              render: (user) => <span className="ui-table-secondary-mono">{user.username}</span>,
            },
            {
              key: 'full-name',
              header: 'Full name',
              render: (user) => <span className="ui-table-primary-strong">{user.displayName}</span>,
            },
            {
              key: 'role',
              header: 'Role',
              render: (user) => <span className="ui-table-secondary">{user.role}</span>,
            },
            {
              key: 'balance',
              header: 'Balance',
              render: (user) => (
                <span className="ui-table-primary-strong">{user.quotaTotal - user.quotaUsed}</span>
              ),
            },
            {
              key: 'status',
              header: 'Restricted',
              render: (user) => (
                <span
                  className={
                    user.status === 'Active'
                      ? 'text-sm text-accent-700'
                      : 'text-sm text-danger-500'
                  }
                >
                  {user.status === 'Suspended' ? 'Yes' : 'No'}
                </span>
              ),
            },
            {
              key: 'jobs',
              header: 'Jobs',
              render: (user) => <span className="ui-table-secondary">{user.jobCount}</span>,
            },
          ]}
          rows={filteredUsers}
          getRowKey={(user) => user.id}
          onRowClick={(user) => navigate(`/tech/users/${user.id}`)}
          emptyLabel="No users match the current search."
        />
      </div>
    </div>
  )
}
