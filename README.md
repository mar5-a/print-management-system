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

## Main API Surface

The frontend uses backend routes under `/api`.

Key route groups:

- Auth: `/api/auth/*`
- Portal: `/api/portal/*`
- Jobs: `/api/jobs/*`
- Admin/technician management: `/api/users`, `/api/printers`, `/api/queues`, `/api/groups`, `/api/alerts`, `/api/logs`, `/api/dashboard`

Diagnostic print routes live under `/dev/*`. They are useful for hardware testing but should not be treated as the normal product flow.

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
