import type { GroupDetailForm, GroupDetailFormChangeHandler } from './group-detail-form'

interface GroupIdentityPanelProps {
  form: GroupDetailForm
  onFieldChange: GroupDetailFormChangeHandler
}

export function GroupIdentityPanel({ form, onFieldChange }: GroupIdentityPanelProps) {
  return (
    <section className="ui-panel px-4 py-4">
      <div className="ui-detail-title">Identity</div>
      <div className="mt-3 grid gap-3 xl:grid-cols-2">
        <label>
          <div className="ui-detail-label">Group name</div>
          <input
            className="ui-input mt-2"
            value={form.name}
            onChange={(event) => onFieldChange('name', event.target.value)}
          />
        </label>
        <label className="xl:col-span-2">
          <div className="ui-detail-label">Description</div>
          <textarea
            className="ui-textarea mt-2 min-h-20"
            value={form.description}
            onChange={(event) => onFieldChange('description', event.target.value)}
          />
        </label>
      </div>
    </section>
  )
}
