import type { GroupDetailForm, GroupDetailFormChangeHandler } from './group-detail-form'

interface GroupNewUserDefaultsPanelProps {
  form: GroupDetailForm
  onFieldChange: GroupDetailFormChangeHandler
}

export function GroupNewUserDefaultsPanel({
  form,
  onFieldChange,
}: GroupNewUserDefaultsPanelProps) {
  return (
    <section className="ui-panel px-4 py-4">
      <div className="ui-detail-title">New user defaults</div>
      <div className="mt-3 grid gap-3 xl:grid-cols-2">
        <label className="ui-checkbox-line xl:col-span-2">
          <input
            type="checkbox"
            checked={form.defaultForNewUsers}
            onChange={(event) => onFieldChange('defaultForNewUsers', event.target.checked)}
          />
          <span>Use this group as the default assignment for new users</span>
        </label>
      </div>
    </section>
  )
}
