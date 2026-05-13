# Print Management System

Print Management System is a university-focused web application being built as an in-house replacement for PaperCut. The project targets pull printing, quota control, printer and queue management, auditability, admin visibility, and technician error handling.

The current codebase is now a full-stack MVP foundation, not only a frontend prototype. It includes a React frontend, a TypeScript/Express backend, PostgreSQL migrations, DB-backed authentication for development, job submission/history, admin management flows, technician flows, logs, queues, groups, printers, and diagnostic printer delivery paths.

## Current State

Implemented at a high level:

- DB-backed sign-in using seeded development credentials and JWT sessions.
- Standard-user portal for dashboard, job submission, job history, and cancellation of pending jobs.
- Admin pages for dashboard, users, groups, printers, queues, logs, and management workflows.
- Technician pages for dashboard, users, printers, and alert handling.
- PostgreSQL schema and migrations for users, roles, quotas, printers, queues, queue assignments, jobs, job files, job events, logs, alerts, and seeded demo data.
- HP PJL stored/private job delivery through the VM connector, with Windows queue and raw socket paths kept as diagnostics/fallbacks.

Still not implemented:

- Active Directory login and identity sync.
- Production-hardened printer-panel secure release beyond the current HP PIN-to-print spike.
- Reliable physical print completion telemetry from printers.
- Production cleanup for expired held jobs and stored files.

## Tech Stack

- Frontend: React, TypeScript, Vite, React Router, Tailwind CSS, Radix UI primitives.
- Backend: TypeScript, Express, `pg`, plain SQL migrations.
- Database: PostgreSQL.
- Print connector: HP PJL stored/private jobs, Windows queue fallback, and Ghostscript/raw TCP diagnostics.

## Project Structure

```text
print-management-system/
├── frontend/          # React frontend application
├── backend/           # Express API, migrations, print connectors
├── docs/              # Project plan, database plan, architecture notes
├── AGENTS.md          # Current shared project memory
└── README.md
```

Important frontend locations:

- `frontend/src/app/` for routing and shell layouts.
- `frontend/src/features/` for admin, portal, and technician modules.
- `frontend/src/components/` for shared and page-specific UI components.
- `frontend/src/lib/api.ts` for the backend API client.

Important backend locations:

- `backend/src/server.ts` for the main API server.
- `backend/src/routes/` for `/api` and `/dev` routes.
- `backend/src/services/` for business logic.
- `backend/src/db/` for PostgreSQL pool and migration runner.
- `backend/migrations/` for SQL migrations.

## Local Setup

Prerequisites:

- Node.js 20+ for local development.
- npm 10+.
- Docker Desktop, or another local PostgreSQL instance.
- Ghostscript if testing raw socket PDF printing.

Install dependencies:

```bash
cd backend
npm install

cd ../frontend
npm install
```

Start PostgreSQL and apply migrations:

```bash
cd backend
docker compose up -d postgres
npm run db:migrate
```

If migrations fail with `ECONNREFUSED 127.0.0.1:5432` or `ECONNREFUSED ::1:5432`, Docker/Postgres is not running. Start Docker Desktop, then rerun `docker compose up -d postgres` from `backend/`.

Start the backend:

```bash
cd backend
npm run dev
```

Start the frontend:

```bash
cd frontend
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

Open:

```text
http://127.0.0.1:5173
```

Use `127.0.0.1` instead of `localhost` if another Vite app is running locally.

If the browser shows a CORS `NetworkError`, confirm the backend allows the exact frontend origin. For local dev the default backend config allows both:

```text
http://localhost:5173
http://127.0.0.1:5173
```

If you override `FRONTEND_ORIGIN` in `backend/.env`, include every frontend origin you use, comma-separated.

## Development Credentials

All seeded development users use password:

```text
123456
```

Seeded accounts:

- `admin@university.edu`
- `tech@university.edu`
- `student@university.edu`

This is temporary DB-backed development auth. The final target is Active Directory authentication with local PostgreSQL records still owning app roles, suspensions, quotas, technician privileges, and audit history.

## API Reference

Base URL: `http://localhost:3000` (default dev port).

All `/api` routes return JSON. Authenticated routes require an `Authorization: Bearer <token>` header. Paginated endpoints return `{ data, meta: { page, limit, total } }`.

### Health

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | None | Server health check |

```bash
curl http://localhost:3000/health
# → { "ok": true }
```

---

### Auth (`/api/auth`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/login` | None | Login with credentials |
| POST | `/api/auth/dev-login` | None | Dev login (same behavior) |
| POST | `/api/auth/logout` | Bearer | Logout |
| GET | `/api/auth/me` | Bearer | Get current user profile |

**POST `/api/auth/login`**

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"credential": "admin@university.edu", "password": "123456"}'
# → { "data": { "token": "eyJhbG...", "user": { "id": 1, "email": "admin@university.edu", ... } } }
```

**POST `/api/auth/logout`**

```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer <token>"
# → { "data": { "message": "Logged out successfully" } }
```

**GET `/api/auth/me`**

```bash
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer <token>"
# → { "data": { "id": 1, "email": "admin@university.edu", "displayName": "Admin User", "roles": ["admin"], ... } }
```

---

### Portal (`/api/portal`)

All portal routes require authentication (any role).

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/portal/profile` | Bearer | Current user profile |
| GET | `/api/portal/queues` | Bearer | Queues eligible for this user |
| GET | `/api/portal/dashboard` | Bearer | Combined profile, queues, and recent jobs |

**GET `/api/portal/dashboard`**

```bash
curl http://localhost:3000/api/portal/dashboard \
  -H "Authorization: Bearer <token>"
# → { "data": { "profile": {...}, "queues": [...], "jobs": [...] } }
```

---

### Jobs (`/api/jobs`)

All jobs routes require authentication.

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/api/jobs` | Bearer | admin, technician | List all jobs (paginated) |
| GET | `/api/jobs/my` | Bearer | Any | List current user's jobs (paginated) |
| POST | `/api/jobs` | Bearer | Any | Submit a new print job (PDF upload) |
| POST | `/api/jobs/cleanup` | Bearer | admin, technician | Trigger cleanup of expired jobs |
| GET | `/api/jobs/:id` | Bearer | Any | Get job details |
| GET | `/api/jobs/:id/events` | Bearer | Any | Get job event history |
| GET | `/api/jobs/:id/device-pin` | Bearer | Any | Reveal stored-job PIN |
| POST | `/api/jobs/:id/store-on-device` | Bearer | Any | Send held job to HP device memory |
| POST | `/api/jobs/:id/release` | Bearer | Any | Release a job |
| POST | `/api/jobs/:id/cancel` | Bearer | Any | Cancel a job |

**GET `/api/jobs`** (admin/technician)

Query params: `queueId`, `status` (held|submitting_to_device_storage|stored_on_device|sent_to_printer|failed|cancelled|expired|queued|printing|completed|blocked), `userId`, `page`, `limit`.

```bash
curl "http://localhost:3000/api/jobs?status=held&page=1&limit=10" \
  -H "Authorization: Bearer <token>"
# → { "data": [...], "meta": { "page": 1, "limit": 10, "total": 42 } }
```

**GET `/api/jobs/my`**

Query params: `queueId`, `status`, `page`, `limit`.

```bash
curl "http://localhost:3000/api/jobs/my?page=1&limit=5" \
  -H "Authorization: Bearer <token>"
# → { "data": [...], "meta": { "page": 1, "limit": 5, "total": 3 } }
```

**POST `/api/jobs`** (multipart/form-data)

Form fields: `file` (PDF, required, max 25 MB), `copyCount` (integer 1–25, default 1).

```bash
curl -X POST http://localhost:3000/api/jobs \
  -H "Authorization: Bearer <token>" \
  -F "file=@/path/to/document.pdf" \
  -F "copyCount=2"
# → 201 { "data": { "id": "uuid", "status": "held", "pageCount": 5, "copyCount": 2, ... } }
```

**GET `/api/jobs/:id`**

```bash
curl http://localhost:3000/api/jobs/abc-123-uuid \
  -H "Authorization: Bearer <token>"
# → { "data": { "id": "abc-123-uuid", "status": "held", "fileName": "document.pdf", ... } }
```

**GET `/api/jobs/:id/events`**

```bash
curl http://localhost:3000/api/jobs/abc-123-uuid/events \
  -H "Authorization: Bearer <token>"
# → { "data": [{ "type": "job_created", "timestamp": "...", ... }, ...] }
```

**GET `/api/jobs/:id/device-pin`**

```bash
curl http://localhost:3000/api/jobs/abc-123-uuid/device-pin \
  -H "Authorization: Bearer <token>"
# → { "data": { "pin": "4821" } }
```

**POST `/api/jobs/:id/store-on-device`**

```bash
curl -X POST http://localhost:3000/api/jobs/abc-123-uuid/store-on-device \
  -H "Authorization: Bearer <token>"
# → 202 { "data": { "id": "abc-123-uuid", "status": "stored_on_device", ... }, "deviceRelease": { "pin": "4821", ... } }
```

**POST `/api/jobs/:id/cancel`**

```bash
curl -X POST http://localhost:3000/api/jobs/abc-123-uuid/cancel \
  -H "Authorization: Bearer <token>"
# → { "data": { "id": "abc-123-uuid", "status": "cancelled", ... } }
```

**POST `/api/jobs/cleanup`** (admin/technician)

```bash
curl -X POST http://localhost:3000/api/jobs/cleanup \
  -H "Authorization: Bearer <token>"
# → { "data": { "expiredJobs": 2, "deletedFiles": 2, "failedFiles": 0 } }
```

---

### Users (`/api/users`)

All users routes require authentication.

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/api/users` | Bearer | admin, technician | List users (paginated) |
| POST | `/api/users` | Bearer | admin, technician | Create a user |
| GET | `/api/users/groups` | Bearer | admin, technician | List all user groups |
| GET | `/api/users/:id` | Bearer | Any | Get user by ID (or `me`) |
| PATCH | `/api/users/:id` | Bearer | admin, technician | Update a user |
| POST | `/api/users/:id/suspend` | Bearer | admin, technician | Suspend a user |
| POST | `/api/users/:id/reactivate` | Bearer | admin, technician | Reactivate a suspended user |
| PATCH | `/api/users/:id/quota` | Bearer | admin, technician | Update user quota |
| DELETE | `/api/users/:id` | Bearer | admin, technician | Delete a user |

**GET `/api/users`**

Query params: `search`, `status` (active|suspended), `role` (admin|technician|standard_user|faculty), `groupName`, `page`, `limit`.

```bash
curl "http://localhost:3000/api/users?role=standard_user&page=1&limit=20" \
  -H "Authorization: Bearer <token>"
# → { "data": [...], "meta": { "page": 1, "limit": 20, "total": 15 } }
```

**POST `/api/users`**

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "email": "newuser@university.edu",
    "displayName": "New User",
    "password": "securepass",
    "role": "standard_user",
    "groupName": "CS Students",
    "allocatedPages": 500
  }'
# → 201 { "data": { "id": "uuid", "username": "newuser", "email": "newuser@university.edu", ... } }
```

**GET `/api/users/:id`**

```bash
curl http://localhost:3000/api/users/me \
  -H "Authorization: Bearer <token>"
# → { "data": { "id": "uuid", "email": "student@university.edu", "displayName": "Student User", ... } }
```

**PATCH `/api/users/:id`**

```bash
curl -X PATCH http://localhost:3000/api/users/abc-uuid \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"displayName": "Updated Name", "role": "technician"}'
# → { "data": { "id": "abc-uuid", "displayName": "Updated Name", ... } }
```

**POST `/api/users/:id/suspend`**

```bash
curl -X POST http://localhost:3000/api/users/abc-uuid/suspend \
  -H "Authorization: Bearer <token>"
# → { "data": { "message": "User suspended" } }
```

**POST `/api/users/:id/reactivate`**

```bash
curl -X POST http://localhost:3000/api/users/abc-uuid/reactivate \
  -H "Authorization: Bearer <token>"
# → { "data": { "message": "User reactivated" } }
```

**PATCH `/api/users/:id/quota`**

```bash
curl -X PATCH http://localhost:3000/api/users/abc-uuid/quota \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"allocatedPages": 1000}'
# → { "data": { "id": "abc-uuid", "allocatedPages": 1000, ... } }
```

**DELETE `/api/users/:id`**

```bash
curl -X DELETE http://localhost:3000/api/users/abc-uuid \
  -H "Authorization: Bearer <token>"
# → 204 No Content
```

---

### Printers (`/api/printers`)

All printers routes require authentication.

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/api/printers` | Bearer | admin, technician | List printers (paginated) |
| POST | `/api/printers` | Bearer | admin | Create a printer |
| GET | `/api/printers/:id` | Bearer | admin | Get printer details |
| PATCH | `/api/printers/:id` | Bearer | admin | Update a printer |
| DELETE | `/api/printers/:id` | Bearer | admin | Delete a printer |
| GET | `/api/printers/:id/errors` | Bearer | admin | Get printer error history |
| GET | `/api/printers/:id/connector-health` | Bearer | admin, technician | Check connector health |

**GET `/api/printers`**

Query params: `status` (online|offline|maintenance|disabled), `search`, `page`, `limit`.

```bash
curl "http://localhost:3000/api/printers?status=online&page=1" \
  -H "Authorization: Bearer <token>"
# → { "data": [...], "meta": { "page": 1, "limit": 20, "total": 3 } }
```

**POST `/api/printers`** (admin only)

```bash
curl -X POST http://localhost:3000/api/printers \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "HP M830 Room 22-339",
    "model": "HP MFP M830",
    "ipAddress": "10.0.1.50",
    "location": "Room 22/339",
    "status": "online",
    "releaseMode": "secure_release",
    "connectorType": "hp_pjl_stored_job",
    "connectorTarget": "10.0.1.50:9100"
  }'
# → 201 { "data": { "id": "uuid", "name": "HP M830 Room 22-339", ... } }
```

**GET `/api/printers/:id`**

```bash
curl http://localhost:3000/api/printers/printer-uuid \
  -H "Authorization: Bearer <token>"
# → { "data": { "id": "printer-uuid", "name": "HP M830 Room 22-339", "status": "online", ... } }
```

**PATCH `/api/printers/:id`**

```bash
curl -X PATCH http://localhost:3000/api/printers/printer-uuid \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"status": "maintenance", "notes": "Replacing toner"}'
# → { "data": { "id": "printer-uuid", "status": "maintenance", ... } }
```

**DELETE `/api/printers/:id`**

```bash
curl -X DELETE http://localhost:3000/api/printers/printer-uuid \
  -H "Authorization: Bearer <token>"
# → 204 No Content
```

**GET `/api/printers/:id/errors`**

```bash
curl http://localhost:3000/api/printers/printer-uuid/errors \
  -H "Authorization: Bearer <token>"
# → { "data": [{ "type": "paper_jam", "timestamp": "...", ... }, ...] }
```

**GET `/api/printers/:id/connector-health`**

```bash
curl http://localhost:3000/api/printers/printer-uuid/connector-health \
  -H "Authorization: Bearer <token>"
# → { "data": { "reachable": true, "latencyMs": 45, ... } }
```

---

### Queues (`/api/queues`)

All queues routes require authentication.

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/api/queues` | Bearer | Any | List queues (paginated) |
| GET | `/api/queues/eligible/mine` | Bearer | Any | Queues eligible for current user |
| POST | `/api/queues` | Bearer | admin | Create a queue |
| GET | `/api/queues/:id` | Bearer | Any | Get queue details |
| PATCH | `/api/queues/:id` | Bearer | admin | Update a queue |
| DELETE | `/api/queues/:id` | Bearer | admin | Delete a queue |

**GET `/api/queues`**

Query params: `status` (active|disabled|archived), `search`, `page`, `limit`.

```bash
curl "http://localhost:3000/api/queues?status=active" \
  -H "Authorization: Bearer <token>"
# → { "data": [...], "meta": { "page": 1, "limit": 20, "total": 4 } }
```

**GET `/api/queues/eligible/mine`**

```bash
curl http://localhost:3000/api/queues/eligible/mine \
  -H "Authorization: Bearer <token>"
# → { "data": [{ "id": "uuid", "name": "Student Queue", "status": "active", ... }] }
```

**POST `/api/queues`** (admin only)

```bash
curl -X POST http://localhost:3000/api/queues \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "CS Lab Queue",
    "description": "Queue for CS lab printers",
    "status": "active",
    "queueType": "student",
    "releaseMode": "secure_release",
    "retentionHours": 48,
    "printerIds": ["printer-uuid-1"],
    "allowedGroups": ["CS Students"],
    "costPerPage": 0.05
  }'
# → 201 { "data": { "id": "uuid", "name": "CS Lab Queue", ... } }
```

**PATCH `/api/queues/:id`**

```bash
curl -X PATCH http://localhost:3000/api/queues/queue-uuid \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"status": "disabled"}'
# → { "data": { "id": "queue-uuid", "status": "disabled", ... } }
```

**DELETE `/api/queues/:id`**

```bash
curl -X DELETE http://localhost:3000/api/queues/queue-uuid \
  -H "Authorization: Bearer <token>"
# → 204 No Content
```

---

### Groups (`/api/groups`)

All groups routes require authentication.

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/api/groups` | Bearer | admin, technician | List groups (paginated) |
| POST | `/api/groups` | Bearer | admin | Create a group |
| GET | `/api/groups/:id` | Bearer | admin, technician | Get group details |
| GET | `/api/groups/:id/users` | Bearer | admin, technician | List users in a group (paginated) |
| PATCH | `/api/groups/:id` | Bearer | admin | Update a group |
| DELETE | `/api/groups/:id` | Bearer | admin | Delete a group |

**GET `/api/groups`**

Query params: `search`, `page`, `limit`.

```bash
curl "http://localhost:3000/api/groups?page=1" \
  -H "Authorization: Bearer <token>"
# → { "data": [...], "meta": { "page": 1, "limit": 20, "total": 5 } }
```

**POST `/api/groups`** (admin only)

```bash
curl -X POST http://localhost:3000/api/groups \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Engineering Students",
    "description": "All engineering department students",
    "quotaPeriod": "Semester",
    "initialBalance": 500,
    "initialRestriction": false,
    "defaultForNewUsers": false
  }'
# → 201 { "data": { "id": "uuid", "name": "Engineering Students", ... } }
```

**GET `/api/groups/:id/users`**

Query params: `search`, `page`, `limit`.

```bash
curl "http://localhost:3000/api/groups/group-uuid/users?page=1" \
  -H "Authorization: Bearer <token>"
# → { "data": [...], "meta": { "page": 1, "limit": 20, "total": 12 } }
```

**PATCH `/api/groups/:id`**

```bash
curl -X PATCH http://localhost:3000/api/groups/group-uuid \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Engineering Students",
    "quotaPeriod": "Monthly",
    "initialBalance": 300,
    "initialRestriction": false,
    "defaultForNewUsers": true
  }'
# → { "data": { "id": "group-uuid", "name": "Engineering Students", ... } }
```

**DELETE `/api/groups/:id`**

```bash
curl -X DELETE http://localhost:3000/api/groups/group-uuid \
  -H "Authorization: Bearer <token>"
# → 204 No Content
```

---

### Alerts (`/api/alerts`)

All alerts routes require authentication with admin or technician role.

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/api/alerts` | Bearer | admin, technician | List alerts |
| GET | `/api/alerts/:id` | Bearer | admin, technician | Get alert details |
| POST | `/api/alerts/:id/acknowledge` | Bearer | admin, technician | Acknowledge an alert |

**GET `/api/alerts`**

Query params: `search`, `status` (active|acknowledged|all, default: all), `severity` (critical|warning|info).

```bash
curl "http://localhost:3000/api/alerts?status=active&severity=critical" \
  -H "Authorization: Bearer <token>"
# → { "data": [{ "id": "uuid", "severity": "critical", "message": "Printer offline", ... }] }
```

**GET `/api/alerts/:id`**

```bash
curl http://localhost:3000/api/alerts/alert-uuid \
  -H "Authorization: Bearer <token>"
# → { "data": { "id": "alert-uuid", "severity": "warning", "message": "Low toner", ... } }
```

**POST `/api/alerts/:id/acknowledge`**

```bash
curl -X POST http://localhost:3000/api/alerts/alert-uuid/acknowledge \
  -H "Authorization: Bearer <token>"
# → { "data": { "id": "alert-uuid", "status": "acknowledged", ... } }
```

---

### Logs (`/api/logs`)

All logs routes require authentication with admin or technician role.

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/api/logs/overview` | Bearer | admin, technician | Logs overview/summary |
| GET | `/api/logs/operational-events` | Bearer | admin, technician | Paginated operational events |

**GET `/api/logs/overview`**

Query params: `range` (day|week|month).

```bash
curl "http://localhost:3000/api/logs/overview?range=week" \
  -H "Authorization: Bearer <token>"
# → { "data": { "totalEvents": 142, "byType": {...}, ... } }
```

**GET `/api/logs/operational-events`**

Query params: `range` (day|week|month), `search`, `type`, `page`, `limit`.

```bash
curl "http://localhost:3000/api/logs/operational-events?range=day&page=1&limit=25" \
  -H "Authorization: Bearer <token>"
# → { "data": [{ "id": "...", "type": "job_submitted", "timestamp": "...", ... }] }
```

---

### Dashboard (`/api/dashboard`)

All dashboard routes require authentication with admin or technician role.

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/api/dashboard` | Bearer | admin, technician | Admin dashboard snapshot |
| GET | `/api/dashboard/technician` | Bearer | admin, technician | Technician dashboard snapshot |
| GET | `/api/dashboard/print-logs` | Bearer | admin, technician | Recent print logs (paginated) |
| GET | `/api/dashboard/print-activity` | Bearer | admin, technician | Print activity chart data |

**GET `/api/dashboard`**

```bash
curl http://localhost:3000/api/dashboard \
  -H "Authorization: Bearer <token>"
# → { "data": { "totalUsers": 45, "totalPrinters": 3, "totalJobs": 120, "activeAlerts": 2, ... } }
```

**GET `/api/dashboard/technician`**

```bash
curl http://localhost:3000/api/dashboard/technician \
  -H "Authorization: Bearer <token>"
# → { "data": { "activeAlerts": [...], "recentFailures": [...], "printerStatuses": [...], ... } }
```

**GET `/api/dashboard/print-logs`**

Query params: `search`, `status`, `device`, `page`, `limit`.

```bash
curl "http://localhost:3000/api/dashboard/print-logs?status=failed&page=1" \
  -H "Authorization: Bearer <token>"
# → { "data": [{ "jobId": "...", "user": "...", "status": "failed", ... }] }
```

**GET `/api/dashboard/print-activity`**

Query params: `range` (week|month).

```bash
curl "http://localhost:3000/api/dashboard/print-activity?range=week" \
  -H "Authorization: Bearer <token>"
# → { "data": [{ "date": "2026-05-13", "count": 28 }, ...] }
```

---

### Dev / Diagnostic Routes (`/dev`)

These routes are for hardware testing only. They should not be exposed in production.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/dev/print-direct` | None | Send PDF directly to printer via raw TCP 9100 |
| POST | `/dev/print-windows-queue` | None | Send PDF through Windows connector print queue |

**POST `/dev/print-direct`** (multipart/form-data)

```bash
curl -X POST http://localhost:3000/dev/print-direct \
  -F "file=@/path/to/test.pdf"
# → 202 { "success": true, "bytesSent": 45032, ... }
```

**POST `/dev/print-windows-queue`** (multipart/form-data)

```bash
curl -X POST http://localhost:3000/dev/print-windows-queue \
  -F "file=@/path/to/test.pdf" \
  -F "printerName=\\\\PRINTSOL-STU1\\HP-M830-22-339"
# → 202 { "success": true, ... }
```

## Print Delivery Notes

Normal product flow should go through the job lifecycle:

```text
portal/backend client -> POST /api/jobs -> held DB job -> store on device -> HP printer memory -> user enters PIN at printer
```

Diagnostic paths currently available:

- `/api/jobs/:id/store-on-device`: product path that sends a held job to HP device memory with a generated PIN.
- `/api/jobs/:id/device-pin`: secure reveal path for the stored-job PIN.
- `/dev/print-windows-queue`: forwards a PDF to the Windows connector, which submits it to a Windows print queue.
- `/dev/print-direct`: legacy proof-of-concept that converts PDF to PostScript and sends bytes directly to the HP printer over TCP port `9100`.

These paths prove connector submission. They do not prove final physical completion, toner/paper state, jam state, or printer-panel authentication.

The current product direction prioritizes HP PJL stored/private jobs with PIN release. Portal users should only see options that the active connector actually honors. Page count is inferred from the PDF by the backend, copy count is sent as PJL `QTY`, and color/duplex/paper settings should stay hidden until queue defaults, separate queues, HP PJL/PCL/PostScript, or a proper Windows PrintTicket/.NET path exists.

See `backend/README.md` for connector-specific setup and test commands.

## Validation Commands

Backend:

```bash
cd backend
npm run build
npm run typecheck
```

Frontend:

```bash
cd frontend
npm run build
npm run lint
```

Database migrations:

```bash
cd backend
npm run db:migrate
```

## Documentation

Use these documents for current project decisions:

- `AGENTS.md`: current shared project memory and constraints.
- `Print_Management_System_Final_Report.pdf`: formal Milestone 7 snapshot of implemented MVP scope, screenshots, architecture, limitations, and future work.
- `docs/project-todo.md`: execution plan and remaining work.
- `docs/backend-database-plan.md`: database requirements and design notes.
- `docs/architecture.md`: architecture boundaries and connector strategy.
- `docs/schema.sql`: reference SQL snapshot; backend migrations are the implementation source of truth.

## Team Members and Roles

- `Mohammed Ammar Sohail` - Backend + embedded/device integration.
- `Ahmed Alnasser` - Backend + embedded/device integration.
- `Moaz Ahmed` - Frontend + UI/UX design.
- `Ayman Musalli` - Frontend + UI/UX design.

## Notes

- Do not commit production credentials, VM credentials, printer passwords, or AD secrets.
- Keep uploaded and converted print files outside PostgreSQL. The database stores paths, hashes, metadata, expiry, and deletion timestamps.
- Direct raw socket printing and Windows queue submission are not the same as secure pull printing. The current secure-release spike is HP device-memory storage with PIN retrieval.
