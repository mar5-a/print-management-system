import type { QueueAccessScope, QueueReleaseMode } from '@/types/admin'

export type QueueAvailabilityScope = 'All' | 'Enabled only' | 'Disabled only'

export interface QueueDraft {
  name: string
  description: string
  audience: QueueAccessScope
  releaseMode: QueueReleaseMode
  enabled: boolean
  printerIds: string[]
  allowedGroups: string[]
}

export function getInitialQueueDraft(): QueueDraft {
  return {
    name: '',
    description: '',
    audience: 'Students',
    releaseMode: 'Secure Release',
    enabled: true,
    printerIds: [],
    allowedGroups: ['CCM-Students'],
  }
}
