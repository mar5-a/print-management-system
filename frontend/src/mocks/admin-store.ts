import type { AdminGroup, AdminPrinter, AdminQueue, AdminUser, QueueLogEntry } from '../types/admin'

export const adminUsers: AdminUser[] = [
  {
    id: 'u20230001',
    username: 'john.smith',
    displayName: 'John Smith',
    email: 'john.smith@ccm.edu.sa',
    role: 'Student',
    office: 'CS-214',
    status: 'Active',
    quotaUsed: 540,
    quotaTotal: 1000,
    groups: ['CCM-Students', 'AI Lab'],
    cardId: 'CCM-1023-8841',
    primaryIdentity: 'JSMITH',
    secondaryIdentity: 'CCM-UG',
    notes: 'Frequent user of duplex queues for project work.',
    lastSeen: '8 minutes ago',
    jobCount: 24,
  },
  {
    id: 'u20230002',
    username: 'emma.wilson',
    displayName: 'Emma Wilson',
    email: 'emma.wilson@ccm.edu.sa',
    role: 'Student',
    office: 'DS-118',
    status: 'Suspended',
    quotaUsed: 980,
    quotaTotal: 1000,
    groups: ['CCM-Students'],
    cardId: 'CCM-1023-2204',
    primaryIdentity: 'EWILSON',
    secondaryIdentity: 'CCM-UG',
    notes: 'Suspended after repeated over-quota print attempts.',
    lastSeen: 'Yesterday',
    jobCount: 17,
  },
  {
    id: 'u20230003',
    username: 'michael.brown',
    displayName: 'Michael Brown',
    email: 'michael.brown@ccm.edu.sa',
    role: 'Faculty',
    office: 'IS-301',
    status: 'Active',
    quotaUsed: 2120,
    quotaTotal: 5000,
    groups: ['Faculty', 'IS Department'],
    cardId: 'CCM-1883-1040',
    primaryIdentity: 'MBROWN',
    secondaryIdentity: 'FAC-IS',
    notes: 'Extended quota for senior design reviews.',
    lastSeen: '21 minutes ago',
    jobCount: 51,
  },
  {
    id: 'u20230004',
    username: 'sarah.tech',
    displayName: 'Sarah Tech',
    email: 'sarah.tech@ccm.edu.sa',
    role: 'Technician',
    office: 'OPS-07',
    status: 'Active',
    quotaUsed: 130,
    quotaTotal: 3000,
    groups: ['Technicians'],
    cardId: 'CCM-9001-4480',
    primaryIdentity: 'STECH',
    secondaryIdentity: 'OPS-TECH',
    notes: 'Can manage user access and monitor printer alerts.',
    lastSeen: 'Online now',
    jobCount: 8,
  },
  {
    id: 'u20230005',
    username: 'david.admin',
    displayName: 'David Admin',
    email: 'david.admin@ccm.edu.sa',
    role: 'Administrator',
    office: 'OPS-01',
    status: 'Active',
    quotaUsed: 42,
    quotaTotal: 10000,
    groups: ['Administrators'],
    cardId: 'CCM-0001-1000',
    primaryIdentity: 'DADMIN',
    secondaryIdentity: 'OPS-ADM',
    notes: 'Primary admin for printer rollout and access policy.',
    lastSeen: 'Online now',
    jobCount: 3,
  },
  {
    id: 'u20230006',
    username: 'lisa.anderson',
    displayName: 'Lisa Anderson',
    email: 'lisa.anderson@ccm.edu.sa',
    role: 'Faculty',
    office: 'MATH-221',
    status: 'Active',
    quotaUsed: 4210,
    quotaTotal: 5000,
    groups: ['Faculty', 'Math Department'],
    cardId: 'CCM-4222-9910',
    primaryIdentity: 'LANDERSON',
    secondaryIdentity: 'FAC-MATH',
    notes: 'High-usage color prints for workshop material.',
    lastSeen: '2 hours ago',
    jobCount: 67,
  },
]

export const adminGroups: AdminGroup[] = [
  {
    id: 'grp-01',
    name: 'CCM-Students',
    description: 'Default quota and queue access for undergraduate and graduate students.',
    userCount: 1248,
    quotaPerPeriod: 1000,
    schedule: 'Monthly',
    studentRestricted: true,
    defaultForNewUsers: true,
    owner: 'Operations',
  },
  {
    id: 'grp-02',
    name: 'Faculty',
    description: 'Extended quota and wider queue access for faculty offices and labs.',
    userCount: 186,
    quotaPerPeriod: 5000,
    schedule: 'Semester',
    studentRestricted: false,
    defaultForNewUsers: false,
    owner: 'Dean Office',
  },
  {
    id: 'grp-03',
    name: 'Technicians',
    description: 'Operational access for quota changes, suspensions, and printer alerts.',
    userCount: 12,
    quotaPerPeriod: 3000,
    schedule: 'Monthly',
    studentRestricted: false,
    defaultForNewUsers: false,
    owner: 'IT Operations',
  },
  {
    id: 'grp-05',
    name: 'Administrators',
    description: 'Full administrative access for policy changes, queue controls, and protected operations.',
    userCount: 4,
    quotaPerPeriod: 10000,
    schedule: 'Monthly',
    studentRestricted: false,
    defaultForNewUsers: false,
    owner: 'IT Operations',
  },
  {
    id: 'grp-04',
    name: 'AI Lab',
    description: 'Dedicated research queue access with moderate monthly quota.',
    userCount: 63,
    quotaPerPeriod: 1500,
    schedule: 'Monthly',
    studentRestricted: false,
    defaultForNewUsers: false,
    owner: 'AI Lab',
  },
]

export const adminPrinters: AdminPrinter[] = [
  {
    id: 'prt-01',
    name: 'Printer A1',
    softwareVersion: '1.10',
    hostedOn: 'ccm-printer',
    model: 'HP LaserJet Enterprise M611',
    location: 'Room 101 - Building A',
    queue: 'Student Standard',
    deviceGroup: 'Student Devices',
    alternateId: 'A1-STU-01',
    status: 'Online',
    pendingJobs: 7,
    releasedToday: 54,
    totalPages: 0,
    totalJobs: 0,
    isColor: false,
    toner: 82,
    holdReleaseMode: 'Secure Release',
    failureMode: 'Hold until redirected',
    ipAddress: '10.10.1.25',
    serialNumber: 'HP-A1-99341',
    notes: 'Primary student queue for black-and-white document printing.',
  },
  {
    id: 'prt-02',
    name: 'Printer B2',
    softwareVersion: '1.10',
    hostedOn: 'ccm-printer',
    model: 'Canon imageRUNNER DX C5840i',
    location: 'Room 202 - Building B',
    queue: 'Faculty Color',
    deviceGroup: 'Faculty Devices',
    alternateId: 'B2-FAC-02',
    status: 'Online',
    pendingJobs: 2,
    releasedToday: 21,
    totalPages: 0,
    totalJobs: 0,
    isColor: true,
    toner: 46,
    holdReleaseMode: 'Secure Release',
    failureMode: 'Retry then notify',
    ipAddress: '10.10.1.26',
    serialNumber: 'CA-B2-10223',
    notes: 'Color printer used for faculty handouts and meeting packs.',
  },
  {
    id: 'prt-03',
    name: 'Printer C3',
    softwareVersion: '1.10',
    hostedOn: 'ccm-printer',
    model: 'Xerox VersaLink C7130',
    location: 'Room 303 - Building C',
    queue: 'Project Studio',
    deviceGroup: 'Project Studio',
    alternateId: 'C3-PRJ-03',
    status: 'Maintenance',
    pendingJobs: 5,
    releasedToday: 12,
    totalPages: 0,
    totalJobs: 0,
    isColor: true,
    toner: 18,
    holdReleaseMode: 'Secure Release',
    failureMode: 'Hold until redirected',
    ipAddress: '10.10.1.27',
    serialNumber: 'XR-C3-44821',
    notes: 'Scheduled for maintenance after repeated paper feed alerts.',
  },
  {
    id: 'prt-04',
    name: 'Printer D1',
    softwareVersion: '1.10',
    hostedOn: 'ccm-printer',
    model: 'Ricoh IM C3000',
    location: 'Room 001 - Library',
    queue: 'Student Color',
    deviceGroup: 'Library Devices',
    alternateId: 'D1-LIB-01',
    status: 'Offline',
    pendingJobs: 11,
    releasedToday: 0,
    totalPages: 0,
    totalJobs: 0,
    isColor: true,
    toner: 0,
    holdReleaseMode: 'Secure Release',
    failureMode: 'Cancel and notify',
    ipAddress: '10.10.1.28',
    serialNumber: 'RC-D1-22094',
    notes: 'Offline pending network switch replacement.',
  },
]

const queueSeedData: AdminQueue[] = [
  {
    id: 'que-01',
    name: 'Student Standard',
    description: 'Primary held queue for student black-and-white jobs across the main campus fleet.',
    hostedOn: 'ccm-print-queue-01',
    status: 'Online',
    enabled: true,
    releaseMode: 'Secure Release',
    audience: 'Students',
    department: 'General Access',
    allowedGroups: ['CCM-Students'],
    colorMode: 'Black & White',
    defaultDuplex: true,
    costPerPage: 0.05,
    printerIds: ['prt-01'],
    pendingJobs: 7,
    heldJobs: 18,
    releasedToday: 54,
    lastActivity: 'Today 09:41',
    autoDeleteAfterHours: 24,
    failureMode: 'Hold until redirected',
    notes: 'Default student queue with secure release enabled and duplex set as the default policy.',
    queueLogs: [
      {
        id: 'que-01-log-01',
        time: '2026-04-06 09:41',
        type: 'Release',
        state: 'Info',
        actor: 'system',
        message: '27 held jobs released successfully during the morning rush window.',
      },
      {
        id: 'que-01-log-02',
        time: '2026-04-06 08:52',
        type: 'Policy',
        state: 'Resolved',
        actor: 'david.admin',
        message: 'Retention policy confirmed at 24 hours for unreleased jobs.',
      },
      {
        id: 'que-01-log-03',
        time: '2026-04-06 08:16',
        type: 'Routing',
        state: 'Info',
        actor: 'system',
        message: 'Queue linked to Printer A1 after overnight service health check.',
      },
    ],
  },
  {
    id: 'que-02',
    name: 'Faculty Color',
    description: 'Faculty-facing secure release queue for color handouts, proposals, and meeting packs.',
    hostedOn: 'ccm-print-queue-02',
    status: 'Online',
    enabled: true,
    releaseMode: 'Secure Release',
    audience: 'Faculty',
    department: 'Academic Affairs',
    allowedGroups: ['Faculty'],
    colorMode: 'Color',
    defaultDuplex: true,
    costPerPage: 0.2,
    printerIds: ['prt-02'],
    pendingJobs: 2,
    heldJobs: 5,
    releasedToday: 21,
    lastActivity: 'Today 09:18',
    autoDeleteAfterHours: 24,
    failureMode: 'Retry then notify',
    notes: 'Used for color-intensive academic printing with technician review when retries exceed threshold.',
    queueLogs: [
      {
        id: 'que-02-log-01',
        time: '2026-04-06 09:18',
        type: 'Release',
        state: 'Info',
        actor: 'system',
        message: '5 faculty jobs released on Printer B2 without quota exceptions.',
      },
      {
        id: 'que-02-log-02',
        time: '2026-04-06 08:43',
        type: 'Policy',
        state: 'Info',
        actor: 'david.admin',
        message: 'Color page rate confirmed at SAR 0.20 for the spring term.',
      },
      {
        id: 'que-02-log-03',
        time: '2026-04-06 07:58',
        type: 'Routing',
        state: 'Resolved',
        actor: 'sarah.tech',
        message: 'Queue assignment revalidated after device firmware sync.',
      },
    ],
  },
  {
    id: 'que-03',
    name: 'Project Studio',
    description: 'Restricted studio queue for project work that needs manual review during printer faults.',
    hostedOn: 'ccm-print-queue-03',
    status: 'Maintenance',
    enabled: true,
    releaseMode: 'Secure Release',
    audience: 'Mixed',
    department: 'Project Studio',
    allowedGroups: ['AI Lab', 'Faculty'],
    colorMode: 'Color',
    defaultDuplex: false,
    costPerPage: 0.14,
    printerIds: ['prt-03'],
    pendingJobs: 5,
    heldJobs: 11,
    releasedToday: 12,
    lastActivity: 'Today 08:11',
    autoDeleteAfterHours: 24,
    failureMode: 'Hold until redirected',
    notes: 'Jobs remain held during maintenance so technicians can redirect work instead of discarding it.',
    queueLogs: [
      {
        id: 'que-03-log-01',
        time: '2026-04-06 08:11',
        type: 'Error',
        state: 'Open',
        actor: 'system',
        message: 'Printer C3 entered maintenance mode after repeated feed alerts.',
      },
      {
        id: 'que-03-log-02',
        time: '2026-04-06 08:09',
        type: 'Routing',
        state: 'Open',
        actor: 'sarah.tech',
        message: '11 held jobs flagged for manual redirect instead of auto-cancel.',
      },
      {
        id: 'que-03-log-03',
        time: '2026-04-05 16:27',
        type: 'Policy',
        state: 'Resolved',
        actor: 'david.admin',
        message: 'Project Studio queue kept separate from student traffic due to color budget limits.',
      },
    ],
  },
  {
    id: 'que-04',
    name: 'Student Color',
    description: 'Library-facing student color queue with higher exception volume during device outages.',
    hostedOn: 'ccm-print-queue-01',
    status: 'Offline',
    enabled: false,
    releaseMode: 'Secure Release',
    audience: 'Students',
    department: 'Library',
    allowedGroups: ['CCM-Students'],
    colorMode: 'Color',
    defaultDuplex: false,
    costPerPage: 0.12,
    printerIds: ['prt-04'],
    pendingJobs: 11,
    heldJobs: 9,
    releasedToday: 0,
    lastActivity: 'Today 07:54',
    autoDeleteAfterHours: 24,
    failureMode: 'Cancel and notify',
    notes: 'Currently disabled while Library network work is in progress. Held jobs still require admin review.',
    queueLogs: [
      {
        id: 'que-04-log-01',
        time: '2026-04-06 07:54',
        type: 'Error',
        state: 'Open',
        actor: 'system',
        message: 'Student Color disabled automatically after Printer D1 went offline.',
      },
      {
        id: 'que-04-log-02',
        time: '2026-04-06 07:51',
        type: 'Routing',
        state: 'Open',
        actor: 'system',
        message: '9 unreleased jobs kept in queue to avoid silent loss during outage.',
      },
      {
        id: 'que-04-log-03',
        time: '2026-04-05 18:22',
        type: 'Policy',
        state: 'Info',
        actor: 'david.admin',
        message: 'Library queue marked as student-only with color printing enabled.',
      },
    ],
  },
  {
    id: 'que-05',
    name: 'Staff Overflow',
    description: 'Overflow queue for staff and technician jobs when the main office printer is unavailable.',
    hostedOn: 'ccm-print-queue-04',
    status: 'Online',
    enabled: true,
    releaseMode: 'Immediate',
    audience: 'Staff',
    department: 'Operations',
    allowedGroups: ['Technicians', 'Administrators'],
    colorMode: 'Black & White',
    defaultDuplex: true,
    costPerPage: 0.04,
    printerIds: [],
    pendingJobs: 0,
    heldJobs: 0,
    releasedToday: 0,
    lastActivity: 'Yesterday 16:40',
    autoDeleteAfterHours: 24,
    failureMode: 'Retry then notify',
    notes: 'Safe candidate for deletion because no active or held jobs remain.',
    queueLogs: [
      {
        id: 'que-05-log-01',
        time: '2026-04-05 16:40',
        type: 'Routing',
        state: 'Resolved',
        actor: 'sarah.tech',
        message: 'Temporary printer link removed after office fleet stabilized.',
      },
      {
        id: 'que-05-log-02',
        time: '2026-04-05 14:05',
        type: 'Policy',
        state: 'Info',
        actor: 'david.admin',
        message: 'Queue kept available as an overflow path for operations staff.',
      },
    ],
  },
]

function cloneQueueLogEntry(entry: QueueLogEntry): QueueLogEntry {
  return { ...entry }
}

function cloneAdminQueue(queue: AdminQueue): AdminQueue {
  return {
    ...queue,
    allowedGroups: [...queue.allowedGroups],
    printerIds: [...queue.printerIds],
    queueLogs: queue.queueLogs.map(cloneQueueLogEntry),
  }
}

let adminQueuesData = queueSeedData.map(cloneAdminQueue)

function normalizeQueueAssignments(targetQueue: AdminQueue) {
  const claimedPrinterIds = new Set(targetQueue.printerIds)

  adminQueuesData = adminQueuesData.map((queue) => {
    if (queue.id === targetQueue.id) {
      return cloneAdminQueue(targetQueue)
    }

    if (claimedPrinterIds.size === 0) {
      return queue
    }

    return {
      ...queue,
      printerIds: queue.printerIds.filter((printerId) => !claimedPrinterIds.has(printerId)),
      allowedGroups: [...queue.allowedGroups],
      queueLogs: queue.queueLogs.map(cloneQueueLogEntry),
    }
  })
}

function syncPrinterQueueAssignments() {
  const assignedQueueNames = new Map<string, string>()

  adminQueuesData.forEach((queue) => {
    queue.printerIds.forEach((printerId) => {
      if (!assignedQueueNames.has(printerId)) {
        assignedQueueNames.set(printerId, queue.name)
      }
    })
  })

  adminPrinters.forEach((printer) => {
    printer.queue = assignedQueueNames.get(printer.id) ?? 'Unassigned'
  })
}

syncPrinterQueueAssignments()

export function getUserById(userId?: string) {
  return adminUsers.find((user) => user.id === userId)
}

export function getGroupById(groupId?: string) {
  return adminGroups.find((group) => group.id === groupId)
}

export function getPrinterById(printerId?: string) {
  return adminPrinters.find((printer) => printer.id === printerId)
}

export function listAdminQueues() {
  return adminQueuesData.map(cloneAdminQueue)
}

export function getQueueById(queueId?: string) {
  const queue = adminQueuesData.find((item) => item.id === queueId)
  return queue ? cloneAdminQueue(queue) : undefined
}

export function createAdminQueue(queue: AdminQueue) {
  const nextQueue = cloneAdminQueue(queue)
  adminQueuesData = [nextQueue, ...adminQueuesData]
  normalizeQueueAssignments(nextQueue)
  syncPrinterQueueAssignments()
  return cloneAdminQueue(nextQueue)
}

export function updateAdminQueue(queue: AdminQueue) {
  const index = adminQueuesData.findIndex((item) => item.id === queue.id)

  if (index === -1) {
    return undefined
  }

  normalizeQueueAssignments(queue)
  syncPrinterQueueAssignments()
  return cloneAdminQueue(adminQueuesData.find((item) => item.id === queue.id) ?? queue)
}

export function deleteAdminQueue(queueId: string) {
  const nextQueues = adminQueuesData.filter((queue) => queue.id !== queueId)

  if (nextQueues.length === adminQueuesData.length) {
    return false
  }

  adminQueuesData = nextQueues
  syncPrinterQueueAssignments()
  return true
}
