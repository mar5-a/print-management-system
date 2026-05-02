import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { Ban, Download, Plus, RefreshCw, RotateCcw } from 'lucide-react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { DetailActionBar, DetailAlert, DetailPanel, DetailSection } from '../components/ui/admin-detail'
import { DataTable } from '../components/ui/data-table'
import { FilterBar } from '../components/ui/filter-bar'
import { PageHeader } from '../components/ui/page-header'
import { getUserByIdOrUndefined, listUsers } from '../features/admin/users/api'
import type { AdminUser } from '../types/admin'

export function UsersPage() {
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [scope, setScope] = useState<'All' | 'Active' | 'Suspended'>('All')
  const [department, setDepartment] = useState('All departments')
  const [role, setRole] = useState('All roles')
  const [groupFilter, setGroupFilter] = useState('All groups')
  const deferredSearch = useDeferredValue(search)

  useEffect(() => {
    let cancelled = false

    listUsers()
      .then((users) => {
        if (!cancelled) {
          setAdminUsers(users)
          setLoadError(null)
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : 'Unable to load users.')
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

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

  function resetUserFilters() {
    setSearch('')
    setScope('All')
    setDepartment('All departments')
    setRole('All roles')
    setGroupFilter('All groups')
  }

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

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by account or name"
        actions={
          <>
            <button className="ui-button-action h-9 px-3 py-0">
              <Plus className="size-4" />
              Add user
            </button>
            <button className="ui-button-danger-soft h-9 px-3 py-0">
              <Ban className="size-4" />
              Delete
            </button>
            <button className="ui-button-secondary h-9 px-3 py-0">
              <Download className="size-4" />
              Export users
            </button>
          </>
        }
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
            <label className="min-w-[11rem] flex-1 sm:flex-none">
              <span className="sr-only">Department</span>
              <select className="ui-select h-9 w-full min-w-[11rem]" aria-label="Department" value={department} onChange={(event) => setDepartment(event.target.value)}>
                <option>All departments</option>
                <option>Computer Science</option>
                <option>Data Science</option>
                <option>Information Systems</option>
                <option>Mathematics</option>
                <option>Operations</option>
              </select>
            </label>
            <label className="min-w-[9rem] flex-1 sm:flex-none">
              <span className="sr-only">Role</span>
              <select className="ui-select h-9 w-full min-w-[9rem]" aria-label="Role" value={role} onChange={(event) => setRole(event.target.value)}>
                <option>All roles</option>
                <option>Administrator</option>
                <option>Technician</option>
                <option>Faculty</option>
                <option>Student</option>
              </select>
            </label>
            <label className="min-w-[9rem] flex-1 sm:flex-none">
              <span className="sr-only">Group</span>
              <select className="ui-select h-9 w-full min-w-[9rem]" aria-label="Group" value={groupFilter} onChange={(event) => setGroupFilter(event.target.value)}>
                <option>All groups</option>
                <option>CCM-Students</option>
                <option>Faculty</option>
                <option>Technicians</option>
                <option>Administrators</option>
                <option>AI Lab</option>
              </select>
            </label>
            <button type="button" className="ui-button-secondary h-9 px-3 py-0" onClick={resetUserFilters}>
              <RotateCcw className="size-3.5" />
              Reset
            </button>
          </>
        }
      />

      {loadError ? (
        <div className="mt-4 border border-danger-500/30 bg-danger-100 px-4 py-3 text-sm text-danger-500">
          {loadError}
        </div>
      ) : null}

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
  const [user, setUser] = useState<AdminUser | undefined>()
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false

    getUserByIdOrUndefined(userId)
      .then((nextUser) => {
        if (!cancelled) {
          setUser(nextUser)
          setLoaded(true)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUser(undefined)
          setLoaded(true)
        }
      })

    return () => {
      cancelled = true
    }
  }, [userId])

  if (!loaded) {
    return <div className="ui-panel px-4 py-6 text-sm text-slate-500">Loading user...</div>
  }

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
        {user.status === 'Suspended' ? (
          <DetailAlert
            className="mb-0"
            title="User restricted"
            description="This account is suspended and cannot submit or release jobs until it is reactivated."
          />
        ) : null}

        <DetailSection title="Access and quota">
          <label>
            <div className="ui-detail-label">Status</div>
            <select className="ui-select mt-2 w-full" defaultValue={user.status}>
              <option>Active</option>
              <option>Suspended</option>
            </select>
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

        <DetailSection title="Profile">
          <label>
            <div className="ui-detail-label">Username</div>
            <input className="ui-input mt-2 font-mono" defaultValue={user.username} />
          </label>
          <label>
            <div className="ui-detail-label">Full name</div>
            <input className="ui-input mt-2" defaultValue={user.displayName} />
          </label>
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

        <DetailActionBar>
          <button className="ui-button-ghost">Cancel</button>
          <button className="ui-button">Apply</button>
        </DetailActionBar>
      </DetailPanel>
    </div>
  )
}
