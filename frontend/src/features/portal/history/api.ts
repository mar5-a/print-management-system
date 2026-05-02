import { api } from '@/lib/api'
import { mapPortalJobFromBackend } from '@/features/portal/submit-job/api'
import type { PortalPrintJob } from '@/types/portal'

interface PaginatedJobs {
  data: Parameters<typeof mapPortalJobFromBackend>[0][]
}

interface ApiData<T> {
  data: T
}

export async function listHistoryJobs(): Promise<PortalPrintJob[]> {
  const response = await api.get<PaginatedJobs>('/jobs/my?limit=100')
  return response.data.map(mapPortalJobFromBackend)
}

export async function cancelHistoryJob(jobId: string) {
  const response = await api.post<ApiData<Parameters<typeof mapPortalJobFromBackend>[0]>>(`/jobs/${jobId}/cancel`)
  return mapPortalJobFromBackend(response.data)
}
