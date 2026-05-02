import { readdir, readFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { query } from '../client.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

async function runMigrations() {
  // Ensure tracking table exists
  await query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  const result = await query('SELECT filename FROM _migrations ORDER BY filename')
  const executed = new Set<string>(result.rows.map(r => String(r['filename'])))

  const files = (await readdir(__dirname))
    .filter(f => f.endsWith('.sql'))
    .sort()

  for (const file of files) {
    if (executed.has(file)) {
      console.log(`⏭  Skipping ${file} (already executed)`)
      continue
    }
    console.log(`⏩  Running ${file} ...`)
    const sql = await readFile(join(__dirname, file), 'utf-8')
    await query(sql)
    await query('INSERT INTO _migrations (filename) VALUES ($1)', [file])
    console.log(`✅  ${file} done`)
  }

  console.log('🎉  All migrations complete')
  process.exit(0)
}

runMigrations().catch(err => {
  console.error('❌  Migration failed:', err)
  process.exit(1)
})
