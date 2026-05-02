import { Plus, RotateCcw } from 'lucide-react'
import { FilterBar } from '@/components/ui/filter-bar'
import type { AdminUser } from '@/types/admin'
import type { UserScopeFilter } from './user-detail-form'

type UserRoleFilter = AdminUser['role'] | 'All roles'

interface UserFiltersProps {
  search: string
  scope: UserScopeFilter
  role: UserRoleFilter
  groupFilter: string
  groupOptions: string[]
  onSearchChange: (value: string) => void
  onScopeChange: (value: UserScopeFilter) => void
  onRoleChange: (value: UserRoleFilter) => void
  onGroupFilterChange: (value: string) => void
  onReset: () => void
  onAddUser: () => void
}

export function UserFilters({
  search,
  scope,
  role,
  groupFilter,
  groupOptions,
  onSearchChange,
  onScopeChange,
  onRoleChange,
  onGroupFilterChange,
  onReset,
  onAddUser,
}: UserFiltersProps) {
  return (
    <FilterBar
      searchValue={search}
      onSearchChange={onSearchChange}
      searchPlaceholder="Search by account or name"
      actions={
        <button className="ui-button-action h-9 px-3 py-0" onClick={onAddUser}>
          <Plus className="size-4" />
          Add user
        </button>
      }
      filters={
        <>
          <label className="min-w-[8.5rem] flex-1 sm:flex-none">
            <span className="sr-only">Status</span>
            <select
              className="ui-select h-9 w-full min-w-[8.5rem]"
              aria-label="Status"
              value={scope}
              onChange={(event) => onScopeChange(event.target.value as UserScopeFilter)}
            >
              <option>All</option>
              <option>Active</option>
              <option>Suspended</option>
            </select>
          </label>
          <label className="min-w-[9rem] flex-1 sm:flex-none">
            <span className="sr-only">Role</span>
            <select
              className="ui-select h-9 w-full min-w-[9rem]"
              aria-label="Role"
              value={role}
              onChange={(event) => onRoleChange(event.target.value as UserRoleFilter)}
            >
              <option>All roles</option>
              <option>Administrator</option>
              <option>Technician</option>
              <option>Faculty</option>
              <option>Student</option>
            </select>
          </label>
          <label className="min-w-[9rem] flex-1 sm:flex-none">
            <span className="sr-only">Group</span>
            <select
              className="ui-select h-9 w-full min-w-[9rem]"
              aria-label="Group"
              value={groupFilter}
              onChange={(event) => onGroupFilterChange(event.target.value)}
            >
              <option>All groups</option>
              {groupOptions.map((group) => (
                <option key={group}>{group}</option>
              ))}
            </select>
          </label>
          <button type="button" className="ui-button-secondary h-9 px-3 py-0" onClick={onReset}>
            <RotateCcw className="size-3.5" />
            Reset
          </button>
        </>
      }
    />
  )
}
