export function UserReadOnlyField({
  label,
  value,
  mono = false,
}: {
  label: string
  value: string | number
  mono?: boolean
}) {
  return (
    <label>
      <div className="ui-detail-label">{label}</div>
      <input
        className={`ui-input mt-2 bg-mist-50 text-slate-700 ${mono ? 'font-mono' : ''}`}
        value={value}
        readOnly
        tabIndex={-1}
      />
    </label>
  )
}
