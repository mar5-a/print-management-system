-- Create ENUM types for database constraints

-- Job status lifecycle
CREATE TYPE job_status AS ENUM (
  'uploaded',
  'queued',
  'submitted',
  'held',
  'blocked',
  'released',
  'printing',
  'completed',
  'failed',
  'cancelled',
  'expired'
);

-- Release modes for printing
CREATE TYPE release_mode AS ENUM (
  'secure_release',
  'immediate'
);

-- Printer/Device status
CREATE TYPE device_status AS ENUM (
  'online',
  'offline',
  'error',
  'maintenance'
);

-- Queue status
CREATE TYPE queue_status AS ENUM (
  'active',
  'paused',
  'disabled'
);

-- Error/issue status
CREATE TYPE error_status AS ENUM (
  'open',
  'acknowledged',
  'resolved'
);

-- Authentication result
CREATE TYPE auth_result AS ENUM (
  'success',
  'failed',
  'locked'
);

-- Queue access rule type
CREATE TYPE access_rule_type AS ENUM (
  'role',
  'department',
  'ad_group',
  'user'
);

-- User roles
CREATE TYPE user_role AS ENUM (
  'admin',
  'technician',
  'standard_user'
);

-- Color modes for printing
CREATE TYPE color_mode AS ENUM (
  'black_white',
  'color'
);

-- Paper types
CREATE TYPE paper_type AS ENUM (
  'standard',
  'cardstock',
  'glossy',
  'envelope'
);

-- Audience types for queues
CREATE TYPE audience_type AS ENUM (
  'students',
  'faculty',
  'staff',
  'mixed'
);

-- Quota periods
CREATE TYPE quota_period AS ENUM (
  'monthly',
  'semester',
  'yearly'
);

-- Error severity levels
CREATE TYPE error_severity AS ENUM (
  'info',
  'warning',
  'critical'
);

-- Notification status
CREATE TYPE notification_status AS ENUM (
  'unread',
  'read',
  'archived'
);

-- Delivery status for notifications
CREATE TYPE delivery_status AS ENUM (
  'pending',
  'sent',
  'failed'
);

-- Audit action types
CREATE TYPE audit_action AS ENUM (
  'created',
  'updated',
  'deleted',
  'suspended',
  'reactivated',
  'quota_changed',
  'quota_reset',
  'job_released',
  'job_cancelled',
  'printer_disabled',
  'printer_enabled',
  'queue_created',
  'queue_deleted'
);

-- Audit target types
CREATE TYPE audit_target AS ENUM (
  'user',
  'printer',
  'queue',
  'job',
  'quota',
  'system'
);
