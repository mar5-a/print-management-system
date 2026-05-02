import { ChevronDown, ChevronUp } from 'lucide-react'
import type { AdminGroup } from '@/types/admin'

interface GroupDetailHeaderProps {
  group: AdminGroup
  membersOpen: boolean
  onBack: () => void
  onMembersToggle: () => void
}

export function GroupDetailHeader({
  group,
  membersOpen,
  onBack,
  onMembersToggle,
}: GroupDetailHeaderProps) {
  return (
    <header className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
      <div>
        <div className="ui-kicker">Groups</div>
        <h2 className="mt-1.5 text-[clamp(1.45rem,1.7vw,2rem)] font-semibold tracking-normal text-ink-950">
          {group.name}
        </h2>
        <button
          type="button"
          className="mt-1.5 inline-flex items-center gap-1.5 text-sm leading-5 text-slate-600 underline-offset-4 transition hover:text-accent-700 hover:underline"
          aria-expanded={membersOpen}
          onClick={onMembersToggle}
        >
          {membersOpen
            ? 'Hide group members'
            : `View ${group.userCount} ${group.userCount === 1 ? 'group member' : 'group members'}`}
          {membersOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button className="ui-button-secondary" onClick={onBack}>
          Back to groups
        </button>
      </div>
    </header>
  )
}
