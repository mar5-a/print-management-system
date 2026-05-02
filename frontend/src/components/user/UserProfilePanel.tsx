import type { UserDetailForm, UserDetailFormChangeHandler } from './user-detail-form'
import { UserReadOnlyField } from './UserReadOnlyField'

interface UserProfilePanelProps {
  username: string
  form: UserDetailForm
  isReadOnly?: boolean
  onFieldChange: UserDetailFormChangeHandler
}

export function UserProfilePanel({
  username,
  form,
  isReadOnly = false,
  onFieldChange,
}: UserProfilePanelProps) {
  const inputClassName = `ui-input mt-2 ${
    isReadOnly ? 'bg-mist-50 text-slate-700 focus:border-line focus:ring-0' : ''
  }`

  return (
    <section className="ui-panel overflow-hidden">
      <div className="px-5 py-5">
        <h2 className="text-lg font-semibold text-ink-950">Profile</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <UserReadOnlyField label="Username" value={username} />
          <label>
            <div className="ui-detail-label">Full name</div>
            <input
              className={inputClassName}
              value={form.displayName}
              readOnly={isReadOnly}
              tabIndex={isReadOnly ? -1 : undefined}
              onChange={(event) => onFieldChange('displayName', event.target.value)}
            />
          </label>
          <label>
            <div className="ui-detail-label">Email address</div>
            <input
              className={inputClassName}
              type="email"
              value={form.email}
              readOnly={isReadOnly}
              tabIndex={isReadOnly ? -1 : undefined}
              onChange={(event) => onFieldChange('email', event.target.value)}
            />
          </label>
        </div>
      </div>
    </section>
  )
}
