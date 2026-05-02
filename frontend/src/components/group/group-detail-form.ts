import type { AdminGroup } from '@/types/admin'

export type GroupDetailForm = {
  name: string
  description: string
  schedule: AdminGroup['schedule']
  quotaPerPeriod: string
  studentRestricted: boolean
  defaultForNewUsers: boolean
}

export type GroupDetailFormChangeHandler = <Field extends keyof GroupDetailForm>(
  field: Field,
  value: GroupDetailForm[Field],
) => void

export function buildGroupDetailForm(group: AdminGroup): GroupDetailForm {
  return {
    name: group.name,
    description: group.description,
    schedule: group.schedule,
    quotaPerPeriod: String(group.quotaPerPeriod),
    studentRestricted: group.studentRestricted,
    defaultForNewUsers: group.defaultForNewUsers,
  }
}

export function isSameGroupDetailForm(left: GroupDetailForm, right: GroupDetailForm) {
  return (
    left.name === right.name &&
    left.description === right.description &&
    left.schedule === right.schedule &&
    left.quotaPerPeriod === right.quotaPerPeriod &&
    left.studentRestricted === right.studentRestricted &&
    left.defaultForNewUsers === right.defaultForNewUsers
  )
}
