import { Plus } from 'lucide-react'
import { FilterBar } from '../ui/filter-bar'

interface GroupsToolbarProps {
  search: string
  onSearchChange: (value: string) => void
  onAddGroup: () => void
}

export function GroupsToolbar({ search, onSearchChange, onAddGroup }: GroupsToolbarProps) {
  return (
    <FilterBar
      searchValue={search}
      onSearchChange={onSearchChange}
      searchPlaceholder="Search groups"
    >
      <button type="button" className="ui-button-action px-3 py-2" onClick={onAddGroup}>
        <Plus className="size-4" />
        New group
      </button>
    </FilterBar>
  )
}
