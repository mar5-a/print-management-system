import { getCurrentUser } from '@/lib/auth'
import { getPortalProfileForAuthUser } from '@/mocks/portal-store'
import type { PortalUserProfile } from '@/types/portal'

export function getCurrentPortalUserProfile() {
  const authUser = getCurrentUser()

  if (authUser?.displayName) {
    return {
      id: authUser.id,
      username: authUser.username,
      displayName: authUser.displayName,
      department: authUser.department ?? 'General Access',
      role: authUser.role === 'Faculty' ? 'Faculty' : 'Student',
      assignedQueueId: '',
      quotaUsed: authUser.quotaUsed ?? 0,
      quotaTotal: authUser.quotaTotal ?? 500,
      retentionHours: 24,
    } satisfies PortalUserProfile
  }

  return getPortalProfileForAuthUser(authUser)
}
