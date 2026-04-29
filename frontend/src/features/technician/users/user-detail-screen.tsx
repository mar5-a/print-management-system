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

  function handleSave() {
    updateTechUserQuota(user.id, quotaTotal)
    setTechUserStatus(user.id, status)
    navigate('/tech/users')
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
        {isSuspended && (
          <div className="px-5 pt-5">
            <DetailAlert
              title="Account suspended"
              description="This account cannot submit or release print jobs."
            />
          </div>
        )}

        <DetailSection title="Identity">
          <label>
            <div className="ui-detail-label">Username</div>
            <input className="ui-input mt-2 font-mono" value={user.username} readOnly tabIndex={-1} />
          </label>
          <label>
            <div className="ui-detail-label">Full name</div>
            <input className="ui-input mt-2" value={user.displayName} readOnly tabIndex={-1} />
          </label>
          <div>
            <div className="ui-detail-label">Role</div>
            <input className="ui-input mt-2" value={user.role} readOnly tabIndex={-1} />
          </div>
          <label>
            <div className="ui-detail-label">Status</div>
            <select className="ui-select mt-2 w-full" value={status} onChange={(e) => setStatus(e.target.value as 'Active' | 'Suspended')}>
              <option>Active</option>
              <option>Suspended</option>
            </select>
          </label>
        </DetailSection>

        <DetailSection title="Quota">
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
            />
          </label>
          <div>
            <div className="ui-detail-label">Balance</div>
            <div className="mt-2 text-base font-semibold text-ink-950">
              {quotaTotal - user.quotaUsed}
            </div>
          </div>
          <div>
            <div className="ui-detail-label">Total jobs</div>
            <div className="mt-2 text-base font-semibold text-ink-950">{user.jobCount}</div>
          </div>
        </DetailSection>

        <DetailSection title="Contact" columns="paired">
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
          <button className="ui-button" onClick={handleSave}>
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
