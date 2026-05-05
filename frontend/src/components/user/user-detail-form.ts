import type { AdminUser } from '@/types/admin'

export const fallbackUserGroups = ['CCM-Students', 'Faculty', 'Technicians', 'Administrators', 'AI Lab']

export type UserScopeFilter = 'All' | 'Active' | 'Suspended'

export type UserDetailForm = {
  displayName: string
  email: string
  status: AdminUser['status']
  role: AdminUser['role']
  groupName: string
  balance: string
  restricted: boolean
}

export type UserDetailFormChangeHandler = <Field extends keyof UserDetailForm>(
  field: Field,
  value: UserDetailForm[Field],
) => void

export function buildUserDetailForm(user: AdminUser): UserDetailForm {
  return {
    displayName: user.displayName,
    email: user.email,
    status: user.status,
    role: user.role,
    groupName: user.groups[0] ?? '',
    balance: String(Math.max(0, user.quotaTotal - user.quotaUsed)),
    restricted: user.status === 'Suspended',
  }
}

export function isSameUserDetailForm(left: UserDetailForm, right: UserDetailForm) {
  return (
    left.displayName === right.displayName &&
    left.email === right.email &&
    left.status === right.status &&
    left.role === right.role &&
    left.groupName === right.groupName &&
    left.balance === right.balance &&
    left.restricted === right.restricted
  )
}
