import type { AdminGroup } from '@/types/admin'
import { DataTable } from '../ui/data-table'

interface GroupsTableProps {
  rows: AdminGroup[]
  onRowClick: (group: AdminGroup) => void
}

export function GroupsTable({ rows, onRowClick }: GroupsTableProps) {
  return (
    <DataTable<AdminGroup>
      columns={[
        {
          key: 'name',
          header: 'Group',
          render: (group) => <span className="ui-table-primary-strong">{group.name}</span>,
        },
        {
          key: 'initial-credit',
          header: 'Initial credit',
          render: (group) => <span className="ui-table-secondary">{group.quotaPerPeriod}</span>,
        },
        {
          key: 'initial-restriction',
          header: 'Initial restriction',
          render: (group) => <span className="ui-table-secondary">{group.studentRestricted ? 'Yes' : 'No'}</span>,
        },
        {
          key: 'user-count',
          header: 'User count',
          render: (group) => <span className="ui-table-secondary">{group.userCount}</span>,
        },
        {
          key: 'schedule',
          header: 'Schedule period',
          render: (group) => <span className="ui-table-secondary">{group.schedule}</span>,
        },
      ]}
      rows={rows}
      getRowKey={(group) => group.id}
      onRowClick={onRowClick}
      emptyLabel="No groups match the current search."
    />
  )
}
