/**
 * Seed development passwords for users created by migration 002_seed_dev_data.sql.
 * Run AFTER npm run db:migrate.
 * Sets password "123456" for all dev users using the server's scrypt hash format.
 * Run with: npm run db:seed
 */
import 'dotenv/config'
import { query, closePool } from '../db/client.js'
import { hashPassword } from '../lib/jwt.js'

async function seed() {
  console.log('🌱  Setting dev passwords...')

  const hash = hashPassword('123456')
  const result = await query(
    `INSERT INTO user_credentials (user_id, password_hash)
     SELECT id, $1 FROM users WHERE username IN ('admin.user', 'tech.user', 'student.user')
     ON CONFLICT (user_id) DO UPDATE SET password_hash = EXCLUDED.password_hash, updated_at = NOW()
     RETURNING (SELECT username FROM users WHERE id = user_credentials.user_id) AS username`,
    [hash],
  )

  for (const row of result.rows) {
    console.log(`  ✅  Password set for ${row.username}`)
  }

  console.log('\n🎉  Done! Login with password: 123456')
  console.log('     admin@university.edu  (admin)')
  console.log('     tech@university.edu   (technician)')
  console.log('     student@university.edu (student)')
  await closePool()
}

seed().catch(err => {
  console.error('❌  Seed failed:', err)
  process.exit(1)
})
