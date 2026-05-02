import { api } from '@/lib/api'
import { getCurrentPortalUserProfile } from '@/features/portal/session/api'
import { mapPortalJobFromBackend } from '@/features/portal/submit-job/api'

interface PortalDashboardResponse {
  data: {
    jobs: Parameters<typeof mapPortalJobFromBackend>[0][]
  }
}

interface JobResponse {
  data: Parameters<typeof mapPortalJobFromBackend>[0]
}

export async function getPortalDashboardSnapshot() {
  const response = await api.get<PortalDashboardResponse>('/portal/dashboard')
  const jobs = response.data.jobs.map(mapPortalJobFromBackend)

  return {
    jobs,
    profile: getCurrentPortalUserProfile(),
    weeklyUsage: buildWeeklyUsage(jobs),
  }
}

export async function cancelDashboardJob(jobId: string) {
  const response = await api.post<JobResponse>(`/jobs/${jobId}/cancel`)
  return mapPortalJobFromBackend(response.data)
}

function buildWeeklyUsage(jobs: ReturnType<typeof mapPortalJobFromBackend>[]) {
  const usage = [0, 0, 0, 0, 0, 0, 0]

  for (const job of jobs) {
    const date = new Date(job.submittedAt)
    const index = Number.isNaN(date.getTime()) ? usage.length - 1 : (date.getDay() + 6) % 7
    usage[index] += job.totalPages
  }

  return usage
}
