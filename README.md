# Print Management System
 
A university print management system being built as an in-house replacement for PaperCut. The project covers secure pull printing, page-quota enforcement, printer and queue management, role-based access (admin / technician / standard user), per-job audit history, and admin/technician dashboards.

 
## Table of Contents
 
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Print Job Lifecycle](#print-job-lifecycle)
- [Roles and Authorization](#roles-and-authorization)
- [Backend Setup](#backend-setup)
- [Frontend Setup](#frontend-setup)
- [API Reference](#api-reference)
- [Database](#database)
- [Environment Variables](#environment-variables)
- [Notes and Caveats](#notes-and-caveats)
- [Team](#team)
## Architecture
 
```text
                ┌─────────────────┐
                │   React Front   │  Vite + Tailwind + Radix UI
                │   (frontend/)   │  Portal / Admin / Technician
                └────────┬────────┘
                         │ HTTP + JWT (Bearer)
                         ▼
                ┌─────────────────┐
                │  Express API    │  /api/* application routes
                │   (backend/)    │  /dev/*  development helpers
                └────────┬────────┘
            ┌────────────┼─────────────┐
            ▼            ▼             ▼
   ┌──────────────┐ ┌──────────┐ ┌──────────────┐
   │  PostgreSQL  │ │ File     │ │ Print        │
   │  (jobs,      │ │ storage  │ │ Delivery     │
   │   users,     │ │ uploads/ │ │ Pipeline     │
   │   quotas,    │ │ converted│ │ Ghostscript  │
   │   audit)     │ │          │ │ + raw socket │
   └──────────────┘ └──────────┘ └──────┬───────┘
                                        ▼
                                 ┌──────────────┐
                                 │  HP printer  │
                                 │   port 9100  │
                                 └──────────────┘
```
 
The backend is the system of record. The frontend is presentation only. The print delivery pipeline is intentionally a small, replaceable module (`PrintDeliveryService`) so that future connectors (IPP, vendor APIs, on-device authentication) can be added without changing the job lifecycle.
 
## Tech Stack
 
**Backend**
- Node.js 20+ with TypeScript (ESM)
- Express 5
- PostgreSQL 16 (raw SQL via `pg`, no ORM)
- Multer for PDF uploads
- Zod for request validation
- Hand-rolled HS256 JWT (`node:crypto`)
- scrypt password hashing
- Ghostscript (external binary) for PDF → PostScript conversion
- Raw TCP socket (`node:net`) to printer port 9100
**Frontend**
- React 19 + TypeScript
- Vite
- Tailwind CSS 4
- Radix UI primitives
- React Router 7
- Framer Motion, Lucide icons, Sonner toasts
## Project Structure
 
```text
print-management-system/
├── backend/                          # Node.js + TypeScript API
│   ├── src/
│   │   ├── server.ts                 # Express entry point
│   │   ├── config.ts                 # Zod-validated env config
│   │   ├── db/
│   │   │   ├── client.ts             # pg pool, query() and transaction() helpers
│   │   │   ├── migrations/           # SQL migrations (run.ts)
│   │   │   └── seed.ts               # Dev seed data
│   │   ├── routes/                   # Express routers (one per resource)
│   │   ├── services/                 # Business logic + print delivery
│   │   ├── middleware/               # auth, validate, error-handler
│   │   ├── lib/                      # jwt, errors, response helpers
│   │   └── types/                    # Shared DB and API types
│   ├── docker-compose.yml            # Local Postgres
│   ├── example.env
│   └── package.json
│
├── frontend/                         # React + Vite SPA
│   └── src/
│       ├── app/                      # Shell layouts and router
│       ├── features/
│       │   ├── admin/                # Admin screens
│       │   ├── portal/               # Student / faculty screens
│       │   └── technician/           # Technician screens
│       ├── components/               # Shared UI
│       ├── lib/                      # Utilities
│       └── mocks/                    # Mock data store
│
├── SSO Test 1.py                     # Standalone MSAL/Azure SSO experiment
├── requirements.txt                  # Python deps for the SSO experiment
└── README.md
```
 
## Print Job Lifecycle
 
The backend implements **secure pull printing**: a job is held at the server until the user explicitly releases it. Quota is checked on submit and only deducted on successful release.
 
```text
   submit                release                  deliver
PDF ───────► held ──────────────► sent_to_printer ──────► HP M830
              │                          │
              │ cancel                   │ failure
              ▼                          ▼
          cancelled                    failed
```
 
1. **Submit** (`POST /api/jobs`)
   - Multer stores the PDF on disk under `UPLOAD_DIR` with a UUID filename.
   - The user's default queue is resolved.
   - Quota is checked: `allocated − used − reserved ≥ pages × copies`.
   - The job is inserted with status `held` and an `expires_at` based on the queue's `retention_hours`.
   - File metadata (path, hash, size, mime) goes into `job_files`.
   - A `submitted` event is appended to `print_job_events`.
2. **Release** (`POST /api/jobs/:id/release`)
   - The job's printer is selected from `queue_printers` (primary first).
   - `PrintDeliveryService.deliverPdf()` runs Ghostscript (`-sDEVICE=ps2write`) to produce a `.ps` file in `CONVERTED_DIR`.
   - `RawSocketPrintConnector` streams the PostScript bytes plus a `0x04` end-of-job byte to the printer's host:port (default `9100`).
   - The job is updated to `sent_to_printer`, the converted file is recorded, the user's `used_pages` quota is incremented, and a `released` event is logged — all in one transaction.
   - On failure, the job moves to `failed`, a reason is recorded, and a `failed` event is logged.
3. **Cancel** (`POST /api/jobs/:id/cancel`)
   - Only valid while the job is `held`.
## Roles and Authorization
 
Three roles, defined in the `roles` table and assigned through `user_roles` (many-to-many):
 
| Role            | Description                                                                            |
| --------------- | -------------------------------------------------------------------------------------- |
| `admin`         | Full administrative access — users, printers, queues, pricing, all jobs, all logs.    |
| `technician`    | Operational access — manage printers, view queues, suspend/reactivate users, alerts.  |
| `standard_user` | Portal access — submit, list own jobs, release/cancel own jobs.                       |
 
Authentication is JWT-based. `authenticate` middleware reads the `Authorization: Bearer <token>` header, verifies the HS256 signature against `JWT_SECRET`, and attaches the decoded user to `req.user`. `requireRole(...roles)` then enforces role-level access on individual routes. `standard_user` requests for `/api/jobs` are automatically scoped to their own `user_id`.
 
Every login attempt — success or failure — is recorded in `auth_logs` with the source IP. Logging failures are swallowed so a logging hiccup never breaks login.
 
## Backend Setup
 
### Prerequisites
 
- Node.js 20+
- npm 10+
- Docker (for the local Postgres) **or** an existing PostgreSQL 14+ instance
- Ghostscript on the host (for PDF → PostScript conversion at release time)
  - macOS: `brew install ghostscript`
  - Ubuntu/Debian: `sudo apt install ghostscript`
### Install and configure
 
```bash
cd backend
npm install
cp example.env .env
# Edit .env — at minimum set JWT_SECRET and PRINTER_HOST for your network.
```
 
### Start Postgres
 
```bash
docker compose up -d postgres
```
 
Or point `DATABASE_URL` at an existing instance.
 
### Run migrations and seed
 
Migrations live in `backend/src/db/migrations/` and are tracked in a `_migrations` table; previously applied files are skipped automatically.
 
```bash
npm run db:migrate   # applies all SQL files in src/db/migrations/
npm run db:seed      # inserts dev users, departments, printers, queues
```
 
### Run the API
 
```bash
npm run dev          # tsx watch on src/server.ts → http://localhost:4000
```
 
Health check:
 
```bash
curl http://localhost:4000/health
# { "ok": true }
```
 
### Other scripts
 
```bash
npm run build        # tsc → dist/
npm start            # node dist/server.js
npm run typecheck    # tsc --noEmit
```
 
## Frontend Setup
 
### Prerequisites
 
- Node.js 20+
- npm 10+
### Run
 
```bash
cd frontend
npm install
npm run dev          # Vite dev server, default http://localhost:5173
```
 
### Build / lint
 
```bash
npm run build
npm run lint
```
 
The frontend currently runs against mock data for parts of the UI; backend wiring is being progressively connected as endpoints stabilize. See `frontend/src/mocks/` for the in-memory store.
 
### Mock authentication credentials
 
For the front-end's mock auth layer, all users use password `123456`:
 
- `admin@university.edu` (Administrator)
- `tech@university.edu` (Technician)
- `student@university.edu` (Student)
- `faculty@university.edu` (Faculty)
- `suspended@university.edu` (login blocked)
Login redirects by role:
 
- `admin` → `/admin/dashboard`
- `technician` → `/tech/dashboard`
- `standard_user` (student/faculty) → `/portal/dashboard`
### Frontend routes
 
| Path                     | Audience          |
| ------------------------ | ----------------- |
| `/sign-in`               | All               |
| `/portal/dashboard`      | Student / Faculty |
| `/portal/submit-job`     | Student / Faculty |
| `/portal/history`        | Student / Faculty |
| `/admin/dashboard`       | Admin             |
| `/admin/users`           | Admin             |
| `/admin/groups`          | Admin             |
| `/admin/printers`        | Admin             |
| `/admin/queues`          | Admin             |
| `/admin/devices`         | Admin             |
| `/admin/reports`         | Admin             |
| `/admin/options`         | Admin             |
| `/admin/logs`            | Admin             |
| `/tech/dashboard`        | Technician        |
| `/tech/users`            | Technician        |
| `/tech/printers`         | Technician        |
| `/tech/alerts`           | Technician        |
 
## API Reference
 
All `/api/*` routes require `Authorization: Bearer <token>` unless noted. Responses use a small set of helpers (`ok`, `created`, `accepted`, `noContent`, `paginated`).
 
### Auth — `/api/auth`
 
| Method | Path        | Body / Query                  | Description                                      |
| ------ | ----------- | ----------------------------- | ------------------------------------------------ |
| POST   | `/login`    | `{ credential, password }`    | Returns `{ token, user }`. Public.              |
| POST   | `/logout`   | —                             | No-op acknowledgement; client discards token.   |
| GET    | `/me`       | —                             | Current user profile.                           |
 
`credential` may be either email or username and is case-insensitive.
 
### Jobs — `/api/jobs`
 
| Method | Path                  | Roles                  | Description                                              |
| ------ | --------------------- | ---------------------- | -------------------------------------------------------- |
| GET    | `/`                   | admin, technician      | List all jobs (paginated, filterable by user/queue/status). |
| GET    | `/my`                 | any authenticated      | List the caller's own jobs.                              |
| POST   | `/`                   | any authenticated      | Submit a new job. `multipart/form-data` with `file` (PDF, ≤ 25 MB) and fields `pageCount`, `copyCount`, `colorMode`, `duplex`, `paperType`. |
| GET    | `/:id`                | any (own) / staff      | Get one job.                                             |
| GET    | `/:id/events`         | any (own) / staff      | Get the job's event timeline.                            |
| POST   | `/:id/release`        | any (own)              | Release a held job to the printer.                       |
| POST   | `/:id/cancel`         | any (own)              | Cancel a held job.                                       |
 
### Users — `/api/users`
 
| Method | Path                | Roles                  | Description                                  |
| ------ | ------------------- | ---------------------- | -------------------------------------------- |
| GET    | `/`                 | admin, technician      | List users (search/status/role filters).     |
| POST   | `/`                 | admin                  | Create user with credentials and quota.      |
| GET    | `/:id`              | any                    | Get user (`me` resolves to caller).          |
| PATCH  | `/:id`              | admin                  | Update user profile / role / department.     |
| POST   | `/:id/suspend`      | admin, technician      | Suspend account.                             |
| POST   | `/:id/reactivate`   | admin, technician      | Reactivate suspended account.                |
| PATCH  | `/:id/quota`        | admin, technician      | Update allocated pages.                      |
| DELETE | `/:id`              | admin                  | Soft-delete user.                            |
 
Technicians cannot manage admins; this is enforced in `assertTechnicianCanManageTarget`.
 
### Printers — `/api/printers`
 
| Method | Path                | Roles                  | Description                                       |
| ------ | ------------------- | ---------------------- | ------------------------------------------------- |
| GET    | `/`                 | any                    | List printers.                                    |
| POST   | `/`                 | admin                  | Register a new printer (incl. connector config).  |
| GET    | `/:id`              | any                    | Get one printer.                                  |
| PATCH  | `/:id`              | admin, technician      | Update printer.                                   |
| DELETE | `/:id`              | admin                  | Soft-delete printer.                              |
| GET    | `/:id/errors`       | admin, technician      | List recent device errors.                        |
 
`connectorType` accepts `raw_socket`, `windows_queue`, `ipp`, `hp_oxp`, or `manual`. Only `raw_socket` is implemented end-to-end at the moment.
 
### Queues — `/api/queues`
 
| Method | Path             | Roles                  | Description                              |
| ------ | ---------------- | ---------------------- | ---------------------------------------- |
| GET    | `/`              | any                    | List queues.                             |
| GET    | `/eligible/mine` | any                    | Queues the current user can submit to.   |
| POST   | `/`              | admin                  | Create queue.                            |
| GET    | `/:id`           | any                    | Get queue.                               |
| PATCH  | `/:id`           | admin                  | Update queue.                            |
| DELETE | `/:id`           | admin                  | Soft-delete queue.                       |
 
### Portal — `/api/portal`
 
Convenience aggregator for the user portal home screen.
 
| Method | Path          | Description                                        |
| ------ | ------------- | -------------------------------------------------- |
| GET    | `/profile`    | Current user profile.                              |
| GET    | `/queues`     | Queues the user is allowed to submit to.           |
| GET    | `/dashboard`  | Combined `{ profile, queues, jobs }` payload.      |
 
### Other resources
 
- `GET /api/dashboard` — admin/technician operational snapshot.
- `GET /api/alerts`, `GET /api/alerts/:id`, `POST /api/alerts/:id/acknowledge` — staff alerts.
- `GET /api/departments` — department list.
- `/api/groups` — CRUD for user groups (admin-only mutations).
### Development helpers — `/dev`
 
Not part of the production API. Used during printer-connectivity work.
 
| Method | Path                    | Description                                                                 |
| ------ | ----------------------- | --------------------------------------------------------------------------- |
| POST   | `/print-direct`         | Bypass auth/quota. Upload a PDF and send it straight to the configured printer via Ghostscript + raw socket. Useful for verifying a printer is reachable. |
 
```bash
curl -F "file=@./sample.pdf" http://localhost:4000/dev/print-direct
# { "jobId": "...", "status": "sent_to_printer", "bytesSent": 12345, ... }
```
 
## Database
 
PostgreSQL 16. Migrations live in `backend/src/db/migrations/` and are run by `npm run db:migrate`, which:
 
1. Ensures a `_migrations` tracking table exists.
2. Reads all `*.sql` files in alphabetical order.
3. Skips files already recorded in `_migrations`.
4. Applies each remaining file inside its own statement and records it.
### Current migration order
 
| File                         | Contents                                                                      |
| ---------------------------- | ----------------------------------------------------------------------------- |
| `001_create_enums.sql`       | `job_status`, `release_mode`, `device_status`, `user_role`, `color_mode` enums. |
| `002_create_core_tables.sql` | Departments, roles, users, user_roles, printers, queues, jobs, quotas, etc.  |
| `003_create_indexes.sql`     | Performance indexes on hot query paths.                                       |
| `004_create_auth_tables.sql` | `user_credentials` (password hashes, separated from `users`).                 |
 
### Core tables
 
- **users / roles / user_roles** — identity and RBAC.
- **user_credentials** — scrypt password hashes, kept separate from `users`.
- **technician_privileges** — fine-grained capability flags for technicians.
- **departments** — org grouping for users and queues.
- **printers** — physical devices with `connector_type`, `connector_target`, and JSON `connector_options` describing how to reach them.
- **print_queues / queue_printers / queue_access_rules** — many-to-many between queues and printers, plus rules for which roles/departments may submit.
- **pricing_rules** — per-queue cost-per-page by paper type and color mode.
- **print_jobs** — main job record (status, page/copy counts, color/duplex, costs, timestamps, expiry).
- **job_files** — original and converted file metadata, hashed.
- **print_job_events** — append-only event log per job (`submitted`, `released`, `failed`, `cancelled`, …).
- **device_errors / notifications** — printer error tracking and in-app alerts.
- **auth_logs / audit_logs** — security and admin-action auditing.
The full ERD is in `backend/ERD.png`.
 
### Re-seed in development
 
```bash
npm run db:seed
```
 
`seed.ts` is idempotent for the static reference data (`ON CONFLICT DO NOTHING`) and matches the front-end mock store, so the same usernames work in both worlds.
 
## Environment Variables
 
All config goes through `src/config.ts`, which validates `process.env` with Zod and applies sensible defaults. Copy `example.env` to `.env` and adjust.
 
| Variable                       | Default                                                            | Purpose                                                  |
| ------------------------------ | ------------------------------------------------------------------ | -------------------------------------------------------- |
| `PORT`                         | `4000`                                                             | Backend HTTP port.                                       |
| `FRONTEND_ORIGIN`              | `http://localhost:5173`                                            | CORS allow-list.                                         |
| `DATABASE_URL`                 | `postgres://postgres:postgres@localhost:5432/print_management`     | Postgres connection string.                              |
| `JWT_SECRET`                   | `dev-only-change-me`                                               | HS256 signing secret. **Set this in production.**        |
| `PRINTER_HOST`                 | `10.22.114.241`                                                    | Default raw-socket printer host.                         |
| `PRINTER_PORT`                 | `9100`                                                             | Default raw-socket printer port.                         |
| `GHOSTSCRIPT_BIN`              | `gs`                                                               | Ghostscript executable to invoke.                        |
| `UPLOAD_DIR`                   | `storage/uploads`                                                  | Where uploaded PDFs are stored (relative to `backend/`). |
| `CONVERTED_DIR`                | `storage/converted`                                                | Where Ghostscript writes `.ps` files.                    |
| `MIGRATIONS_DIR`               | `migrations`                                                       | Reserved for migration tooling.                          |
 
## Notes and Caveats
 
- **Pull printing only, by design.** The release endpoint is the only path that talks to a printer in the application API. Quota is reserved on submit (via the `held` status counted in the quota check) and consumed on release.
- **No "completed" feedback yet.** A job moves from `held` to `sent_to_printer` once the bytes are delivered to the device. There is no telemetry loop that confirms the page actually came out of the printer; that's a planned next step.
- **`/dev/print-direct` is for printer connectivity testing only.** It bypasses auth, quota, queues, and audit logging. It will not exist in production.
- **JWT and password crypto are hand-rolled.** This is intentional for the milestone (no external auth library), uses HS256 + scrypt + `timingSafeEqual`, and is suitable for development. Treat any production deployment as a separate hardening exercise.
- **SSO is not wired in.** `SSO Test 1.py` at the repo root is a standalone MSAL/Microsoft Graph experiment for KFUPM Azure tenancy and is not connected to the Node backend.
- **Secrets aren't committed.** Production credentials, JWT secret, and printer endpoints belong in `.env` only.
## Team
 
| Member                  | Area                              |
| ----------------------- | --------------------------------- |
| Mohammed Ammar Sohail   | Backend + embedded devices        |
| Ahmed Alnasser          | Backend + embedded devices        |
| Moaz Ahmed              | Frontend + UI/UX design           |
| Ayman Musalli           | Frontend + UI/UX design           |
 