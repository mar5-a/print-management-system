import { useDeferredValue, useMemo, useState } from 'react'
import { getQueueDeleteStateLabel } from '@/lib/status'
import type { AdminQueue } from '@/types/admin'
import type { QueueAvailabilityScope } from '../types'

export function useQueueFilters(queues: AdminQueue[]) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All statuses')
  const [audienceFilter, setAudienceFilter] = useState('All audiences')
  const [deleteFilter, setDeleteFilter] = useState('All delete states')
  const [availability, setAvailability] = useState<QueueAvailabilityScope>('All')
  const deferredSearch = useDeferredValue(search)

  const filteredQueues = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase()

    return queues.filter((queue) => {
      const matchesSearch =
        !query ||
        [queue.name, queue.description, queue.hostedOn, queue.department, ...queue.allowedGroups].some((value) =>
          value.toLowerCase().includes(query),
        )
      const matchesStatus = statusFilter === 'All statuses' ? true : queue.status === statusFilter
      const matchesAudience = audienceFilter === 'All audiences' ? true : queue.audience === audienceFilter
      const matchesDeleteState = deleteFilter === 'All delete states' ? true : getQueueDeleteStateLabel(queue) === deleteFilter
      const matchesAvailability = availability === 'All' ? true : availability === 'Enabled only' ? queue.enabled : !queue.enabled

      return matchesSearch && matchesStatus && matchesAudience && matchesDeleteState && matchesAvailability
    })
  }, [audienceFilter, availability, deferredSearch, deleteFilter, queues, statusFilter])

  function resetFilters() {
    setStatusFilter('All statuses')
    setAudienceFilter('All audiences')
    setDeleteFilter('All delete states')
    setAvailability('All')
  }

  return {
    availability,
    filteredQueues,
    resetFilters,
    search,
    setAudienceFilter,
    setAvailability,
    setDeleteFilter,
    setSearch,
    setStatusFilter,
    statusFilter,
    audienceFilter,
    deleteFilter,
  }
}
