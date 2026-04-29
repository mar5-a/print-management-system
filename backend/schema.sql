CREATE TYPE "job_status" AS ENUM (
  'submitted',
  'held',
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

CREATE TYPE "error_severity" AS ENUM (
  'info',
  'warning',
  'critical'
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
  "department_id" UUID,
  "is_active" BOOLEAN DEFAULT true,
  "is_suspended" BOOLEAN DEFAULT false,
  "ad_object_id" "VARCHAR(255)",
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

CREATE TABLE "printers" (
  "id" UUID PRIMARY KEY,
  "name" "VARCHAR(255)" NOT NULL,
  "model" "VARCHAR(255)",
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
  "notes" TEXT,
  "deleted_at" TIMESTAMP,
  "created_at" TIMESTAMP DEFAULT 'CURRENT_TIMESTAMP',
  "updated_at" TIMESTAMP DEFAULT 'CURRENT_TIMESTAMP'
);

CREATE TABLE "print_queues" (
  "id" UUID PRIMARY KEY,
  "name" "VARCHAR(255)" UNIQUE NOT NULL,
  "description" TEXT,
  "status" device_status DEFAULT 'online',
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
  "file_name" "VARCHAR(255)" NOT NULL,
  "file_path" "VARCHAR(1024)",
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
  "status" job_status DEFAULT 'submitted',
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
  "status" device_status DEFAULT 'online',
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

CREATE TABLE "daily_stats" (
  "id" UUID PRIMARY KEY,
  "stat_date" DATE UNIQUE NOT NULL,
  "total_jobs" INTEGER DEFAULT 0,
  "completed_jobs" INTEGER DEFAULT 0,
  "failed_jobs" INTEGER DEFAULT 0,
  "total_pages_printed" INTEGER DEFAULT 0,
  "total_cost" "DECIMAL(15,4)" DEFAULT 0,
  "avg_cost_per_job" "DECIMAL(10,4)",
  "color_pages" INTEGER DEFAULT 0,
  "bw_pages" INTEGER DEFAULT 0,
  "created_at" TIMESTAMP DEFAULT 'CURRENT_TIMESTAMP',
  "updated_at" TIMESTAMP DEFAULT 'CURRENT_TIMESTAMP'
);

ALTER TABLE "users" ADD FOREIGN KEY ("department_id") REFERENCES "departments" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "user_roles" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "user_roles" ADD FOREIGN KEY ("role_id") REFERENCES "roles" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "print_queues" ADD FOREIGN KEY ("department_id") REFERENCES "departments" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "print_queues" ADD FOREIGN KEY ("created_by") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "queue_printers" ADD FOREIGN KEY ("queue_id") REFERENCES "print_queues" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "queue_printers" ADD FOREIGN KEY ("printer_id") REFERENCES "printers" ("id") DEFERRABLE INITIALLY IMMEDIATE;

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
