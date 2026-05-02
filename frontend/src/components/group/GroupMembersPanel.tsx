import { Search } from 'lucide-react'
import { useDeferredValue, useEffect, useState } from 'react'
import { listGroupUsers } from '@/features/admin/groups/api'
import type { AdminUser } from '@/types/admin'
import { DataTable } from '../ui/data-table'

interface GroupMembersPanelProps {
  groupId: string
  onUserClick: (user: AdminUser) => void
}

export function GroupMembersPanel({ groupId, onUserClick }: GroupMembersPanelProps) {
  const [search, setSearch] = useState('')
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const deferredSearch = useDeferredValue(search)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)

    listGroupUsers(groupId, {
      search: deferredSearch,
      limit: 100,
    })
      .then((nextUsers) => {
        if (!cancelled) {
          setUsers(nextUsers)
          setLoadError(null)
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setUsers([])
          setLoadError(error instanceof Error ? error.message : 'Unable to load group users.')
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [groupId, deferredSearch])

  return (
    <div className="mb-4 space-y-3">
      <div className="ui-panel-muted px-3 py-3">
        <label className="relative block max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            className="ui-input h-9 pl-9"
            placeholder="Search users by name"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
      </div>

      {loadError ? (
        <div className="border border-danger-500/30 bg-danger-100 px-4 py-3 text-sm text-danger-500">
          {loadError}
        </div>
      ) : null}

      <DataTable<AdminUser>
        columns={[
          {
            key: 'account',
            header: 'Account',
            render: (user) => <span className="ui-table-primary-mono">{user.username}</span>,
          },
          {
            key: 'full-name',
            header: 'Full name',
            render: (user) => <span className="ui-table-primary-strong">{user.displayName}</span>,
          },
          {
            key: 'email',
            header: 'Email',
            render: (user) => <span className="ui-table-secondary">{user.email}</span>,
          },
          {
            key: 'role',
            header: 'Role',
            render: (user) => <span className="ui-table-secondary">{user.role}</span>,
          },
          {
            key: 'status',
            header: 'Status',
            render: (user) => (
              <span className={user.status === 'Active' ? 'text-sm text-accent-700' : 'text-sm text-danger-500'}>
                {user.status}
              </span>
            ),
          },
          {
            key: 'jobs',
            header: 'Jobs',
            render: (user) => <span className="ui-table-secondary">{user.jobCount}</span>,
          },
        ]}
        rows={users}
        getRowKey={(user) => user.id}
        onRowClick={onUserClick}
        emptyLabel={isLoading ? 'Loading group users...' : 'No users match the current search.'}
      />
    </div>
  )
}
