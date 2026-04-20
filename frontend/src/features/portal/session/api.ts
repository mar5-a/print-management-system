import { getCurrentUser } from '@/lib/auth'
import { getPortalProfileForAuthUser } from '@/mocks/portal-store'

export function getCurrentPortalUserProfile() {
  return getPortalProfileForAuthUser(getCurrentUser())
}
