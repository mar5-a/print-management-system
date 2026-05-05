import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { DeleteUserDialog } from '@/components/user/DeleteUserDialog'
import { UserAccessQuotaPanel } from '@/components/user/UserAccessQuotaPanel'
import { UserDetailActions } from '@/components/user/UserDetailActions'
import { UserDetailHeader } from '@/components/user/UserDetailHeader'
import { UserProfilePanel } from '@/components/user/UserProfilePanel'
import {
  buildUserDetailForm,
  fallbackUserGroups,
  isSameUserDetailForm,
  type UserDetailForm,
} from '@/components/user/user-detail-form'
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
  const navigate = useNavigate()
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

  const isPrivilegedAccount = user.role === 'Administrator' || user.role === 'Technician'
  const hasChanges = !isSameUserDetailForm(form, initialForm)
  const controlsDisabled = isPrivilegedAccount || !hasChanges || isSaving
  const canConfirmDelete = deleteConfirmation.trim() === user.username

  function updateForm<Field extends keyof UserDetailForm>(field: Field, value: UserDetailForm[Field]) {
    if (isPrivilegedAccount) return
    setForm((current) => (current ? { ...current, [field]: value } : current))
  }

  async function handleSaveChanges() {
    if (!hasChanges || !form || !user) return
    if (isPrivilegedAccount) {
      toast.error('Administrator and technician accounts are view-only')
      return
    }

    setIsSaving(true)
    try {
      const balance = Math.max(0, Number(form.balance || 0))
      const updatedUser = await updateTechUser(user.id, {
        displayName: form.displayName,
        email: form.email,
        groupName: form.groupName,
        role: 'Student',
        status: form.status,
        restricted: form.restricted,
        allocatedPages: user.quotaUsed + balance,
      })
      const nextForm = buildUserDetailForm(updatedUser)
      setUser(updatedUser)
      setInitialForm(nextForm)
      setForm(nextForm)
      toast.success('User info has been updated', {
        description: `${updatedUser.displayName}'s changes were saved to the database.`,
      })
    } catch (error) {
      toast.error('Unable to update user', {
        description: error instanceof Error ? error.message : 'Please try again.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDeleteUser() {
    if (!user || !canConfirmDelete) return
    if (isPrivilegedAccount) {
      toast.error('Administrator and technician accounts cannot be deleted by technicians')
      return
    }

    setIsDeleting(true)
    try {
      const currentUser = user
      await deleteTechUser(currentUser.id)
      toast.success('User permanently removed', {
        description: `${currentUser.displayName} was removed from the system.`,
      })
      navigate('/tech/users', { replace: true })
    } catch (error) {
      toast.error('Unable to delete user', {
        description: error instanceof Error ? error.message : 'Please try again.',
      })
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
      setDeleteConfirmation('')
    }
  }

  function handleDeleteDialogOpenChange(open: boolean) {
    setIsDeleteDialogOpen(open)
    if (!open) {
      setDeleteConfirmation('')
    }
  }

  return (
    <div className="min-w-0">
      <UserDetailHeader user={user} onBack={() => navigate('/tech/users')} />
      <UserProfilePanel
        username={user.username}
        form={form}
        isReadOnly={isPrivilegedAccount}
        onFieldChange={updateForm}
      />
      <UserAccessQuotaPanel
        user={user}
        form={form}
        groupOptions={groupOptions}
        roleOptions={isPrivilegedAccount ? undefined : ['Student']}
        isReadOnly={isPrivilegedAccount}
        onFieldChange={updateForm}
      />
      <UserDetailActions
        isSaving={isSaving}
        controlsDisabled={controlsDisabled}
        isReadOnly={isPrivilegedAccount}
        onCancel={() => setForm(initialForm)}
        onSave={handleSaveChanges}
        onDelete={() => setIsDeleteDialogOpen(true)}
      />
      <DeleteUserDialog
        open={isDeleteDialogOpen}
        user={user}
        confirmation={deleteConfirmation}
        isDeleting={isDeleting}
        canConfirm={canConfirmDelete}
        onOpenChange={handleDeleteDialogOpenChange}
        onConfirmationChange={setDeleteConfirmation}
        onConfirm={handleDeleteUser}
      />
    </div>
  )
}
