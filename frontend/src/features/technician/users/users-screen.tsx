import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DataTable } from '@/components/ui/data-table'
import { FilterBar } from '@/components/ui/filter-bar'
import { PageHeader } from '@/components/ui/page-header'
import { listTechUsers } from './api'
import type { AdminUser } from '@/types/admin'

export function TechUsersScreen() {
  const [users, setUsers] = useState<AdminUser[]>([])
  useEffect(() => { listTechUsers().then(setUsers) }, [])
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [scope, setScope] = useState<'All' | 'Active' | 'Suspended'>('All')
  const deferredSearch = useDeferredValue(search)

  const filteredUsers = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase()
    return users.filter((user) => {
      const matchesSearch =
        !query ||
        [user.displayName, user.username, user.department, user.role].some((v) =>
          v.toLowerCase().includes(query),
        )
      const matchesScope = scope === 'All' ? true : user.status === scope
      return matchesSearch && matchesScope
    })
  }, [users, deferredSearch, scope])

  return (
    <div className="min-w-0">
      <PageHeader eyebrow="Users" title="User accounts" />

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name or account"
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
              key: 'full-name',
              header: 'Full name',
              render: (user) => <span className="ui-table-primary-strong">{user.displayName}</span>,
            },
            {
              key: 'account',
              header: 'Account',
              render: (user) => <span className="ui-table-secondary-mono">{user.username}</span>,
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
              header: 'Status',
              render: (user) => (
                <span
                  className={
                    user.status === 'Active'
                      ? 'text-sm text-accent-700'
                      : 'text-sm text-danger-500'
                  }
                >
                  {user.status}
                </span>
              ),
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
