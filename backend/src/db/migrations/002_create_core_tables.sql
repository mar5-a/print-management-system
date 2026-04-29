-- =============================================
-- CORE ENTITIES
-- =============================================

-- Departments
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Roles
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name user_role NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  display_name VARCHAR(255) NOT NULL,
  department_id UUID REFERENCES departments(id),
  is_active BOOLEAN DEFAULT true,
  is_suspended BOOLEAN DEFAULT false,
  ad_object_id VARCHAR(255),
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Roles (many-to-many)
CREATE TABLE user_roles (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, role_id)
);

-- =============================================
-- PRINTER & QUEUE MANAGEMENT
-- =============================================

-- Printers (Physical devices)
CREATE TABLE printers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  model VARCHAR(255),
  ip_address VARCHAR(45),
  location VARCHAR(255),
  status device_status DEFAULT 'offline',
  is_color BOOLEAN DEFAULT true,
  supports_duplex BOOLEAN DEFAULT true,
  cost_per_bw_page DECIMAL(10, 4) DEFAULT 0.05,
  cost_per_color_page DECIMAL(10, 4) DEFAULT 0.15,
  toner_level INTEGER DEFAULT 100,
  last_heartbeat TIMESTAMP,
  serial_number VARCHAR(255),
  notes TEXT,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Print Queues (Logical print destinations)
CREATE TABLE print_queues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  status device_status DEFAULT 'online',
  enabled BOOLEAN DEFAULT true,
  release_mode release_mode DEFAULT 'secure_release',
  audience audience_type DEFAULT 'mixed',
  department_id UUID REFERENCES departments(id),
  retention_hours INTEGER DEFAULT 24,
  cost_per_page DECIMAL(10, 4) DEFAULT 0.05,
  created_by UUID REFERENCES users(id),
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Queue to Printer mapping (many printers per queue, but each printer in only 1 queue)
CREATE TABLE queue_printers (
  queue_id UUID NOT NULL REFERENCES print_queues(id) ON DELETE CASCADE,
  printer_id UUID NOT NULL REFERENCES printers(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  priority_order INTEGER DEFAULT 0,
  is_enabled BOOLEAN DEFAULT true,
  PRIMARY KEY (queue_id, printer_id),
  UNIQUE (printer_id)
);

-- =============================================
-- QUOTA MANAGEMENT
-- =============================================

-- User Quotas
CREATE TABLE user_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  quota_period quota_period DEFAULT 'monthly',
  allocated_pages INTEGER NOT NULL,
  used_pages INTEGER DEFAULT 0,
  reserved_pages INTEGER DEFAULT 0,
  reset_at TIMESTAMP,
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- PRINT JOB MANAGEMENT
-- =============================================

-- Print Jobs
CREATE TABLE print_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  queue_id UUID NOT NULL REFERENCES print_queues(id),
  printer_id UUID REFERENCES printers(id),
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(1024),
  file_hash VARCHAR(64),
  file_size_bytes INTEGER,
  mime_type VARCHAR(100),
  page_count INTEGER NOT NULL,
  copy_count INTEGER DEFAULT 1,
  total_pages INTEGER NOT NULL,
  color_mode color_mode DEFAULT 'black_white',
  duplex BOOLEAN DEFAULT true,
  paper_type paper_type DEFAULT 'standard',
  estimated_cost DECIMAL(10, 4),
  final_cost DECIMAL(10, 4),
  status job_status DEFAULT 'submitted',
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  released_at TIMESTAMP,
  printing_started_at TIMESTAMP,
  completed_at TIMESTAMP,
  expires_at TIMESTAMP,
  failure_reason TEXT,
  deleted_from_storage_at TIMESTAMP,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Print Job Events (Append-only timeline)
CREATE TABLE print_job_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES print_jobs(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  details JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- ERROR & NOTIFICATION MANAGEMENT
-- =============================================

-- Device Errors
CREATE TABLE device_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  printer_id UUID NOT NULL REFERENCES printers(id) ON DELETE CASCADE,
  error_code VARCHAR(50),
  severity error_severity DEFAULT 'warning',
  status device_status DEFAULT 'online',
  title VARCHAR(255),
  description TEXT,
  detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP,
  resolved_by UUID REFERENCES users(id),
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  device_error_id UUID REFERENCES device_errors(id) ON DELETE SET NULL,
  notification_type VARCHAR(100),
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  status notification_status DEFAULT 'unread',
  delivery_status delivery_status DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP,
  deleted_at TIMESTAMP
);

-- =============================================
-- AUDIT & LOGGING
-- =============================================

-- Audit Logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action_type audit_action NOT NULL,
  target_type audit_target NOT NULL,
  target_id VARCHAR(255),
  before_state JSONB,
  after_state JSONB,
  reason TEXT,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- PRICING & CONFIGURATION
-- =============================================

-- Pricing Rules
CREATE TABLE pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id UUID REFERENCES print_queues(id) ON DELETE CASCADE,
  color_mode color_mode,
  cost_per_page DECIMAL(10, 4) NOT NULL,
  duplex_discount_percent INTEGER DEFAULT 10,
  active_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  active_to TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Daily Statistics (for analytics/reports)
CREATE TABLE daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stat_date DATE NOT NULL UNIQUE,
  total_jobs INTEGER DEFAULT 0,
  completed_jobs INTEGER DEFAULT 0,
  failed_jobs INTEGER DEFAULT 0,
  total_pages_printed INTEGER DEFAULT 0,
  total_cost DECIMAL(15, 4) DEFAULT 0,
  avg_cost_per_job DECIMAL(10, 4),
  color_pages INTEGER DEFAULT 0,
  bw_pages INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
