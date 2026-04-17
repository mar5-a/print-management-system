import { useDeferredValue, useMemo, useState } from 'react'
import { Download, Plus, Trash2 } from 'lucide-react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { DetailActionBar, DetailPanel, DetailSection } from '../components/ui/admin-detail'
import { DataTable } from '../components/ui/data-table'
import { FilterBar } from '../components/ui/filter-bar'
import { PageHeader } from '../components/ui/page-header'
import { getGroupByIdOrUndefined, listGroups } from '../features/admin/groups/api'
import type { AdminGroup } from '../types/admin'

export function GroupsPage() {
  const adminGroups = listGroups()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)

  const filteredGroups = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase()
    return adminGroups.filter((group) =>
      [group.name, group.description, group.owner].some((value) =>
        value.toLowerCase().includes(query),
      ),
    )
  }, [adminGroups, deferredSearch])

  return (
    <div className="min-w-0">
      <PageHeader eyebrow="Groups" title="Quota and access groups" />

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search groups"
      >
        <button className="ui-button-action px-3 py-2">
          <Plus className="size-4" />
          New group
        </button>
        <button className="ui-button-danger-soft px-3 py-2">
          <Trash2 className="size-4" />
          Delete
        </button>
        <button className="ui-button-secondary px-3 py-2">
          <Download className="size-4" />
          Export groups
        </button>
      </FilterBar>

      <div className="mt-4">
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
            rows={filteredGroups}
            getRowKey={(group) => group.id}
            onRowClick={(group) => navigate(`/admin/groups/${group.id}`)}
            emptyLabel="No groups match the current search."
        />
      </div>
    </div>
  )
}

export function GroupDetailPage() {
  const navigate = useNavigate()
  const { groupId } = useParams()
  const group = getGroupByIdOrUndefined(groupId)

  if (!group) {
    return <Navigate to="/admin/groups" replace />
  }

  return (
    <div className="min-w-0">
      <PageHeader
        eyebrow="Groups"
        title={group.name}
        description={`${group.userCount} users · ${group.owner}`}
        meta={
          <button className="ui-button-secondary" onClick={() => navigate('/admin/groups')}>
            Back to groups
          </button>
        }
      />

      <DetailPanel>
        <DetailSection title="Identity">
          <label>
            <div className="ui-detail-label">Group name</div>
            <input className="ui-input mt-2" defaultValue={group.name} />
          </label>
          <label>
            <div className="ui-detail-label">Owner</div>
            <input className="ui-input mt-2" defaultValue={group.owner} />
          </label>
          <label>
            <div className="ui-detail-label">User count</div>
            <input className="ui-input mt-2" defaultValue={group.userCount} />
          </label>
          <div />
          <label className="xl:col-span-2">
            <div className="ui-detail-label">Description</div>
            <textarea className="ui-textarea mt-2 min-h-20" defaultValue={group.description} />
          </label>
        </DetailSection>

        <DetailSection title="Quota policy">
          <label>
            <div className="ui-detail-label">Period</div>
            <select className="ui-select mt-2 w-full" defaultValue={group.schedule}>
              <option>Weekly</option>
              <option>Monthly</option>
              <option>Semester</option>
            </select>
          </label>
          <label>
            <div className="ui-detail-label">Initial balance</div>
            <input className="ui-input mt-2" defaultValue={group.quotaPerPeriod} />
          </label>
          <label className="ui-checkbox-line xl:col-span-2">
            <input type="checkbox" defaultChecked={group.studentRestricted} />
            <span>Only allow this group to use restricted queue access</span>
          </label>
        </DetailSection>

        <DetailSection title="New user defaults">
          <label className="ui-checkbox-line xl:col-span-2">
            <input type="checkbox" defaultChecked={group.defaultForNewUsers} />
            <span>Use this group as the default assignment for new users</span>
          </label>
          <label>
            <div className="ui-detail-label">New user quota</div>
            <input className="ui-input mt-2" defaultValue={group.newUserQuota} />
          </label>
        </DetailSection>

        <DetailActionBar>
          <button className="ui-button-ghost">Cancel</button>
          <button className="ui-button">Apply</button>
        </DetailActionBar>
      </DetailPanel>
    </div>
  )
}
