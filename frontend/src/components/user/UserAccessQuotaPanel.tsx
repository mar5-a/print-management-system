import type { AdminUser } from '@/types/admin'
import type { UserDetailForm, UserDetailFormChangeHandler } from './user-detail-form'
import { UserReadOnlyField } from './UserReadOnlyField'

interface UserAccessQuotaPanelProps {
  user: AdminUser
  form: UserDetailForm
  groupOptions: string[]
  roleOptions?: AdminUser['role'][]
  isReadOnly?: boolean
  onFieldChange: UserDetailFormChangeHandler
}

export function UserAccessQuotaPanel({
  user,
  form,
  groupOptions,
  roleOptions = ['Administrator', 'Technician', 'Faculty', 'Student'],
  isReadOnly = false,
  onFieldChange,
}: UserAccessQuotaPanelProps) {
  const inputClassName = `ui-input mt-2 ${
    isReadOnly ? 'bg-mist-50 text-slate-700 focus:border-line focus:ring-0' : ''
  }`
  const selectClassName =
    'ui-select mt-2 w-full disabled:cursor-not-allowed disabled:bg-mist-50 disabled:text-slate-700'

  return (
    <section className="ui-panel mt-4 overflow-hidden">
      <div className="px-5 py-5">
        <h2 className="text-lg font-semibold text-ink-950">Access and quota</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <label>
            <div className="ui-detail-label">Status</div>
            <select
              className={selectClassName}
              value={form.status}
              disabled={isReadOnly}
              onChange={(event) => onFieldChange('status', event.target.value as AdminUser['status'])}
            >
              <option>Active</option>
              <option>Suspended</option>
            </select>
          </label>
          <label>
            <div className="ui-detail-label">Role</div>
            <select
              className={selectClassName}
              value={form.role}
              disabled={isReadOnly}
              onChange={(event) => onFieldChange('role', event.target.value as AdminUser['role'])}
            >
              {roleOptions.map((roleOption) => (
                <option key={roleOption}>{roleOption}</option>
              ))}
            </select>
          </label>
          <label>
            <div className="ui-detail-label">Groups</div>
            <select
              className={selectClassName}
              value={form.groupName}
              disabled={isReadOnly}
              onChange={(event) => onFieldChange('groupName', event.target.value)}
            >
              {groupOptions.map((group) => (
                <option key={group}>{group}</option>
              ))}
            </select>
          </label>
          <label>
            <div className="ui-detail-label">Balance</div>
            <input
              className={inputClassName}
              type="number"
              min="0"
              step="1"
              value={form.balance}
              readOnly={isReadOnly}
              tabIndex={isReadOnly ? -1 : undefined}
              onChange={(event) => onFieldChange('balance', event.target.value)}
            />
          </label>
          <UserReadOnlyField label="Print jobs" value={user.jobCount} />
          <label className="flex items-center gap-3 pt-7 text-sm text-ink-950">
            <input
              type="checkbox"
              className="size-4 border-line disabled:cursor-not-allowed"
              checked={form.restricted}
              disabled={isReadOnly}
              onChange={(event) => onFieldChange('restricted', event.target.checked)}
            />
            <span>Restricted</span>
          </label>
          <UserReadOnlyField label="Primary identity" value={user.primaryIdentity} mono />
          <UserReadOnlyField label="Secondary identity" value={user.secondaryIdentity} mono />
          <UserReadOnlyField label="Card number" value={user.cardId} mono />
        </div>
      </div>
    </section>
  )
}
