import {
  createUser,
  deleteUser,
  getUserByIdOrUndefined,
  listUserGroups,
  listUsers,
  updateUser,
  type CreateUserInput,
  type ListUsersInput,
  type UpdateUserInput,
} from '@/features/admin/users/api'

export type { CreateUserInput, ListUsersInput, UpdateUserInput }

export function listTechUsers(input: ListUsersInput = {}) {
  return listUsers(input)
}

export function listTechUserGroups() {
  return listUserGroups()
}

export function createTechUser(input: CreateUserInput) {
  return createUser({ ...input, role: 'Student' })
}

export function updateTechUser(userId: string, input: UpdateUserInput) {
  return updateUser(userId, { ...input, role: 'Student' })
}

export function deleteTechUser(userId: string) {
  return deleteUser(userId)
}

export function getTechUserOrUndefined(userId?: string) {
  return getUserByIdOrUndefined(userId)
}
