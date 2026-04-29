// ── DB row shapes (snake_case, match SQL schema) ────────────────────────────

export interface DbDepartment {
  id: string
  name: string
  description: string | null
  created_at: Date
  updated_at: Date
}

export interface DbUser {
  id: string
  username: string
  email: string
  display_name: string
  department_id: string | null
  is_active: boolean
  is_suspended: boolean
  ad_object_id: string | null
  deleted_at: Date | null
  created_at: Date
  updated_at: Date
}

export interface DbUserWithRole extends DbUser {
  role: 'admin' | 'technician' | 'standard_user'
  department_name: string | null
}

export interface DbPrinter {
  id: string
  name: string
  model: string | null
  ip_address: string | null
  location: string | null
  status: 'online' | 'offline' | 'error' | 'maintenance'
  is_color: boolean
  supports_duplex: boolean
  cost_per_bw_page: string
  cost_per_color_page: string
  toner_level: number
  last_heartbeat: Date | null
  serial_number: string | null
  notes: string | null
  deleted_at: Date | null
  created_at: Date
  updated_at: Date
}

export interface DbPrintQueue {
  id: string
  name: string
  description: string | null
  status: 'online' | 'offline' | 'error' | 'maintenance'
  enabled: boolean
  release_mode: 'secure_release' | 'immediate'
  audience: 'students' | 'faculty' | 'staff' | 'mixed'
  department_id: string | null
  retention_hours: number
  cost_per_page: string
  created_by: string | null
  deleted_at: Date | null
  created_at: Date
  updated_at: Date
}

export interface DbPrintJob {
  id: string
  user_id: string
  queue_id: string
  printer_id: string | null
  file_name: string
  file_path: string | null
  file_hash: string | null
  file_size_bytes: number | null
  mime_type: string | null
  page_count: number
  copy_count: number
  total_pages: number
  color_mode: 'black_white' | 'color'
  duplex: boolean
  paper_type: 'standard' | 'cardstock' | 'glossy' | 'envelope'
  estimated_cost: string | null
  final_cost: string | null
  status: 'submitted' | 'held' | 'released' | 'printing' | 'completed' | 'failed' | 'cancelled' | 'expired'
  submitted_at: Date
  released_at: Date | null
  printing_started_at: Date | null
  completed_at: Date | null
  expires_at: Date | null
  failure_reason: string | null
  deleted_at: Date | null
  created_at: Date
  updated_at: Date
}

export interface DbDeviceError {
  id: string
  printer_id: string
  error_code: string | null
  severity: 'info' | 'warning' | 'critical'
  status: 'online' | 'offline' | 'error' | 'maintenance'
  title: string | null
  description: string | null
  detected_at: Date
  resolved_at: Date | null
  resolved_by: string | null
  deleted_at: Date | null
  created_at: Date
  updated_at: Date
}

export interface DbUserQuota {
  id: string
  user_id: string
  quota_period: 'monthly' | 'semester' | 'yearly'
  allocated_pages: number
  used_pages: number
  reserved_pages: number
  reset_at: Date | null
  updated_by: string | null
  created_at: Date
  updated_at: Date
}

// ── JWT payload ──────────────────────────────────────────────────────────────

export interface TokenPayload {
  sub: string  // user id
  role: 'admin' | 'technician' | 'standard_user'
  iat: number
  exp: number
}

// ── Authenticated request ────────────────────────────────────────────────────

export interface AuthenticatedUser {
  id: string
  role: 'admin' | 'technician' | 'standard_user'
}

// ── Pagination ───────────────────────────────────────────────────────────────

export interface PaginationParams {
  page: number
  limit: number
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}
