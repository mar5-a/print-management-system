import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  DetailActionBar,
  DetailAlert,
  DetailPanel,
  DetailSection,
} from '@/components/ui/admin-detail'
import { PageHeader } from '@/components/ui/page-header'
import { getTechUserOrUndefined, updateTechUserQuota, setTechUserStatus } from './api'
import type { AdminUser } from '@/types/admin'

function TechUserDetailInner({ user }: { user: AdminUser }) {
  const navigate = useNavigate()
  const [quotaTotal, setQuotaTotal] = useState(user.quotaTotal)
  const [status, setStatus] = useState<'Active' | 'Suspended'>(user.status)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const canManageAccount = user.role === 'Student'

  async function handleSave() {
    if (!canManageAccount) {
      setSaveError('Technicians can only update student accounts.')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    setSaveError(null)
    setIsSaving(true)
    try {
      await updateTechUserQuota(user.id, quotaTotal)
      await setTechUserStatus(user.id, status)
      navigate('/tech/users')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to save changes.'
      setSaveError(message)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setIsSaving(false)
    }
  }

  const isSuspended = status === 'Suspended'

  return (
    <div className="min-w-0">
      <PageHeader
        eyebrow="Users"
        title={user.displayName}
        description={`${user.username} · ${user.role}`}
        meta={
          <button className="ui-button-secondary" onClick={() => navigate('/tech/users')}>
            Back to users
          </button>
        }
      />

      <DetailPanel>
        {!canManageAccount ? (
          <div className="px-5 pt-5">
            <DetailAlert
              tone="warn"
              title="Protected account"
              description="Technicians cannot modify administrator or technician accounts."
            />
          </div>
        ) : null}

        {saveError ? (
          <div className="px-5 pt-5">
            <DetailAlert
              title="Update failed"
              description={saveError}
            />
          </div>
        ) : null}

        {isSuspended && (
          <DetailAlert
            className="mb-0"
            title="User restricted"
            description="This account cannot submit or release print jobs until it is reactivated."
          />
        )}

        <DetailSection title="Access and quota">
          <label>
            <div className="ui-detail-label">Status</div>
            <select className="ui-select mt-2 w-full" value={status} onChange={(e) => setStatus(e.target.value as 'Active' | 'Suspended')} disabled={!canManageAccount || isSaving}>
              <option>Active</option>
              <option>Suspended</option>
            </select>
          </label>
          <label>
            <div className="ui-detail-label">Role</div>
            <input className="ui-input mt-2" value={user.role} readOnly tabIndex={-1} />
          </label>
          <label>
            <div className="ui-detail-label">Pages used</div>
            <input className="ui-input mt-2" value={user.quotaUsed} readOnly tabIndex={-1} />
          </label>
          <label>
            <div className="ui-detail-label">Quota total</div>
            <input
              className="ui-input mt-2"
              type="number"
              value={quotaTotal}
              onChange={(e) => setQuotaTotal(Number(e.target.value))}
              disabled={!canManageAccount || isSaving}
            />
          </label>
          <div>
            <div className="ui-detail-label">Balance</div>
            <div className="mt-2 flex h-10 items-center border border-line bg-white px-3 text-base font-semibold text-ink-950">
              {quotaTotal - user.quotaUsed}
            </div>
          </div>
          <div>
            <div className="ui-detail-label">Total jobs</div>
            <div className="mt-2 flex h-10 items-center border border-line bg-white px-3 text-base font-semibold text-ink-950">{user.jobCount}</div>
          </div>
        </DetailSection>

        <DetailSection title="Identity mappings">
          <label>
            <div className="ui-detail-label">Primary identity</div>
            <input className="ui-input mt-2 font-mono" value={user.primaryIdentity} readOnly tabIndex={-1} />
          </label>
          <label>
            <div className="ui-detail-label">Secondary identity</div>
            <input className="ui-input mt-2 font-mono" value={user.secondaryIdentity} readOnly tabIndex={-1} />
          </label>
          <label>
            <div className="ui-detail-label">Card number</div>
            <input className="ui-input mt-2 font-mono" value={user.cardId} readOnly tabIndex={-1} />
          </label>
          <label>
            <div className="ui-detail-label">Groups</div>
            <textarea className="ui-textarea mt-2 min-h-20 font-mono" value={user.groups.join('\n')} readOnly tabIndex={-1} />
          </label>
          <label className="xl:col-span-2">
            <div className="ui-detail-label">Notes</div>
            <textarea className="ui-textarea mt-2" value={user.notes} readOnly tabIndex={-1} />
          </label>
        </DetailSection>

        <DetailSection title="Profile">
          <label>
            <div className="ui-detail-label">Username</div>
            <input className="ui-input mt-2 font-mono" value={user.username} readOnly tabIndex={-1} />
          </label>
          <label>
            <div className="ui-detail-label">Full name</div>
            <input className="ui-input mt-2" value={user.displayName} readOnly tabIndex={-1} />
          </label>
          <label>
            <div className="ui-detail-label">Email</div>
            <input className="ui-input mt-2" value={user.email} readOnly tabIndex={-1} />
          </label>
          <label>
            <div className="ui-detail-label">Department</div>
            <input className="ui-input mt-2" value={user.department} readOnly tabIndex={-1} />
          </label>
          <label>
            <div className="ui-detail-label">Office</div>
            <input className="ui-input mt-2" value={user.office} readOnly tabIndex={-1} />
          </label>
          <label>
            <div className="ui-detail-label">Last seen</div>
            <input className="ui-input mt-2" value={user.lastSeen} readOnly tabIndex={-1} />
          </label>
        </DetailSection>

        <DetailActionBar>
          <button className="ui-button-ghost" onClick={() => navigate('/tech/users')}>
            Cancel
          </button>
          <button className="ui-button" onClick={handleSave} disabled={!canManageAccount || isSaving}>
            Apply
          </button>
        </DetailActionBar>
      </DetailPanel>
    </div>
  )
}

export function TechUserDetailScreen() {
  const { userId } = useParams()
  const [user, setUser] = useState<AdminUser | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    getTechUserOrUndefined(userId).then(setUser).finally(() => setLoading(false))
  }, [userId])

  if (loading) return null
  if (!user) {
    return <Navigate to="/tech/users" replace />
  }

  return <TechUserDetailInner user={user} />
}
