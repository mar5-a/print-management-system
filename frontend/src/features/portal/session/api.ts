import { getCurrentUser } from '@/lib/auth'
import type { PortalUserProfile } from '@/types/portal'

export function getCurrentPortalUserProfile(): PortalUserProfile {
  const authUser = getCurrentUser()

  return {
    id: authUser?.id ?? '',
    username: authUser?.username ?? '',
    displayName: authUser?.displayName ?? authUser?.username ?? 'Unknown User',
    department: authUser?.department ?? 'General Access',
    role: authUser?.role === 'Faculty' ? 'Faculty' : 'Student',
    assignedQueueId: '',
    quotaUsed: authUser?.quotaUsed ?? 0,
    quotaTotal: authUser?.quotaTotal ?? 500,
    retentionHours: 24,
  }
}
