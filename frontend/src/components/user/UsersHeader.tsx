import { RefreshCw } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'

export function UsersHeader() {
  return (
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
  )
}
