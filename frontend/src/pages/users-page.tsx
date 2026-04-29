import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { Ban, Download, Plus, RefreshCw } from 'lucide-react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { DetailActionBar, DetailAlert, DetailPanel, DetailSection } from '../components/ui/admin-detail'
import { AdvancedFilterPanel } from '../components/ui/advanced-filter-panel'
import { DataTable } from '../components/ui/data-table'
import { FilterBar } from '../components/ui/filter-bar'
import { PageHeader } from '../components/ui/page-header'
import { getUserByIdOrUndefined, listUsers } from '../features/admin/users/api'
import type { AdminUser } from '../types/admin'

export function UsersPage() {
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  useEffect(() => { listUsers().then(setAdminUsers) }, [])
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
  }, [adminUsers, deferredSearch, scope, department, role, groupFilter])

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
          <button className="ui-button-action px-3 py-2">
            <Plus className="size-4" />
            Add user
          </button>
          <button className="ui-button-danger-soft px-3 py-2">
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
                  <span className="ui-table-secondary-mono">{user.username}</span>
                ),
              },
              {
                  key: 'full-name',
                header: 'Full name',
                render: (user) => <span className="ui-table-primary-strong">{user.displayName}</span>,
              
              },
              {
                key: 'balance',
                header: 'Balance',
                render: (user) => (
                  <span className="ui-table-primary-strong">{user.quotaTotal - user.quotaUsed}</span>
                ),
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
  const navigate = useNavigate()
  const { userId } = useParams()
  const [user, setUser] = useState<AdminUser | undefined>(undefined)
  const [loadingUser, setLoadingUser] = useState(true)
  useEffect(() => {
    getUserByIdOrUndefined(userId).then(setUser).finally(() => setLoadingUser(false))
  }, [userId])

  if (loadingUser) return null
  if (!user) {
    return <Navigate to="/admin/users" replace />
  }

  return (
    <div className="min-w-0">
      <PageHeader
        eyebrow="Users"
        title={user.displayName}
        description={`${user.username} · ${user.role}`}
        meta={
          <button className="ui-button-secondary" onClick={() => navigate('/admin/users')}>
            Back to users
          </button>
        }
      />

      <DetailPanel>
        <DetailSection title="Identity">
          <label>
            <div className="ui-detail-label">Username</div>
            <input className="ui-input mt-2 font-mono" defaultValue={user.username} />
          </label>
          <label>
            <div className="ui-detail-label">Full name</div>
            <input className="ui-input mt-2" defaultValue={user.displayName} />
          </label>
          <label>
            <div className="ui-detail-label">Role</div>
            <select className="ui-select mt-2 w-full" defaultValue={user.role}>
              <option>Administrator</option>
              <option>Technician</option>
              <option>Faculty</option>
              <option>Student</option>
            </select>
          </label>
          <label>
            <div className="ui-detail-label">Status</div>
            <select className="ui-select mt-2 w-full" defaultValue={user.status}>
              <option>Active</option>
              <option>Suspended</option>
            </select>
          </label>
        </DetailSection>

        <DetailSection title="Contact and directory">
          <label>
            <div className="ui-detail-label">Email</div>
            <input className="ui-input mt-2" defaultValue={user.email} />
          </label>
          <label>
            <div className="ui-detail-label">Department</div>
            <input className="ui-input mt-2" defaultValue={user.department} />
          </label>
          <label>
            <div className="ui-detail-label">Office</div>
            <input className="ui-input mt-2" defaultValue={user.office} />
          </label>
          <label>
            <div className="ui-detail-label">Last seen</div>
            <input className="ui-input mt-2" defaultValue={user.lastSeen} />
          </label>
        </DetailSection>

        {user.status === 'Suspended' ? (
          <div className="px-5 pt-5">
            <DetailAlert
              title="User restricted"
              description="This account is suspended and cannot submit or release jobs until it is reactivated."
            />
          </div>
        ) : null}

        <DetailSection title="Access and restrictions">
          <label>
            <div className="ui-detail-label">Balance</div>
            <input className="ui-input mt-2" defaultValue={user.quotaTotal - user.quotaUsed} />
          </label>
          <label>
            <div className="ui-detail-label">Print jobs</div>
            <input className="ui-input mt-2" defaultValue={user.jobCount} />
          </label>
          <label className="ui-checkbox-line xl:col-span-2">
            <input type="checkbox" defaultChecked={user.status === 'Suspended'} />
            <span>Restricted</span>
          </label>
          <label className="xl:col-span-2">
            <div className="ui-detail-label">Primary identity</div>
            <input className="ui-input mt-2 font-mono" defaultValue={user.primaryIdentity} />
          </label>
          <label className="xl:col-span-2">
            <div className="ui-detail-label">Secondary identity</div>
            <input className="ui-input mt-2 font-mono" defaultValue={user.secondaryIdentity} />
          </label>
          <label className="xl:col-span-2">
            <div className="ui-detail-label">Card number</div>
            <input className="ui-input mt-2 font-mono" defaultValue={user.cardId} />
          </label>
        </DetailSection>

        <DetailSection title="Groups and notes" columns="single">
          <label>
            <div className="ui-detail-label">Groups</div>
            <textarea className="ui-textarea mt-2 min-h-20 font-mono" defaultValue={user.groups.join('\n')} />
          </label>
          <label>
            <div className="ui-detail-label">Notes</div>
            <textarea className="ui-textarea mt-2" defaultValue={user.notes} />
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
