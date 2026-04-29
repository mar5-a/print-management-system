CREATE TYPE "job_status" AS ENUM (
  'uploaded',
  'held',
  'queued',
  'blocked',
  'released',
  'printing',
  'completed',
  'failed',
  'cancelled',
  'expired'
);

CREATE TYPE "release_mode" AS ENUM (
  'secure_release',
  'immediate'
);

CREATE TYPE "device_status" AS ENUM (
  'online',
  'offline',
  'error',
  'maintenance'
);

CREATE TYPE "queue_status" AS ENUM (
  'active',
  'paused',
  'disabled'
);

CREATE TYPE "error_status" AS ENUM (
  'open',
  'acknowledged',
  'resolved'
);

CREATE TYPE "error_severity" AS ENUM (
  'info',
  'warning',
  'critical'
);

CREATE TYPE "user_role" AS ENUM (
  'admin',
  'technician',
  'standard_user'
);

CREATE TYPE "color_mode" AS ENUM (
  'black_white',
  'color'
);

CREATE TYPE "paper_type" AS ENUM (
  'standard',
  'cardstock',
  'glossy',
  'envelope'
);

CREATE TYPE "audience_type" AS ENUM (
  'students',
  'faculty',
  'staff',
  'mixed'
);

CREATE TYPE "quota_period" AS ENUM (
  'monthly',
  'semester',
  'yearly'
);

CREATE TYPE "notification_status" AS ENUM (
  'unread',
  'read',
  'archived'
);

CREATE TYPE "delivery_status" AS ENUM (
  'pending',
  'sent',
  'failed'
);

CREATE TYPE "audit_action" AS ENUM (
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

CREATE TYPE "audit_target" AS ENUM (
  'user',
  'printer',
  'queue',
  'job',
  'quota',
  'system'
);

CREATE TYPE "auth_result" AS ENUM (
  'success',
  'failed',
  'locked'
);

CREATE TYPE "access_rule_type" AS ENUM (
  'role',
  'department',
  'ad_group',
  'user'
);

CREATE TABLE "departments" (
  "id" UUID PRIMARY KEY,
  "name" "VARCHAR(255)" UNIQUE NOT NULL,
  "description" TEXT,
  "created_at" TIMESTAMP DEFAULT 'CURRENT_TIMESTAMP',
  "updated_at" TIMESTAMP DEFAULT 'CURRENT_TIMESTAMP'
);

CREATE TABLE "roles" (
  "id" UUID PRIMARY KEY,
  "name" user_role UNIQUE NOT NULL,
  "description" TEXT,
  "created_at" TIMESTAMP DEFAULT 'CURRENT_TIMESTAMP'
);

CREATE TABLE "users" (
  "id" UUID PRIMARY KEY,
  "username" "VARCHAR(255)" UNIQUE NOT NULL,
  "email" "VARCHAR(255)" UNIQUE NOT NULL,
  "display_name" "VARCHAR(255)" NOT NULL,
  "university_id" "VARCHAR(255)" UNIQUE NOT NULL,
  "department_id" UUID,
  "is_active" BOOLEAN DEFAULT true,
  "is_suspended" BOOLEAN DEFAULT false,
  "ad_object_id" "VARCHAR(255)",
  "last_synced_at" TIMESTAMP,
  "deleted_at" TIMESTAMP,
  "created_at" TIMESTAMP DEFAULT 'CURRENT_TIMESTAMP',
  "updated_at" TIMESTAMP DEFAULT 'CURRENT_TIMESTAMP'
);

CREATE TABLE "user_roles" (
  "user_id" UUID,
  "role_id" UUID,
  "assigned_at" TIMESTAMP DEFAULT 'CURRENT_TIMESTAMP',
  PRIMARY KEY ("user_id", "role_id")
);

CREATE TABLE "auth_logs" (
  "id" UUID PRIMARY KEY,
  "user_id" UUID,
  "username_attempted" "VARCHAR(255)",
  "source_ip" "VARCHAR(45)",
  "result" auth_result NOT NULL,
  "failure_reason" TEXT,
  "created_at" TIMESTAMP DEFAULT 'CURRENT_TIMESTAMP'
);

CREATE TABLE "technician_privileges" (
  "id" UUID PRIMARY KEY,
  "technician_id" UUID NOT NULL,
  "can_manage_quotas" BOOLEAN DEFAULT false,
  "can_suspend_users" BOOLEAN DEFAULT false,
  "can_view_logs" BOOLEAN DEFAULT false,
  "can_view_notifications" BOOLEAN DEFAULT false,
  "can_manage_queues" BOOLEAN DEFAULT false,
  "can_manage_printers" BOOLEAN DEFAULT false,
  "updated_by" UUID,
  "created_at" TIMESTAMP DEFAULT 'CURRENT_TIMESTAMP',
  "updated_at" TIMESTAMP DEFAULT 'CURRENT_TIMESTAMP'
);

CREATE TABLE "printers" (
  "id" UUID PRIMARY KEY,
  "name" "VARCHAR(255)" NOT NULL,
  "model" "VARCHAR(255)",
  "device_code" "VARCHAR(255)",
  "ip_address" "VARCHAR(45)",
  "location" "VARCHAR(255)",
  "status" device_status DEFAULT 'offline',
  "is_color" BOOLEAN DEFAULT true,
  "supports_duplex" BOOLEAN DEFAULT true,
  "cost_per_bw_page" "DECIMAL(10,4)" DEFAULT 0.05,
  "cost_per_color_page" "DECIMAL(10,4)" DEFAULT 0.15,
  "toner_level" INTEGER DEFAULT 100,
  "last_heartbeat" TIMESTAMP,
  "serial_number" "VARCHAR(255)",
  "service_account_username" "VARCHAR(255)",
  "credential_ref" "VARCHAR(255)",
  "notes" TEXT,
  "deleted_at" TIMESTAMP,
  "created_at" TIMESTAMP DEFAULT 'CURRENT_TIMESTAMP',
  "updated_at" TIMESTAMP DEFAULT 'CURRENT_TIMESTAMP'
);

CREATE TABLE "print_queues" (
  "id" UUID PRIMARY KEY,
  "name" "VARCHAR(255)" UNIQUE NOT NULL,
  "description" TEXT,
  "status" queue_status DEFAULT 'active',
  "enabled" BOOLEAN DEFAULT true,
  "release_mode" release_mode DEFAULT 'secure_release',
  "audience" audience_type DEFAULT 'mixed',
  "department_id" UUID,
  "retention_hours" INTEGER DEFAULT 24,
  "cost_per_page" "DECIMAL(10,4)" DEFAULT 0.05,
  "created_by" UUID,
  "deleted_at" TIMESTAMP,
  "created_at" TIMESTAMP DEFAULT 'CURRENT_TIMESTAMP',
  "updated_at" TIMESTAMP DEFAULT 'CURRENT_TIMESTAMP'
);

CREATE TABLE "queue_printers" (
  "queue_id" UUID,
  "printer_id" UUID UNIQUE,
  "is_primary" BOOLEAN DEFAULT false,
  "priority_order" INTEGER DEFAULT 0,
  "is_enabled" BOOLEAN DEFAULT true,
  PRIMARY KEY ("queue_id", "printer_id")
);

CREATE TABLE "queue_access_rules" (
  "id" UUID PRIMARY KEY,
  "queue_id" UUID NOT NULL,
  "rule_type" access_rule_type NOT NULL,
  "rule_value" "VARCHAR(255)" NOT NULL,
  "allow" BOOLEAN DEFAULT true,
  "created_at" TIMESTAMP DEFAULT 'CURRENT_TIMESTAMP',
  "updated_at" TIMESTAMP DEFAULT 'CURRENT_TIMESTAMP'
);

CREATE TABLE "user_quotas" (
  "id" UUID PRIMARY KEY,
  "user_id" UUID UNIQUE NOT NULL,
  "quota_period" quota_period DEFAULT 'monthly',
  "allocated_pages" INTEGER NOT NULL,
  "used_pages" INTEGER DEFAULT 0,
  "reserved_pages" INTEGER DEFAULT 0,
  "reset_at" TIMESTAMP,
  "updated_by" UUID,
  "created_at" TIMESTAMP DEFAULT 'CURRENT_TIMESTAMP',
  "updated_at" TIMESTAMP DEFAULT 'CURRENT_TIMESTAMP'
);

CREATE TABLE "print_jobs" (
  "id" UUID PRIMARY KEY,
  "user_id" UUID NOT NULL,
  "queue_id" UUID NOT NULL,
  "printer_id" UUID,
  "original_file_name" "VARCHAR(255)" NOT NULL,
  "stored_file_path" "VARCHAR(1024)",
  "file_hash" "VARCHAR(64)",
  "file_size_bytes" INTEGER,
  "mime_type" "VARCHAR(100)",
  "page_count" INTEGER NOT NULL,
  "copy_count" INTEGER DEFAULT 1,
  "total_pages" INTEGER NOT NULL,
  "color_mode" color_mode DEFAULT 'black_white',
  "duplex" BOOLEAN DEFAULT true,
  "paper_type" paper_type DEFAULT 'standard',
  "estimated_cost" "DECIMAL(10,4)",
  "final_cost" "DECIMAL(10,4)",
  "status" job_status DEFAULT 'uploaded',
  "submitted_at" TIMESTAMP DEFAULT 'CURRENT_TIMESTAMP',
  "released_at" TIMESTAMP,
  "printing_started_at" TIMESTAMP,
  "completed_at" TIMESTAMP,
  "expires_at" TIMESTAMP,
  "failure_reason" TEXT,
  "deleted_from_storage_at" TIMESTAMP,
  "deleted_at" TIMESTAMP,
  "created_at" TIMESTAMP DEFAULT 'CURRENT_TIMESTAMP',
  "updated_at" TIMESTAMP DEFAULT 'CURRENT_TIMESTAMP'
);

CREATE TABLE "print_job_events" (
  "id" UUID PRIMARY KEY,
  "job_id" UUID NOT NULL,
  "event_type" "VARCHAR(50)" NOT NULL,
  "details" JSONB,
  "created_at" TIMESTAMP DEFAULT 'CURRENT_TIMESTAMP'
);

CREATE TABLE "device_errors" (
  "id" UUID PRIMARY KEY,
  "printer_id" UUID NOT NULL,
  "error_code" "VARCHAR(50)",
  "severity" error_severity DEFAULT 'warning',
  "status" error_status DEFAULT 'open',
  "title" "VARCHAR(255)",
  "description" TEXT,
  "detected_at" TIMESTAMP DEFAULT 'CURRENT_TIMESTAMP',
  "resolved_at" TIMESTAMP,
  "resolved_by" UUID,
  "deleted_at" TIMESTAMP,
  "created_at" TIMESTAMP DEFAULT 'CURRENT_TIMESTAMP',
  "updated_at" TIMESTAMP DEFAULT 'CURRENT_TIMESTAMP'
);

CREATE TABLE "notifications" (
  "id" UUID PRIMARY KEY,
  "target_user_id" UUID,
  "device_error_id" UUID,
  "notification_type" "VARCHAR(100)",
  "title" "VARCHAR(255)" NOT NULL,
  "body" TEXT NOT NULL,
  "status" notification_status DEFAULT 'unread',
  "delivery_status" delivery_status DEFAULT 'pending',
  "created_at" TIMESTAMP DEFAULT 'CURRENT_TIMESTAMP',
  "read_at" TIMESTAMP,
  "deleted_at" TIMESTAMP
);

CREATE TABLE "audit_logs" (
  "id" UUID PRIMARY KEY,
  "actor_user_id" UUID,
  "actor_role" user_role,
  "action_type" audit_action NOT NULL,
  "target_type" audit_target NOT NULL,
  "target_id" "VARCHAR(255)",
  "before_state" JSONB,
  "after_state" JSONB,
  "reason" TEXT,
  "ip_address" "VARCHAR(45)",
  "created_at" TIMESTAMP DEFAULT 'CURRENT_TIMESTAMP'
);

CREATE TABLE "pricing_rules" (
  "id" UUID PRIMARY KEY,
  "queue_id" UUID,
  "color_mode" color_mode,
  "cost_per_page" "DECIMAL(10,4)" NOT NULL,
  "duplex_discount_percent" INTEGER DEFAULT 10,
  "active_from" TIMESTAMP DEFAULT 'CURRENT_TIMESTAMP',
  "active_to" TIMESTAMP,
  "created_at" TIMESTAMP DEFAULT 'CURRENT_TIMESTAMP',
  "updated_at" TIMESTAMP DEFAULT 'CURRENT_TIMESTAMP'
);

COMMENT ON COLUMN "users"."university_id" IS 'ID card number for printer authentication';

COMMENT ON COLUMN "users"."ad_object_id" IS 'Active Directory object ID';

COMMENT ON COLUMN "users"."last_synced_at" IS 'Last AD sync timestamp';

COMMENT ON COLUMN "users"."deleted_at" IS 'Soft delete';

COMMENT ON COLUMN "auth_logs"."id" IS 'Primary key';

COMMENT ON COLUMN "auth_logs"."user_id" IS 'User reference (nullable for failed attempts)';

COMMENT ON COLUMN "auth_logs"."username_attempted" IS 'Username attempted in login';

COMMENT ON COLUMN "auth_logs"."source_ip" IS 'Source IP address';

COMMENT ON COLUMN "auth_logs"."result" IS 'Authentication result';

COMMENT ON COLUMN "auth_logs"."failure_reason" IS 'Reason for failure if failed';

COMMENT ON COLUMN "technician_privileges"."technician_id" IS 'Technician user reference';

COMMENT ON COLUMN "technician_privileges"."can_manage_quotas" IS 'Can modify user quotas';

COMMENT ON COLUMN "technician_privileges"."can_suspend_users" IS 'Can suspend/unsuspend users';

COMMENT ON COLUMN "technician_privileges"."can_view_logs" IS 'Can view audit logs';

COMMENT ON COLUMN "technician_privileges"."can_view_notifications" IS 'Can view system notifications';

COMMENT ON COLUMN "technician_privileges"."can_manage_queues" IS 'Can manage print queues';

COMMENT ON COLUMN "technician_privileges"."can_manage_printers" IS 'Can manage printers';

COMMENT ON COLUMN "technician_privileges"."updated_by" IS 'Admin who last updated';

COMMENT ON COLUMN "printers"."device_code" IS 'Unique device code for hardware integration';

COMMENT ON COLUMN "printers"."service_account_username" IS 'Service account for printer communication';

COMMENT ON COLUMN "printers"."credential_ref" IS 'Reference to stored credentials';

COMMENT ON COLUMN "printers"."deleted_at" IS 'Soft delete';

COMMENT ON COLUMN "print_queues"."status" IS 'Queue operational status';

COMMENT ON COLUMN "print_queues"."deleted_at" IS 'Soft delete';

COMMENT ON COLUMN "queue_printers"."printer_id" IS 'UNIQUE - each printer in only 1 queue';

COMMENT ON COLUMN "queue_access_rules"."queue_id" IS 'Target queue';

COMMENT ON COLUMN "queue_access_rules"."rule_type" IS 'Type of access rule';

COMMENT ON COLUMN "queue_access_rules"."rule_value" IS 'Role name, department, AD group, or user ID';

COMMENT ON COLUMN "queue_access_rules"."allow" IS 'Allow or deny access';

COMMENT ON COLUMN "print_jobs"."original_file_name" IS 'Original uploaded file name';

COMMENT ON COLUMN "print_jobs"."stored_file_path" IS 'Path to stored file outside DB';

COMMENT ON COLUMN "print_jobs"."file_hash" IS 'File hash for integrity verification';

COMMENT ON COLUMN "print_jobs"."page_count" IS 'Pages per copy';

COMMENT ON COLUMN "print_jobs"."total_pages" IS 'page_count × copy_count';

COMMENT ON COLUMN "print_jobs"."deleted_at" IS 'Soft delete';

COMMENT ON COLUMN "print_job_events"."event_type" IS 'Event type from job_status';

COMMENT ON COLUMN "print_job_events"."details" IS 'Event details and metadata';

COMMENT ON COLUMN "device_errors"."status" IS 'FIXED: Error resolution status, not device status';

COMMENT ON COLUMN "device_errors"."deleted_at" IS 'Soft delete';

COMMENT ON COLUMN "notifications"."target_user_id" IS 'Nullable for role-wide notifications';

COMMENT ON COLUMN "notifications"."deleted_at" IS 'Soft delete';

COMMENT ON COLUMN "audit_logs"."actor_user_id" IS 'User who performed action';

COMMENT ON COLUMN "audit_logs"."actor_role" IS 'FIXED: Role of actor at time of action';

COMMENT ON COLUMN "audit_logs"."before_state" IS 'State before action';

COMMENT ON COLUMN "audit_logs"."after_state" IS 'State after action';

COMMENT ON COLUMN "pricing_rules"."queue_id" IS 'Nullable for global rules';

ALTER TABLE "users" ADD FOREIGN KEY ("department_id") REFERENCES "departments" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "user_roles" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "user_roles" ADD FOREIGN KEY ("role_id") REFERENCES "roles" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "auth_logs" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "technician_privileges" ADD FOREIGN KEY ("technician_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "technician_privileges" ADD FOREIGN KEY ("updated_by") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "print_queues" ADD FOREIGN KEY ("department_id") REFERENCES "departments" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "print_queues" ADD FOREIGN KEY ("created_by") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "queue_printers" ADD FOREIGN KEY ("queue_id") REFERENCES "print_queues" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "queue_printers" ADD FOREIGN KEY ("printer_id") REFERENCES "printers" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "queue_access_rules" ADD FOREIGN KEY ("queue_id") REFERENCES "print_queues" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "user_quotas" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "user_quotas" ADD FOREIGN KEY ("updated_by") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "print_jobs" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "print_jobs" ADD FOREIGN KEY ("queue_id") REFERENCES "print_queues" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "print_jobs" ADD FOREIGN KEY ("printer_id") REFERENCES "printers" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "print_job_events" ADD FOREIGN KEY ("job_id") REFERENCES "print_jobs" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "device_errors" ADD FOREIGN KEY ("printer_id") REFERENCES "printers" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "device_errors" ADD FOREIGN KEY ("resolved_by") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "notifications" ADD FOREIGN KEY ("target_user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "notifications" ADD FOREIGN KEY ("device_error_id") REFERENCES "device_errors" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "audit_logs" ADD FOREIGN KEY ("actor_user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "pricing_rules" ADD FOREIGN KEY ("queue_id") REFERENCES "print_queues" ("id") DEFERRABLE INITIALLY IMMEDIATE;
