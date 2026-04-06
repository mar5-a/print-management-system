import { useDeferredValue, useMemo, useState } from 'react'
import { Plus, Repeat, Shield } from 'lucide-react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { ActionRail } from '../components/ui/action-rail'
import { DataTable } from '../components/ui/data-table'
import { FilterBar } from '../components/ui/filter-bar'
import { PageHeader } from '../components/ui/page-header'
import { adminGroups, getGroupById } from '../data/admin-data'
import type { AdminGroup } from '../types/admin'

export function GroupsPage() {
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
  }, [deferredSearch])

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
      <div className="min-w-0">
        <PageHeader
          eyebrow="Groups"
          title="Quota and access groups"
          meta={
            <button className="ui-button">
              <Plus className="size-4" />
              New group
            </button>
          }
        />

        <FilterBar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search groups"
        />

        <div className="mt-4">
          <DataTable<AdminGroup>
            columns={[
              {
                key: 'name',
                header: 'Group',
                render: (group) => <span className="font-semibold text-ink-950">{group.name}</span>,
              },
              {
                key: 'initial-credit',
                header: 'Initial credit',
                render: (group) => <span className="text-sm text-slate-600">{group.quotaPerPeriod}</span>,
              },
              {
                key: 'initial-restriction',
                header: 'Initial restriction',
                render: (group) => <span className="text-sm text-slate-600">{group.studentRestricted ? 'Yes' : 'No'}</span>,
              },
              {
                key: 'user-count',
                header: 'User count',
                render: (group) => <span className="text-sm text-slate-600">{group.userCount}</span>,
              },
              {
                key: 'schedule',
                header: 'Schedule period',
                render: (group) => <span className="text-sm text-slate-600">{group.schedule}</span>,
              },
            ]}
            rows={filteredGroups}
            getRowKey={(group) => group.id}
            onRowClick={(group) => navigate(`/admin/groups/${group.id}`)}
            emptyLabel="No groups match the current search."
          />
        </div>
      </div>

      <ActionRail
        title="Group controls"
        items={[
          { label: 'Adjust quota baselines', icon: Plus },
          { label: 'Change reset schedule', icon: Repeat },
          { label: 'Review queue scope', icon: Shield },
        ]}
      />
    </div>
  )
}

export function GroupDetailPage() {
  const { groupId } = useParams()
  const group = getGroupById(groupId)

  if (!group) {
    return <Navigate to="/admin/groups" replace />
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
      <div className="min-w-0">
        <PageHeader
          eyebrow="Groups"
          title={`Group details: ${group.name}`}
        />

        <section className="ui-panel overflow-hidden">
          <div className="grid gap-6 border-b border-line px-5 py-5 lg:grid-cols-[220px_minmax(0,1fr)]">
            <div>
              <div className="text-sm font-medium text-ink-950">Details</div>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <label>
                <div className="ui-heading">Group name</div>
                <input className="ui-input mt-2" defaultValue={group.name} />
              </label>
              <label>
                <div className="ui-heading">User count</div>
                <input className="ui-input mt-2" defaultValue={group.userCount} />
              </label>
            </div>
          </div>

          <div className="grid gap-6 border-b border-line px-5 py-5 lg:grid-cols-[220px_minmax(0,1fr)]">
            <div>
              <div className="text-sm font-medium text-ink-950">Quota scheduling</div>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <label>
                <div className="ui-heading">Period</div>
                <select className="ui-select mt-2 w-full" defaultValue={group.schedule}>
                  <option>Weekly</option>
                  <option>Monthly</option>
                  <option>Semester</option>
                </select>
              </label>
              <label>
                <div className="ui-heading">Initial balance</div>
                <input className="ui-input mt-2" defaultValue={group.quotaPerPeriod} />
              </label>
              <label className="flex items-center gap-3 lg:col-span-2">
                <input type="checkbox" defaultChecked={group.studentRestricted} />
                <span className="text-sm text-ink-950">Only allow this group to use restricted queue access</span>
              </label>
            </div>
          </div>

          <div className="grid gap-6 border-b border-line px-5 py-5 lg:grid-cols-[220px_minmax(0,1fr)]">
            <div>
              <div className="text-sm font-medium text-ink-950">New user setting</div>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <label className="flex items-center gap-3 lg:col-span-2">
                <input type="checkbox" defaultChecked={group.defaultForNewUsers} />
                <span className="text-sm text-ink-950">Use this group as the default assignment for new users</span>
              </label>
              <label>
                <div className="ui-heading">New user quota</div>
                <input className="ui-input mt-2" defaultValue={group.newUserQuota} />
              </label>
              <label>
                <div className="ui-heading">Owner</div>
                <input className="ui-input mt-2" defaultValue={group.owner} />
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
        title="Group actions"
        items={[
          { label: 'Select related users', icon: Shield },
          { label: 'Adjust member balances', icon: Plus },
          { label: 'Change member restrictions', icon: Repeat },
        ]}
      />
    </div>
  )
}
