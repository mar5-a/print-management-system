import { ArrowLeft } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import type { AdminUser } from '@/types/admin'

interface UserDetailHeaderProps {
  user: AdminUser
  onBack: () => void
}

export function UserDetailHeader({ user, onBack }: UserDetailHeaderProps) {
  return (
    <PageHeader
      eyebrow={`Users > ${user.displayName}`}
      title={user.displayName}
      description={`${user.username} · ${user.role}`}
      meta={
        <button className="ui-button-secondary h-11 px-5" onClick={onBack}>
          <ArrowLeft className="size-4" />
          Back to users
        </button>
      }
    />
  )
}
