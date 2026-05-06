# Backend

TypeScript/Express backend for the Print Management System MVP.

Current scope:

- Run PostgreSQL migrations and seed MVP development records.
- Serve DB-backed `/api` routes for auth, portal jobs/history/dashboard, admin management, technician views, logs, groups, queues, printers, alerts, and dashboard data.
- Accept PDF uploads through `POST /api/jobs`.
- Save uploaded files outside PostgreSQL and store metadata in the database.
- Keep printer delivery behind connector boundaries.
- Prioritize the HP PJL stored/private job workflow.
- Keep Windows queue/Sumatra and raw socket only as fallback diagnostics/proof-of-concepts.

The app now exposes a stored-job release workflow. `POST /api/jobs/:id/store-on-device` sends a held PDF to HP device memory with a generated PIN; the user releases it from the printer panel. This still needs manual VM/printer verification after deployment.

## Setup

Install dependencies:

```bash
cd backend
npm install
```

Create local env:

```bash
cp .env.example .env
```

Start the local PostgreSQL database with Docker:

```bash
docker compose up -d postgres
```

Or point `DATABASE_URL` at an existing Postgres instance.

If `npm run db:migrate` fails with `ECONNREFUSED 127.0.0.1:5432` or `ECONNREFUSED ::1:5432`, Postgres is not running at the configured `DATABASE_URL`. On local dev, start Docker Desktop first, then run:

```bash
cd backend
docker compose up -d postgres
docker compose ps
npm run db:migrate
```

Run migrations:

```bash
npm run db:migrate
```

Install Ghostscript if needed:

```bash
brew install ghostscript
```

Run the backend:

```bash
npm run dev
```

## CORS During Local Development

The browser treats these as different origins:

```text
http://localhost:5173
http://127.0.0.1:5173
```

If the frontend shows `NetworkError when attempting to fetch resource` and the network tab mentions CORS, make sure `FRONTEND_ORIGIN` includes the exact frontend URL. The default includes both local Vite origins. If you override it in `.env`, use a comma-separated list:

```env
FRONTEND_ORIGIN=http://localhost:5173,http://127.0.0.1:5173
```

## Direct Print Test

This is a legacy proof-of-concept path. Use the Windows queue connector for current MVP workflow testing when possible.

Use the temporary dev endpoint:

```bash
curl -F "file=@/Users/mar5/Downloads/TestPrinter 2/SWE363_TestPrinter.pdf" \
  http://localhost:4000/dev/print-direct
```

Expected result:

```json
{
  "jobId": "...",
  "status": "sent_to_printer"
}
```

## Architecture Note

The `/dev/print-direct` endpoint is intentionally temporary. The reusable part is the connector pipeline:

```text
PDF file path
-> GhostscriptPdfConverter
-> RawSocketPrintConnector
-> printer
```

Later, the real flow should call the same connector from `POST /jobs/{id}/release` after auth, quota, queue, file retention, and audit logging are implemented.

## Windows Connector Spike

The connector process supports both the current HP PJL stored-job path and the fallback Windows queue path. It is split into two pieces:

- Main backend diagnostic route: `POST /dev/print-windows-queue`
- Windows-side connector process: `npm run dev:windows-connector`

These are separate processes by design. The main backend owns application concerns such as jobs, users, quotas, database writes, release decisions, and audit logs. The Windows connector owns only printer delivery close to the Windows queue and driver. During development the main backend can run on a Mac while the connector runs on `PRINTSOL-STU1`.

Current portal option policy:

- Page count is inferred from the uploaded PDF by the backend.
- Copy count is sent to the HP PJL connector as `QTY` for the stored-job path.
- Color, duplex, and paper type stay hidden in the portal until the connector can enforce them through queue defaults, separate queues, HP PJL/PCL/PostScript, PrintTicket/.NET, or another reliable printing path.

The connector is intended to run on `PRINTSOL-STU1`, close to the local Windows queue:

```text
HP-M830-22-339
```

The shared queue path recorded for app/database metadata is:

```text
\\PRINTSOL-STU1\HP-M830-22-339
```

### Run The Connector On Windows

Install dependencies in `backend/`, create `.env`, and set the Windows connector values:

```env
WINDOWS_CONNECTOR_PORT=4100
WINDOWS_PRINT_QUEUE_TARGET=HP-M830-22-339
WINDOWS_PRINT_QUEUE_SHARE=\\PRINTSOL-STU1\HP-M830-22-339
WINDOWS_PRINT_MODE=sumatra
SUMATRA_PDF_PATH=C:\Program Files\SumatraPDF\SumatraPDF.exe
WINDOWS_PRINT_CONNECTOR_TOKEN=
```

Install SumatraPDF on the VM for the first spike, then start:

```powershell
npm run dev:windows-connector
```

Health check:

```powershell
curl http://localhost:4100/health
```

HP PJL stored-job diagnostic from the VM:

```powershell
Invoke-WebRequest `
  -Uri http://localhost:4100/diagnostics/pjl-stored-job `
  -Method Post `
  -ContentType application/json `
  -Body '{}'
```

Expected printer result:

```text
Retrieve from Device Memory
-> folder PRINTSOL_TEST
-> job PJL_STORE_001
-> PIN 1234
```

Direct connector test from the VM:

```powershell
curl.exe -F "file=@C:\Path\To\sample.pdf" http://localhost:4100/print
```

On Windows Server 2012 R2, `curl.exe` may not exist and PowerShell aliases `curl` to `Invoke-WebRequest`. Use the raw PDF endpoint instead:

```powershell
Invoke-WebRequest `
  -Uri http://localhost:4100/print-file `
  -Method Post `
  -InFile C:\Path\To\sample.pdf `
  -ContentType application/pdf
```

### Test Through The Main Backend

Point the main backend at the connector:

```env
WINDOWS_PRINT_CONNECTOR_URL=http://PRINTSOL-STU1:4100
WINDOWS_PRINT_QUEUE_TARGET=HP-M830-22-339
```

Then submit a PDF through the backend:

```bash
curl -F "file=@/Users/mar5/Downloads/TestPrinter 2/SWE363_TestPrinter.pdf" \
  http://localhost:4000/dev/print-windows-queue
```

Expected result:

```json
{
  "status": "queued",
  "printerName": "HP-M830-22-339"
}
```

For the current spike, `status: "queued"` means the connector accepted the PDF and submitted it to SumatraPDF / the Windows queue. A successful response may include fields such as `jobId`, `uploadedPath`, `command`, `stdout`, `stderr`, `queuedAt`, and `connectorUrl`. This is enough to prove connector-to-queue submission, but it is not final device completion telemetry.

Use a connector token and a Windows Firewall rule before exposing this beyond a trusted test network.

Known successful experiment:

```text
Mac backend
-> POST /dev/print-windows-queue
-> Windows connector on PRINTSOL-STU1:4100
-> SumatraPDF
-> HP-M830-22-339 Windows queue
-> HP M830 printer
```

Known target experiment for the current product path:

```text
Main backend
-> POST /api/jobs/:id/store-on-device
-> Windows connector on PRINTSOL-STU1:4100
-> Ghostscript PDF-to-PostScript
-> HP PJL stored/private job wrapper
-> HP MFP M830 port 9100
-> Retrieve from Device Memory with generated PIN
```

## Database

Migrations live in [`migrations/`](/Users/mar5/vscode/print-management-system/backend/migrations).

The backend uses plain SQL migrations with `pg`; there is no ORM. Later migrations add DB auth, logs, groups, operational demo data, alert acknowledgement, and the current HP-PJL-stored-job connector preference.
