import { useCallback, useDeferredValue, useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { AddGroupDialog } from '../components/group/AddGroupDialog'
import { DeleteGroupDialog } from '../components/group/DeleteGroupDialog'
import { GroupDetailActions } from '../components/group/GroupDetailActions'
import { GroupDetailHeader } from '../components/group/GroupDetailHeader'
import { GroupIdentityPanel } from '../components/group/GroupIdentityPanel'
import { GroupMembersPanel } from '../components/group/GroupMembersPanel'
import { GroupNewUserDefaultsPanel } from '../components/group/GroupNewUserDefaultsPanel'
import { GroupQuotaPolicyPanel } from '../components/group/GroupQuotaPolicyPanel'
import { GroupsHeader } from '../components/group/GroupsHeader'
import { GroupsTable } from '../components/group/GroupsTable'
import { GroupsToolbar } from '../components/group/GroupsToolbar'
import {
  buildGroupDetailForm,
  isSameGroupDetailForm,
  type GroupDetailForm,
} from '../components/group/group-detail-form'
import {
  createGroup,
  deleteGroup,
  getGroupByIdOrUndefined,
  listGroups,
  updateGroup,
  type GroupMutationInput,
} from '../features/admin/groups/api'
import type { AdminGroup } from '../types/admin'

function toGroupMutationInput(form: GroupDetailForm): GroupMutationInput {
  return {
    name: form.name,
    description: form.description,
    schedule: form.schedule,
    quotaPerPeriod: Math.max(0, Number(form.quotaPerPeriod || 0)),
    studentRestricted: form.studentRestricted,
    defaultForNewUsers: form.defaultForNewUsers,
  }
}

export function GroupsPage() {
  const navigate = useNavigate()
  const [groups, setGroups] = useState<AdminGroup[]>([])
  const [search, setSearch] = useState('')
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isAddGroupOpen, setIsAddGroupOpen] = useState(false)
  const [isCreatingGroup, setIsCreatingGroup] = useState(false)
  const deferredSearch = useDeferredValue(search)

  const loadGroups = useCallback(
    async () =>
      listGroups({
        search: deferredSearch,
        limit: 100,
      }),
    [deferredSearch],
  )

  useEffect(() => {
    let cancelled = false

    loadGroups()
      .then((nextGroups) => {
        if (!cancelled) {
          setGroups(nextGroups)
          setLoadError(null)
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : 'Unable to load groups.')
        }
      })

    return () => {
      cancelled = true
    }
  }, [loadGroups])

  async function handleCreateGroup(input: GroupMutationInput) {
    setIsCreatingGroup(true)
    try {
      const createdGroup = await createGroup(input)
      const nextGroups = await loadGroups()
      setGroups(nextGroups)
      setLoadError(null)
      setIsAddGroupOpen(false)
      toast.success('Group has been added', {
        description: `${createdGroup.name} is now saved in the database.`,
      })
    } finally {
      setIsCreatingGroup(false)
    }
  }

  return (
    <div className="min-w-0">
      <GroupsHeader />

      <GroupsToolbar
        search={search}
        onSearchChange={setSearch}
        onAddGroup={() => setIsAddGroupOpen(true)}
      />

      {loadError ? (
        <div className="mt-4 border border-danger-500/30 bg-danger-100 px-4 py-3 text-sm text-danger-500">
          {loadError}
        </div>
      ) : null}

      <div className="mt-4">
        <GroupsTable rows={groups} onRowClick={(group) => navigate(`/admin/groups/${group.id}`)} />
      </div>

      <AddGroupDialog
        open={isAddGroupOpen}
        isSubmitting={isCreatingGroup}
        onOpenChange={setIsAddGroupOpen}
        onSubmit={handleCreateGroup}
      />
    </div>
  )
}

export function GroupDetailPage() {
  const navigate = useNavigate()
  const { groupId } = useParams()
  const [group, setGroup] = useState<AdminGroup | undefined>()
  const [loaded, setLoaded] = useState(false)
  const [initialForm, setInitialForm] = useState<GroupDetailForm | null>(null)
  const [form, setForm] = useState<GroupDetailForm | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isMembersOpen, setIsMembersOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoaded(false)

    getGroupByIdOrUndefined(groupId)
      .then((nextGroup) => {
        if (!cancelled) {
          setGroup(nextGroup)
          if (nextGroup) {
            const nextForm = buildGroupDetailForm(nextGroup)
            setInitialForm(nextForm)
            setForm(nextForm)
          }
          setLoaded(true)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setGroup(undefined)
          setLoaded(true)
        }
      })

    return () => {
      cancelled = true
    }
  }, [groupId])

  if (!loaded) {
    return <div className="ui-panel px-4 py-6 text-sm text-slate-500">Loading group...</div>
  }

  if (!group || !form || !initialForm) {
    return <Navigate to="/admin/groups" replace />
  }

  const hasChanges = !isSameGroupDetailForm(form, initialForm)
  const controlsDisabled = !hasChanges || isSaving
  const canConfirmDelete = deleteConfirmation.trim() === group.name

  function updateForm<Field extends keyof GroupDetailForm>(field: Field, value: GroupDetailForm[Field]) {
    setForm((current) => (current ? { ...current, [field]: value } : current))
  }

  async function handleSaveChanges() {
    if (!hasChanges || !form || !group) return

    setIsSaving(true)
    try {
      const updatedGroup = await updateGroup(group.id, toGroupMutationInput(form))
      const nextForm = buildGroupDetailForm(updatedGroup)
      setGroup(updatedGroup)
      setInitialForm(nextForm)
      setForm(nextForm)
      toast.success('Group info has been updated', {
        description: `${updatedGroup.name}'s changes were saved to the database.`,
      })
    } catch (error) {
      toast.error('Unable to update group', {
        description: error instanceof Error ? error.message : 'Please try again.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDeleteGroup() {
    if (!group || !canConfirmDelete) return

    setIsDeleting(true)
    try {
      const currentGroup = group
      await deleteGroup(currentGroup.id)
      toast.success('Group permanently removed', {
        description: `${currentGroup.name} was removed from the system.`,
      })
      navigate('/admin/groups', { replace: true })
    } catch (error) {
      toast.error('Unable to delete group', {
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
      <GroupDetailHeader
        group={group}
        membersOpen={isMembersOpen}
        onBack={() => navigate('/admin/groups')}
        onMembersToggle={() => setIsMembersOpen((current) => !current)}
      />

      {isMembersOpen ? (
        <GroupMembersPanel
          groupId={group.id}
          onUserClick={(selectedUser) => navigate(`/admin/users/${selectedUser.id}`)}
        />
      ) : null}

      <div className="space-y-3">
        <GroupIdentityPanel form={form} onFieldChange={updateForm} />
        <GroupQuotaPolicyPanel form={form} onFieldChange={updateForm} />
        <GroupNewUserDefaultsPanel form={form} onFieldChange={updateForm} />
      </div>

      <GroupDetailActions
        isSaving={isSaving}
        controlsDisabled={controlsDisabled}
        onCancel={() => setForm(initialForm)}
        onSave={handleSaveChanges}
        onDelete={() => setIsDeleteDialogOpen(true)}
      />

      <DeleteGroupDialog
        open={isDeleteDialogOpen}
        group={group}
        confirmation={deleteConfirmation}
        isDeleting={isDeleting}
        canConfirm={canConfirmDelete}
        onOpenChange={handleDeleteDialogOpenChange}
        onConfirmationChange={setDeleteConfirmation}
        onConfirm={handleDeleteGroup}
      />
    </div>
  )
}
