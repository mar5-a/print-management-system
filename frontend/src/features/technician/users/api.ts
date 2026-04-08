import {
  listTechUsers,
  getTechUserById,
  updateTechUserQuota,
  setTechUserStatus,
} from '@/mocks/technician-store'

export { listTechUsers, getTechUserById, updateTechUserQuota, setTechUserStatus }

export function listTechUsersFiltered() {
  return listTechUsers()
}

export function getTechUserOrUndefined(userId?: string) {
  return getTechUserById(userId)
}
