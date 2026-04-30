import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { Ban, Download, Plus, RefreshCw } from 'lucide-react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { DetailActionBar, DetailAlert, DetailPanel, DetailSection } from '../components/ui/admin-detail'
import { AdvancedFilterPanel } from '../components/ui/advanced-filter-panel'
import { DataTable } from '../components/ui/data-table'
import { FilterBar } from '../components/ui/filter-bar'
import { PageHeader } from '../components/ui/page-header'
import { Dialog, DialogContent, DialogTitle } from '../components/ui/dialog'
import { Input } from '../components/ui/input'
import { getUserByIdOrUndefined, listUsers, setUserStatus, createUser, deleteUser, listDepartments } from '../features/admin/users/api'
import type { CreateUserPayload } from '../features/admin/users/api'
import type { AdminUser } from '../types/admin'

export function UsersPage() {
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([])
  useEffect(() => {
    listUsers().then(setAdminUsers)
    listDepartments().then(setDepartments)
  }, [])
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [scope, setScope] = useState<'All' | 'Active' | 'Suspended'>('All')
  const [department, setDepartment] = useState('All departments')
  const [role, setRole] = useState('All roles')
  const [groupFilter, setGroupFilter] = useState('All groups')
  const deferredSearch = useDeferredValue(search)

  // Selection state
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())

  // Bulk delete dialog state
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [bulkDeleteError, setBulkDeleteError] = useState<string | null>(null)

  async function handleBulkDelete() {
    setBulkDeleteError(null)
    setBulkDeleting(true)
    try {
      await Promise.all([...selectedKeys].map(id => deleteUser(id)))
      setSelectedKeys(new Set())
      setBulkDeleteOpen(false)
      listUsers().then(setAdminUsers)
    } catch (err) {
      setBulkDeleteError(err instanceof Error ? err.message : 'Failed to delete users')
    } finally {
      setBulkDeleting(false)
    }
  }

  // Add user dialog state
  const [addOpen, setAddOpen] = useState(false)
  const [addForm, setAddForm] = useState<CreateUserPayload>({
    id: '', username: '', email: '', displayName: '', password: '',
    role: 'standard_user', departmentId: undefined, allocatedPages: 1000,
  })
  const [addError, setAddError] = useState<string | null>(null)
  const [addSaving, setAddSaving] = useState(false)

  function handleAddChange(field: keyof CreateUserPayload, value: string | number | undefined) {
    setAddForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleAddSubmit(e: React.FormEvent) {
    e.preventDefault()
    setAddError(null)
    setAddSaving(true)
    try {
      const payload: CreateUserPayload = {
        ...addForm,
        allocatedPages: addForm.allocatedPages ? Number(addForm.allocatedPages) : undefined,
        departmentId: addForm.departmentId || undefined,
      }
      await createUser(payload)
      setAddOpen(false)
      setAddForm({ id: '', username: '', email: '', displayName: '', password: '', role: 'standard_user', departmentId: undefined, allocatedPages: 1000 })
      listUsers().then(setAdminUsers)
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Failed to create user')
    } finally {
      setAddSaving(false)
    }
  }

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
          <button className="ui-button-action px-3 py-2" onClick={() => setAddOpen(true)}>
            <Plus className="size-4" />
            Add user
          </button>
          <button
            className="ui-button-danger-soft px-3 py-2"
            disabled={selectedKeys.size === 0}
            onClick={() => setBulkDeleteOpen(true)}
          >
            <Ban className="size-4" />
            Delete{selectedKeys.size > 0 ? ` (${selectedKeys.size})` : ''}
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
            selectedKeys={selectedKeys}
            onSelectionChange={setSelectedKeys}
            emptyLabel="No users match the current search."
        />
      </div>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <DialogContent className="w-[min(92vw,420px)]">
          <div className="border-b border-line px-6 py-4">
            <DialogTitle className="text-base font-semibold text-ink-950">Delete users</DialogTitle>
          </div>
          <div className="px-6 py-5 space-y-4">
            <p className="text-sm text-ink-700">
              Are you sure you want to delete <strong>{selectedKeys.size} user{selectedKeys.size !== 1 ? 's' : ''}</strong>? This action cannot be undone.
            </p>
            {bulkDeleteError && <p className="text-sm text-red-600">{bulkDeleteError}</p>}
            <div className="flex justify-end gap-2 border-t border-line pt-4">
              <button className="ui-button-secondary px-4 py-2" onClick={() => setBulkDeleteOpen(false)}>Cancel</button>
              <button className="ui-button-danger-soft px-4 py-2" onClick={handleBulkDelete} disabled={bulkDeleting}>
                {bulkDeleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <div className="border-b border-line px-6 py-4">
            <DialogTitle className="text-base font-semibold text-ink-950">Add user</DialogTitle>
          </div>
          <form onSubmit={handleAddSubmit} className="space-y-4 px-6 py-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1 col-span-2">
                <label className="text-xs font-medium text-ink-700">User ID</label>
                <Input
                  required
                  placeholder="e.g. s202270440"
                  value={addForm.id}
                  onChange={e => handleAddChange('id', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-ink-700">Display name</label>
                <Input
                  required
                  placeholder="John Smith"
                  value={addForm.displayName}
                  onChange={e => handleAddChange('displayName', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-ink-700">Username</label>
                <Input
                  required
                  placeholder="john.smith"
                  value={addForm.username}
                  onChange={e => handleAddChange('username', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-ink-700">Email</label>
                <Input
                  required
                  type="email"
                  placeholder="john.smith@ccm.edu.sa"
                  value={addForm.email}
                  onChange={e => handleAddChange('email', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-ink-700">Password</label>
                <Input
                  required
                  type="password"
                  placeholder="Min. 6 characters"
                  value={addForm.password}
                  onChange={e => handleAddChange('password', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-ink-700">Role</label>
                <select
                  className="h-10 w-full border border-line bg-white px-3 text-sm text-ink-950 outline-none focus:border-accent-500"
                  value={addForm.role}
                  onChange={e => handleAddChange('role', e.target.value as CreateUserPayload['role'])}
                >
                  <option value="standard_user">Student</option>
                  <option value="technician">Technician</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-ink-700">Department</label>
                <select
                  className="h-10 w-full border border-line bg-white px-3 text-sm text-ink-950 outline-none focus:border-accent-500"
                  value={addForm.departmentId ?? ''}
                  onChange={e => handleAddChange('departmentId', e.target.value || undefined)}
                >
                  <option value="">No department</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-ink-700">Allocated pages</label>
                <Input
                  type="number"
                  min={1}
                  placeholder="1000"
                  value={addForm.allocatedPages ?? ''}
                  onChange={e => handleAddChange('allocatedPages', e.target.value ? Number(e.target.value) : undefined)}
                />
              </div>
            </div>

            {addError && (
              <p className="text-sm text-red-600">{addError}</p>
            )}

            <div className="flex justify-end gap-2 border-t border-line pt-4">
              <button type="button" className="ui-button-secondary px-4 py-2" onClick={() => setAddOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="ui-button-action px-4 py-2" disabled={addSaving}>
                {addSaving ? 'Creating…' : 'Create user'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function UserDetailPage() {
  const navigate = useNavigate()
  const { userId } = useParams()
  const [user, setUser] = useState<AdminUser | undefined>(undefined)
  const [loadingUser, setLoadingUser] = useState(true)
  const [status, setStatus] = useState<'Active' | 'Suspended'>('Active')
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  useEffect(() => {
    getUserByIdOrUndefined(userId).then(setUser).finally(() => setLoadingUser(false))
  }, [userId])

  useEffect(() => {
    if (user) setStatus(user.status)
  }, [user])

  if (loadingUser) return null
  if (!user) {
    return <Navigate to="/admin/users" replace />
  }

  async function handleApply() {
    setSaveError(null)
    setSaving(true)
    try {
      await setUserStatus(user!.id, status)
      navigate('/admin/users')
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save user changes')
    } finally {
      setSaving(false)
    }
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
        {saveError ? (
          <div className="px-5 pt-5">
            <DetailAlert title="Update failed" description={saveError} />
          </div>
        ) : null}

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
            <select className="ui-select mt-2 w-full" value={status} onChange={(e) => setStatus(e.target.value as 'Active' | 'Suspended')}>
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

        {status === 'Suspended' ? (
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
            <input type="checkbox" checked={status === 'Suspended'} readOnly />
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
          <button className="ui-button-ghost" onClick={() => navigate('/admin/users')}>Cancel</button>
          <button className="ui-button" onClick={handleApply} disabled={saving}>Apply</button>
        </DetailActionBar>
      </DetailPanel>
    </div>
  )
}
