import path from 'node:path'
import { fileURLToPath } from 'node:url'
import 'dotenv/config'
import { z } from 'zod'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const backendRoot = path.resolve(__dirname, '..')

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  FRONTEND_ORIGIN: z.string().default('http://localhost:5173'),
  DATABASE_URL: z.string().default('postgres://postgres:postgres@localhost:5432/print_management'),
  PRINTER_HOST: z.string().default('10.22.114.241'),
  PRINTER_PORT: z.coerce.number().int().positive().default(9100),
  WINDOWS_PRINT_QUEUE_TARGET: z.string().default('HP-M830-22-339'),
  WINDOWS_PRINT_QUEUE_SHARE: z.string().default('\\\\PRINTSOL-STU1\\HP-M830-22-339'),
  WINDOWS_PRINT_CONNECTOR_URL: z.string().url().default('http://localhost:4100'),
  WINDOWS_PRINT_CONNECTOR_TOKEN: z.string().default(''),
  WINDOWS_CONNECTOR_PORT: z.coerce.number().int().positive().default(4100),
  WINDOWS_CONNECTOR_UPLOAD_DIR: z.string().default('storage/windows-connector/uploads'),
  WINDOWS_PRINT_MODE: z.enum(['sumatra', 'powershell', 'command']).default('sumatra'),
  SUMATRA_PDF_PATH: z.string().default('C:\\Program Files\\SumatraPDF\\SumatraPDF.exe'),
  WINDOWS_PRINT_COMMAND: z.string().default(''),
  WINDOWS_PRINT_TIMEOUT_MS: z.coerce.number().int().positive().default(60_000),
  JWT_SECRET: z.string().default('dev-only-change-me'),
  GHOSTSCRIPT_BIN: z.string().default('gs'),
  UPLOAD_DIR: z.string().default('storage/uploads'),
  CONVERTED_DIR: z.string().default('storage/converted'),
  MIGRATIONS_DIR: z.string().default('migrations'),
})

const env = envSchema.parse(process.env)

function resolveBackendPath(value: string) {
  return path.isAbsolute(value) ? value : path.resolve(backendRoot, value)
}

export const config = {
  port: env.PORT,
  frontendOrigins: env.FRONTEND_ORIGIN.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  databaseUrl: env.DATABASE_URL,
  printer: {
    host: env.PRINTER_HOST,
    port: env.PRINTER_PORT,
  },
  windowsPrintQueue: {
    target: env.WINDOWS_PRINT_QUEUE_TARGET,
    share: env.WINDOWS_PRINT_QUEUE_SHARE,
  },
  windowsConnector: {
    port: env.WINDOWS_CONNECTOR_PORT,
    url: env.WINDOWS_PRINT_CONNECTOR_URL,
    token: env.WINDOWS_PRINT_CONNECTOR_TOKEN,
    uploadDir: resolveBackendPath(env.WINDOWS_CONNECTOR_UPLOAD_DIR),
    printMode: env.WINDOWS_PRINT_MODE,
    sumatraPdfPath: env.SUMATRA_PDF_PATH,
    printCommand: env.WINDOWS_PRINT_COMMAND,
    printTimeoutMs: env.WINDOWS_PRINT_TIMEOUT_MS,
  },
  jwtSecret: env.JWT_SECRET,
  ghostscriptBin: env.GHOSTSCRIPT_BIN,
  uploadDir: resolveBackendPath(env.UPLOAD_DIR),
  convertedDir: resolveBackendPath(env.CONVERTED_DIR),
  migrationsDir: resolveBackendPath(env.MIGRATIONS_DIR),
}
