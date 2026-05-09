import type { PortalJobStatus } from '@/types/portal'
import type { AdminQueue, QueueLogEntry } from '@/types/admin'

export function getPortalJobStatusClass(status: PortalJobStatus) {
  if (status === 'Completed') return 'bg-accent-100 text-accent-700'
  if (status === 'Stored on printer') return 'bg-accent-100 text-accent-700'
  if (status === 'Failed') return 'bg-danger-100 text-danger-500'
  if (status === 'Cancelled' || status === 'Expired') return 'bg-mist-50 text-slate-600'
  if (status === 'Sending to printer') return 'bg-warn-100 text-warn-500'
  return 'bg-warn-100 text-warn-500'
}

export function getQueueLogStateClass(state: QueueLogEntry['state']) {
  if (state === 'Resolved') return 'bg-accent-100 text-accent-700'
  if (state === 'Open') return 'bg-danger-100 text-danger-500'
  return 'bg-mist-50 text-slate-600'
}

export function getDeviceStatusTextClass(status: string) {
  if (status === 'Online' || status === 'Active') return 'text-accent-700'
  if (status === 'Offline' || status === 'Suspended') return 'text-danger-500'
  return 'text-warn-500'
}

export function getStatusDotClass(status: string) {
  if (status === 'Online' || status === 'Active') return 'bg-accent-500'
  if (status === 'Offline' || status === 'Suspended') return 'bg-danger-500'
  return 'bg-warn-500'
}

export function isQueueDeleteBlocked(queue: Pick<AdminQueue, 'pendingJobs' | 'heldJobs'>) {
  return queue.pendingJobs > 0 || queue.heldJobs > 0
}

export function getQueueDeleteStateLabel(queue: Pick<AdminQueue, 'pendingJobs' | 'heldJobs'>) {
  return isQueueDeleteBlocked(queue) ? 'Blocked by active jobs' : 'Ready to delete'
}
