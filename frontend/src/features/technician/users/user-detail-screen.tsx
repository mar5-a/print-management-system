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
import {
  deleteTechUser,
  getTechUserOrUndefined,
  listTechUserGroups,
  updateTechUser,
} from './api'

export function TechUserDetailScreen() {
  const navigate = useNavigate()
  const { userId } = useParams()
  const [user, setUser] = useState<AdminUser | undefined>()
  const [loaded, setLoaded] = useState(false)
  const [groupOptions, setGroupOptions] = useState<string[]>(fallbackUserGroups)
  const [initialForm, setInitialForm] = useState<UserDetailForm | null>(null)
  const [form, setForm] = useState<UserDetailForm | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')

  useEffect(() => {
    let cancelled = false

    getTechUserOrUndefined(userId)
      .then((nextUser) => {
        if (!cancelled) {
          setUser(nextUser)
          if (nextUser) {
            const nextForm = buildUserDetailForm(nextUser)
            setInitialForm(nextForm)
            setForm(nextForm)
          }
          setLoaded(true)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUser(undefined)
          setLoaded(true)
        }
      })

    return () => {
      cancelled = true
    }
  }, [userId])

  useEffect(() => {
    let cancelled = false

    listTechUserGroups()
      .then((groups) => {
        if (!cancelled && groups.length > 0) {
          setGroupOptions(groups)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setGroupOptions(fallbackUserGroups)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  if (!loaded) {
    return <div className="ui-panel px-4 py-6 text-sm text-slate-500">Loading user...</div>
  }

  if (!user || !form || !initialForm) {
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
