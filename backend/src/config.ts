import path from 'node:path'
import { fileURLToPath } from 'node:url'
import 'dotenv/config'
import { z } from 'zod'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const backendRoot = path.resolve(__dirname, '..')

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  FRONTEND_ORIGIN: z.string().default('http://localhost:5173'),
  PRINTER_HOST: z.string().default('10.22.114.241'),
  PRINTER_PORT: z.coerce.number().int().positive().default(9100),
  GHOSTSCRIPT_BIN: z.string().default('gs'),
  UPLOAD_DIR: z.string().default('storage/uploads'),
  CONVERTED_DIR: z.string().default('storage/converted'),
})

const env = envSchema.parse(process.env)

function resolveBackendPath(value: string) {
  return path.isAbsolute(value) ? value : path.resolve(backendRoot, value)
}

export const config = {
  port: env.PORT,
  frontendOrigin: env.FRONTEND_ORIGIN,
  printer: {
    host: env.PRINTER_HOST,
    port: env.PRINTER_PORT,
  },
  ghostscriptBin: env.GHOSTSCRIPT_BIN,
  uploadDir: resolveBackendPath(env.UPLOAD_DIR),
  convertedDir: resolveBackendPath(env.CONVERTED_DIR),
}
