import fs from 'node:fs/promises'
import path from 'node:path'
import { config } from '../config.js'
import { closeDatabasePool, pool } from './pool.js'

interface AppliedMigration {
  version: string
}

function parseVersion(fileName: string) {
  const [version] = fileName.split('_')

  if (!version) {
    throw new Error(`Migration file ${fileName} must start with a version prefix.`)
  }

  return version
}

async function ensureMigrationsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version VARCHAR(64) PRIMARY KEY,
      file_name TEXT NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
}

async function listMigrationFiles() {
  const entries = await fs.readdir(config.migrationsDir, { withFileTypes: true })

  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.sql'))
    .map((entry) => entry.name)
    .sort()
}

async function getAppliedMigrationVersions() {
  const result = await pool.query<AppliedMigration>('SELECT version FROM schema_migrations')
  return new Set(result.rows.map((row) => row.version))
}

async function applyMigration(fileName: string) {
  const version = parseVersion(fileName)
  const filePath = path.join(config.migrationsDir, fileName)
  const sql = await fs.readFile(filePath, 'utf8')
  const client = await pool.connect()

  try {
    await client.query('BEGIN')
    await client.query(sql)
    await client.query(
      'INSERT INTO schema_migrations (version, file_name) VALUES ($1, $2)',
      [version, fileName],
    )
    await client.query('COMMIT')
    console.log(`Applied migration ${fileName}`)
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

async function runMigrations() {
  await ensureMigrationsTable()

  const files = await listMigrationFiles()
  const appliedVersions = await getAppliedMigrationVersions()
  let appliedCount = 0

  for (const fileName of files) {
    const version = parseVersion(fileName)

    if (appliedVersions.has(version)) {
      console.log(`Skipping migration ${fileName}`)
      continue
    }

    await applyMigration(fileName)
    appliedCount += 1
  }

  console.log(appliedCount === 0 ? 'Database is already up to date.' : `Applied ${appliedCount} migration(s).`)
}

runMigrations()
  .catch((error: unknown) => {
    if (error instanceof Error && error.message) {
      console.error(error.message)
    } else {
      console.error(error)
    }

    process.exitCode = 1
  })
  .finally(async () => {
    await closeDatabasePool()
  })
