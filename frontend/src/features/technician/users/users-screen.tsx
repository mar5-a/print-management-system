import { useCallback, useDeferredValue, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { AddUserDialog } from '@/components/user/AddUserDialog'
import { fallbackUserGroups, type UserScopeFilter } from '@/components/user/user-detail-form'
import { UserFilters } from '@/components/user/UserFilters'
import { UsersHeader } from '@/components/user/UsersHeader'
import { UsersTable } from '@/components/user/UsersTable'
import type { AdminUser } from '@/types/admin'
import {
  createTechUser,
  listTechUserGroups,
  listTechUsers,
  type CreateUserInput,
} from './api'

export function TechUsersScreen() {
  const navigate = useNavigate()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [groupOptions, setGroupOptions] = useState<string[]>(fallbackUserGroups)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [isCreatingUser, setIsCreatingUser] = useState(false)
  const [search, setSearch] = useState('')
  const [scope, setScope] = useState<UserScopeFilter>('All')
  const [role, setRole] = useState<AdminUser['role'] | 'All roles'>('All roles')
  const [groupFilter, setGroupFilter] = useState('All groups')
  const deferredSearch = useDeferredValue(search)

  const loadUsers = useCallback(
    async () =>
      listTechUsers({
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
      .then((nextUsers) => {
        if (!cancelled) {
          setUsers(nextUsers)
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

    listTechUserGroups()
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
      const createdUser = await createTechUser(input)
      const nextUsers = await loadUsers()
      setUsers(nextUsers)
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
        <UsersTable rows={users} onRowClick={(user) => navigate(`/tech/users/${user.id}`)} />
      </div>

      <AddUserDialog
        open={isAddUserOpen}
        groupOptions={groupOptions}
        roleOptions={['Student']}
        isSubmitting={isCreatingUser}
        onOpenChange={setIsAddUserOpen}
        onSubmit={handleCreateUser}
      />
    </div>
  )
}
