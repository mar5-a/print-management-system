import { useCallback, useDeferredValue, useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { AddUserDialog } from '../components/user/AddUserDialog'
import { DeleteUserDialog } from '../components/user/DeleteUserDialog'
import { UserAccessQuotaPanel } from '../components/user/UserAccessQuotaPanel'
import { UserDetailActions } from '../components/user/UserDetailActions'
import { UserDetailHeader } from '../components/user/UserDetailHeader'
import { UserFilters } from '../components/user/UserFilters'
import { UserProfilePanel } from '../components/user/UserProfilePanel'
import { UsersHeader } from '../components/user/UsersHeader'
import { UsersTable } from '../components/user/UsersTable'
import {
  buildUserDetailForm,
  fallbackUserGroups,
  isSameUserDetailForm,
  type UserDetailForm,
  type UserScopeFilter,
} from '../components/user/user-detail-form'
import {
  createUser,
  deleteUser,
  getUserByIdOrUndefined,
  listUserGroups,
  listUsers,
  updateUser,
  type CreateUserInput,
} from '../features/admin/users/api'
import type { AdminUser } from '../types/admin'

export function UsersPage() {
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [groupOptions, setGroupOptions] = useState<string[]>(fallbackUserGroups)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [isCreatingUser, setIsCreatingUser] = useState(false)
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [scope, setScope] = useState<UserScopeFilter>('All')
  const [role, setRole] = useState<AdminUser['role'] | 'All roles'>('All roles')
  const [groupFilter, setGroupFilter] = useState('All groups')
  const deferredSearch = useDeferredValue(search)

  const loadUsers = useCallback(
    async () =>
      listUsers({
        search: deferredSearch,
        status: scope === 'All' ? undefined : (scope.toLowerCase() as 'active' | 'suspended'),
        role,
        groupName: groupFilter === 'All groups' ? undefined : groupFilter,
        limit: 100,
      }),
    [deferredSearch, scope, role, groupFilter],
  )

  useEffect(() => {
    let cancelled = false

    loadUsers()
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
  }, [loadUsers])

  useEffect(() => {
    let cancelled = false

    listUserGroups()
      .then((groups) => {
        if (!cancelled && groups.length > 0) {
          setGroupOptions(groups)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setGroupOptions(fallbackUserGroups)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  function resetUserFilters() {
    setSearch('')
    setScope('All')
    setRole('All roles')
    setGroupFilter('All groups')
  }

  async function handleCreateUser(input: CreateUserInput) {
    setIsCreatingUser(true)
    try {
      const createdUser = await createUser(input)
      const users = await loadUsers()
      setAdminUsers(users)
      setLoadError(null)
      setIsAddUserOpen(false)
      toast.success('User has been added', {
        description: `${createdUser.displayName} is now saved in the database.`,
      })
    } finally {
      setIsCreatingUser(false)
    }
  }

  return (
    <div className="min-w-0">
      <UsersHeader />

      <UserFilters
        search={search}
        scope={scope}
        role={role}
        groupFilter={groupFilter}
        groupOptions={groupOptions}
        onSearchChange={setSearch}
        onScopeChange={setScope}
        onRoleChange={setRole}
        onGroupFilterChange={setGroupFilter}
        onReset={resetUserFilters}
        onAddUser={() => setIsAddUserOpen(true)}
      />

      {loadError ? (
        <div className="mt-4 border border-danger-500/30 bg-danger-100 px-4 py-3 text-sm text-danger-500">
          {loadError}
        </div>
      ) : null}

      <div className="mt-4">
        <UsersTable rows={adminUsers} onRowClick={(user) => navigate(`/admin/users/${user.id}`)} />
      </div>

      <AddUserDialog
        open={isAddUserOpen}
        groupOptions={groupOptions}
        isSubmitting={isCreatingUser}
        onOpenChange={setIsAddUserOpen}
        onSubmit={handleCreateUser}
      />
    </div>
  )
}

export function UserDetailPage() {
  const navigate = useNavigate()
  const { userId } = useParams()
  const [user, setUser] = useState<AdminUser | undefined>()
  const [loaded, setLoaded] = useState(false)
  const [groupOptions, setGroupOptions] = useState<string[]>(fallbackUserGroups)
  const [initialForm, setInitialForm] = useState<UserDetailForm | null>(null)
  const [form, setForm] = useState<UserDetailForm | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')

  useEffect(() => {
    let cancelled = false

    getUserByIdOrUndefined(userId)
      .then((nextUser) => {
        if (!cancelled) {
          setUser(nextUser)
          if (nextUser) {
            const nextForm = buildUserDetailForm(nextUser)
            setInitialForm(nextForm)
            setForm(nextForm)
          }
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

  useEffect(() => {
    let cancelled = false

    listUserGroups()
      .then((groups) => {
        if (!cancelled && groups.length > 0) {
          setGroupOptions(groups)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setGroupOptions(fallbackUserGroups)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  if (!loaded) {
    return <div className="ui-panel px-4 py-6 text-sm text-slate-500">Loading user...</div>
  }

  if (!user || !form || !initialForm) {
    return <Navigate to="/admin/users" replace />
  }

  const isAdminAccount = user.role === 'Administrator'
  const hasChanges = !isSameUserDetailForm(form, initialForm)
  const controlsDisabled = isAdminAccount || !hasChanges || isSaving
  const canConfirmDelete = deleteConfirmation.trim() === user.username

  function updateForm<Field extends keyof UserDetailForm>(field: Field, value: UserDetailForm[Field]) {
    if (isAdminAccount) return
    setForm((current) => (current ? { ...current, [field]: value } : current))
  }

  async function handleSaveChanges() {
    if (!hasChanges || !form || !user) return
    if (isAdminAccount) {
      toast.error('Administrator accounts are view-only')
      return
    }

    setIsSaving(true)
    try {
      const currentForm = form
      const currentUser = user
      const balance = Math.max(0, Number(currentForm.balance || 0))
      const updatedUser = await updateUser(currentUser.id, {
        displayName: currentForm.displayName,
        email: currentForm.email,
        groupName: currentForm.groupName,
        role: currentForm.role,
        status: currentForm.status,
        restricted: currentForm.restricted,
        allocatedPages: currentUser.quotaUsed + balance,
      })
      const nextForm = buildUserDetailForm(updatedUser)
      setUser(updatedUser)
      setInitialForm(nextForm)
      setForm(nextForm)
      toast.success('User info has been updated', {
        description: `${updatedUser.displayName}'s changes were saved to the database.`,
      })
    } catch (error) {
      toast.error('Unable to update user', {
        description: error instanceof Error ? error.message : 'Please try again.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDeleteUser() {
    if (!user || !canConfirmDelete) return
    if (isAdminAccount) {
      toast.error('Administrator accounts cannot be deleted')
      return
    }

    setIsDeleting(true)
    try {
      const currentUser = user
      await deleteUser(currentUser.id)
      toast.success('User permanently removed', {
        description: `${currentUser.displayName} was removed from the system.`,
      })
      navigate('/admin/users', { replace: true })
    } catch (error) {
      toast.error('Unable to delete user', {
        description: error instanceof Error ? error.message : 'Please try again.',
      })
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
      setDeleteConfirmation('')
    }
  }

  function handleDeleteDialogOpenChange(open: boolean) {
    setIsDeleteDialogOpen(open)
    if (!open) {
      setDeleteConfirmation('')
    }
  }

  return (
    <div className="min-w-0">
      <UserDetailHeader user={user} onBack={() => navigate('/admin/users')} />
      <UserProfilePanel
        username={user.username}
        form={form}
        isReadOnly={isAdminAccount}
        onFieldChange={updateForm}
      />
      <UserAccessQuotaPanel
        user={user}
        form={form}
        groupOptions={groupOptions}
        isReadOnly={isAdminAccount}
        onFieldChange={updateForm}
      />
      <UserDetailActions
        isSaving={isSaving}
        controlsDisabled={controlsDisabled}
        isReadOnly={isAdminAccount}
        onCancel={() => setForm(initialForm)}
        onSave={handleSaveChanges}
        onDelete={() => setIsDeleteDialogOpen(true)}
      />
      <DeleteUserDialog
        open={isDeleteDialogOpen}
        user={user}
        confirmation={deleteConfirmation}
        isDeleting={isDeleting}
        canConfirm={canConfirmDelete}
        onOpenChange={handleDeleteDialogOpenChange}
        onConfirmationChange={setDeleteConfirmation}
        onConfirm={handleDeleteUser}
      />
    </div>
  )
}
