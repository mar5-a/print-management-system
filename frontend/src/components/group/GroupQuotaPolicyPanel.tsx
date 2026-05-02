import type { AdminGroup } from '@/types/admin'
import type { GroupDetailForm, GroupDetailFormChangeHandler } from './group-detail-form'

interface GroupQuotaPolicyPanelProps {
  form: GroupDetailForm
  onFieldChange: GroupDetailFormChangeHandler
}

export function GroupQuotaPolicyPanel({ form, onFieldChange }: GroupQuotaPolicyPanelProps) {
  return (
    <section className="ui-panel px-4 py-4">
      <div className="ui-detail-title">Quota policy</div>
      <div className="mt-3 grid gap-3 xl:grid-cols-2">
        <label>
          <div className="ui-detail-label">Period</div>
          <select
            className="ui-select mt-2 w-full"
            value={form.schedule}
            onChange={(event) => onFieldChange('schedule', event.target.value as AdminGroup['schedule'])}
          >
            <option>Weekly</option>
            <option>Monthly</option>
            <option>Semester</option>
          </select>
        </label>
        <label>
          <div className="ui-detail-label">Initial balance</div>
          <input
            className="ui-input mt-2"
            type="number"
            min="0"
            step="1"
            value={form.quotaPerPeriod}
            onChange={(event) => onFieldChange('quotaPerPeriod', event.target.value)}
          />
        </label>
        <label className="ui-checkbox-line xl:col-span-2">
          <input
            type="checkbox"
            checked={form.studentRestricted}
            onChange={(event) => onFieldChange('studentRestricted', event.target.checked)}
          />
          <span>Only allow this group to use restricted queue access</span>
        </label>
      </div>
    </section>
  )
}
