# Backend

Minimal backend for the first printer integration spike.

Current scope:

- Run PostgreSQL migrations and seed MVP development records.
- Accept a PDF upload.
- Save the uploaded file outside the database.
- Convert the PDF to PostScript with Ghostscript.
- Send the PostScript bytes to the HP printer over raw TCP port `9100`.
- Append the PostScript end-of-job byte `0x04`.
- Optionally forward a PDF to the Windows print connector service for Windows queue delivery.
- Return `sent_to_printer` or a failure response.

The direct print endpoint proves delivery only. It does not implement pull printing, printer-panel authentication, quota enforcement, database-backed job history, or reliable physical completion feedback yet.

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

## Direct Print Test

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

## Windows Queue Connector Spike

The Windows queue path is split into two pieces:

- Main backend diagnostic route: `POST /dev/print-windows-queue`
- Windows-side connector process: `npm run dev:windows-connector`

These are separate processes by design. The main backend owns application concerns such as jobs, users, quotas, database writes, release decisions, and audit logs. The Windows connector owns only printer delivery close to the Windows queue and driver. During development the main backend can run on a Mac while the connector runs on `PRINTSOL-STU1`.

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

## Database

Migrations live in [`migrations/`](/Users/mar5/vscode/print-management-system/backend/migrations).

Current migration order:

- `001_initial_schema.sql`: SRS-backed tables, constraints, indexes, and timestamp triggers.
- `002_seed_dev_data.sql`: dev roles, users, department, quota, student queue, HP printer, queue access rule, and pricing.

The backend uses plain SQL migrations with `pg`; there is no ORM.
