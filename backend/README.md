# Backend

Minimal backend for the first printer integration spike.

Current scope:

- Accept a PDF upload.
- Save the uploaded file outside the database.
- Convert the PDF to PostScript with Ghostscript.
- Send the PostScript bytes to the HP printer over raw TCP port `9100`.
- Append the PostScript end-of-job byte `0x04`.
- Return `sent_to_printer` or a failure response.

This proves direct print delivery only. It does not implement pull printing, printer-panel authentication, quota enforcement, database persistence, or reliable job completion feedback yet.

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

The endpoint is intentionally temporary. The reusable part is the connector pipeline:

```text
PDF file path
-> GhostscriptPdfConverter
-> RawSocketPrintConnector
-> printer
```

Later, the real flow should call the same connector from `POST /jobs/{id}/release` after auth, quota, queue, file retention, and audit logging are implemented.
