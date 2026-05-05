import { DataTable } from '@/components/ui/data-table'
import type { AdminUser } from '@/types/admin'

interface UsersTableProps {
  rows: AdminUser[]
  onRowClick: (user: AdminUser) => void
}

export function UsersTable({ rows, onRowClick }: UsersTableProps) {
  return (
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
          key: 'balance',
          header: 'Balance',
          render: (user) => <span className="ui-table-primary-strong">{user.quotaTotal - user.quotaUsed}</span>,
        },
        {
          key: 'restricted',
          header: 'Restricted',
          render: (user) => <span className="ui-table-secondary">{user.status === 'Suspended' ? 'Yes' : 'No'}</span>,
        },
        {
          key: 'jobs',
          header: 'Jobs',
          render: (user) => <span className="ui-table-secondary">{user.jobCount}</span>,
        },
      ]}
      rows={rows}
      getRowKey={(user) => user.id}
      onRowClick={onRowClick}
      emptyLabel="No users match the current search."
    />
  )
}
