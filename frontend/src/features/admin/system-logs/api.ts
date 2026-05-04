import { api } from '@/lib/api'

export type LogsRange = 'day' | 'week' | 'month'

export interface LogsOverview {
  totalJobs: number
  heldJobs: number
  deviceAuthEvents: number
}

export interface OperationalEvent {
  id: string
  type: string
  action: string
  actor: string
  time: string
}

export interface OperationalEventTypeOption {
  value: string
  label: string
}

export interface OperationalEventPage {
  rows: OperationalEvent[]
  total: number
  page: number
  limit: number
  totalPages: number
  typeOptions: OperationalEventTypeOption[]
}

interface ApiData<T> {
  data: T
}

interface BackendLogsOverview {
  total_jobs: number
  held_jobs: number
  device_auth_events: number
}

interface BackendOperationalEvents {
  rows: OperationalEvent[]
  total: number
  page: number
  limit: number
  totalPages: number
  typeOptions: string[]
}

export async function getLogsOverview(range: LogsRange): Promise<LogsOverview> {
  const response = await api.get<ApiData<BackendLogsOverview>>(`/logs/overview?range=${range}`)

  return {
    totalJobs: response.data.total_jobs,
    heldJobs: response.data.held_jobs,
    deviceAuthEvents: response.data.device_auth_events,
  }
}

export async function listOperationalEvents(input: {
  range: LogsRange
  search?: string
  type?: string
  page?: number
  limit?: number
}): Promise<OperationalEventPage> {
  const params = new URLSearchParams({
    range: input.range,
    page: String(input.page ?? 1),
    limit: String(input.limit ?? 25),
  })

  if (input.search?.trim()) {
    params.set('search', input.search.trim())
  }

  if (input.type && input.type !== 'all') {
    params.set('type', input.type)
  }

  const response = await api.get<ApiData<BackendOperationalEvents>>(`/logs/operational-events?${params.toString()}`)

  return {
    ...response.data,
    rows: response.data.rows.map((event) => ({
      ...event,
      time: formatEventTime(event.time),
    })),
    typeOptions: response.data.typeOptions.map((type) => ({
      value: type,
      label: type,
    })),
  }
}

function formatEventTime(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  const today = new Date()
  const sameDay =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()

  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  if (sameDay) {
    return `Today ${hours}:${minutes}`
  }

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[date.getMonth()]} ${date.getDate()} ${hours}:${minutes}`
}
