/**
 * Seed the database with development data matching the frontend mock store.
 * Run with: npm run db:seed
 */
import 'dotenv/config'
import { query, transaction } from '../db/client.js'
import { hashPassword } from '../lib/jwt.js'

async function seed() {
  console.log('🌱  Seeding database...')

  await transaction(async (client) => {
    // ── Departments ───────────────────────────────────────────────────────────
    const deptResult = await client.query(`
      INSERT INTO departments (name, description) VALUES
        ('Computer Science',    'Computer Science department'),
        ('Data Science',        'Data Science department'),
        ('Information Systems', 'Information Systems department'),
        ('Operations',          'IT Operations and support'),
        ('Mathematics',         'Mathematics department'),
        ('Academic Affairs',    'Academic affairs and faculty management'),
        ('General Access',      'General access for students'),
        ('Project Studio',      'Project studio shared space')
      ON CONFLICT (name) DO NOTHING
      RETURNING id, name
    `)
    const deptMap: Record<string, string> = {}
    for (const r of deptResult.rows) deptMap[r.name] = r.id

    // Fill any that already existed
    const existing = await client.query('SELECT id, name FROM departments')
    for (const r of existing.rows) deptMap[r.name] = r.id

    // ── Roles ─────────────────────────────────────────────────────────────────
    await client.query(`
      INSERT INTO roles (name, description) VALUES
        ('admin',         'Full administrative access'),
        ('technician',    'Printer and user management'),
        ('standard_user', 'Regular print portal user')
      ON CONFLICT (name) DO NOTHING
    `)

    const roleResult = await client.query('SELECT id, name FROM roles')
    const roleMap: Record<string, string> = {}
    for (const r of roleResult.rows) roleMap[r.name] = r.id

    // ── Users ─────────────────────────────────────────────────────────────────
    interface SeedUser {
      username: string; email: string; displayName: string
      role: string; dept: string; quotaTotal: number; quotaUsed: number
      suspended?: boolean
    }
    const users: SeedUser[] = [
      { username: 'john.smith',    email: 'john.smith@ccm.edu.sa',    displayName: 'John Smith',    role: 'standard_user', dept: 'Computer Science',    quotaTotal: 1000, quotaUsed: 540  },
      { username: 'emma.wilson',   email: 'emma.wilson@ccm.edu.sa',   displayName: 'Emma Wilson',   role: 'standard_user', dept: 'Data Science',        quotaTotal: 1000, quotaUsed: 980, suspended: true },
      { username: 'michael.brown', email: 'michael.brown@ccm.edu.sa', displayName: 'Michael Brown', role: 'standard_user', dept: 'Information Systems',  quotaTotal: 5000, quotaUsed: 2120 },
      { username: 'sarah.tech',    email: 'sarah.tech@ccm.edu.sa',    displayName: 'Sarah Tech',    role: 'technician',    dept: 'Operations',          quotaTotal: 3000, quotaUsed: 130  },
      { username: 'david.admin',   email: 'david.admin@ccm.edu.sa',   displayName: 'David Admin',   role: 'admin',         dept: 'Operations',          quotaTotal: 10000, quotaUsed: 42  },
      { username: 'lisa.anderson', email: 'lisa.anderson@ccm.edu.sa', displayName: 'Lisa Anderson', role: 'standard_user', dept: 'Mathematics',         quotaTotal: 5000, quotaUsed: 4210 },
    ]

    const defaultHash = hashPassword('123456')
    const userIds: Record<string, string> = {}

    for (const u of users) {
      const existing = await client.query(
        'SELECT id FROM users WHERE username = $1 OR email = $2', [u.username, u.email]
      )
      if (existing.rows.length) {
        userIds[u.username] = existing.rows[0].id
        console.log(`  ⏭  User ${u.username} already exists`)
        continue
      }

      const uRes = await client.query(
        `INSERT INTO users (username, email, display_name, department_id, is_suspended)
         VALUES ($1,$2,$3,$4,$5) RETURNING id`,
        [u.username, u.email, u.displayName, deptMap[u.dept] ?? null, u.suspended ?? false]
      )
      const uid = uRes.rows[0].id
      userIds[u.username] = uid

      await client.query('INSERT INTO user_roles (user_id, role_id) VALUES ($1,$2)', [uid, roleMap[u.role]])
      await client.query('INSERT INTO user_credentials (user_id, password_hash) VALUES ($1,$2)', [uid, defaultHash])
      await client.query(
        'INSERT INTO user_quotas (user_id, allocated_pages, used_pages) VALUES ($1,$2,$3)',
        [uid, u.quotaTotal, u.quotaUsed]
      )
      console.log(`  ✅  Created user ${u.username}`)
    }

    // ── Printers ──────────────────────────────────────────────────────────────
    interface SeedPrinter {
      id: string; name: string; model: string; ipAddress: string
      location: string; status: string; isColor: boolean
      toner: number; serial: string; notes: string
    }
    const printers: SeedPrinter[] = [
      { id: 'prt-01', name: 'Printer A1', model: 'HP LaserJet Enterprise M611',   ipAddress: '10.10.1.25', location: 'Building A, Floor 1',  status: 'online',      isColor: false, toner: 82, serial: 'HP-A1-99341', notes: 'Primary student queue for B&W printing.' },
      { id: 'prt-02', name: 'Printer B2', model: 'Canon imageRUNNER DX C5840i',   ipAddress: '10.10.1.26', location: 'Building B, Floor 2',  status: 'online',      isColor: true,  toner: 46, serial: 'CA-B2-10223', notes: 'Color printer for faculty handouts.' },
      { id: 'prt-03', name: 'Printer C3', model: 'Xerox VersaLink C7130',          ipAddress: '10.10.1.27', location: 'Building C, Floor 3',  status: 'maintenance', isColor: true,  toner: 18, serial: 'XR-C3-44821', notes: 'Scheduled maintenance after paper feed alerts.' },
      { id: 'prt-04', name: 'Printer D1', model: 'Ricoh IM C3000',                ipAddress: '10.10.1.28', location: 'Library, Ground Floor', status: 'offline',     isColor: true,  toner: 0,  serial: 'RC-D1-22094', notes: 'Offline pending network switch replacement.' },
    ]

    const printerIds: Record<string, string> = {}
    for (const p of printers) {
      const ex = await client.query('SELECT id FROM printers WHERE serial_number = $1', [p.serial])
      if (ex.rows.length) { printerIds[p.id] = ex.rows[0].id; continue }

      const pRes = await client.query(
        `INSERT INTO printers (name, model, ip_address, location, status, is_color, supports_duplex, toner_level, serial_number, notes)
         VALUES ($1,$2,$3,$4,$5,$6,true,$7,$8,$9) RETURNING id`,
        [p.name, p.model, p.ipAddress, p.location, p.status, p.isColor, p.toner, p.serial, p.notes]
      )
      printerIds[p.id] = pRes.rows[0].id
      console.log(`  ✅  Created printer ${p.name}`)
    }

    // ── Queues ────────────────────────────────────────────────────────────────
    interface SeedQueue {
      name: string; description: string; status: string
      audience: string; releaseMode: string; costPerPage: number
      printers: string[]; deptKey: string; retentionHours: number
    }
    const queues: SeedQueue[] = [
      { name: 'Student Standard', description: 'Primary held queue for student B&W jobs.',          status: 'online',      audience: 'students', releaseMode: 'secure_release', costPerPage: 0.05, printers: ['prt-01'], deptKey: 'General Access',    retentionHours: 24 },
      { name: 'Faculty Color',    description: 'Faculty-facing secure release queue for color jobs.', status: 'online',      audience: 'faculty',  releaseMode: 'secure_release', costPerPage: 0.20, printers: ['prt-02'], deptKey: 'Academic Affairs',  retentionHours: 24 },
      { name: 'Project Studio',   description: 'Restricted queue for project work.',                 status: 'maintenance', audience: 'mixed',    releaseMode: 'secure_release', costPerPage: 0.14, printers: ['prt-03'], deptKey: 'Project Studio',   retentionHours: 24 },
      { name: 'Student Color',    description: 'Student color printing in the library.',             status: 'offline',     audience: 'students', releaseMode: 'secure_release', costPerPage: 0.15, printers: ['prt-04'], deptKey: 'General Access',   retentionHours: 24 },
    ]

    const queueIds: Record<string, string> = {}
    const adminId = userIds['david.admin']

    for (const q of queues) {
      const ex = await client.query('SELECT id FROM print_queues WHERE name = $1 AND deleted_at IS NULL', [q.name])
      if (ex.rows.length) { queueIds[q.name] = ex.rows[0].id; continue }

      const qRes = await client.query(
        `INSERT INTO print_queues (name, description, status, audience, release_mode, cost_per_page, department_id, retention_hours, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
        [q.name, q.description, q.status, q.audience, q.releaseMode, q.costPerPage, deptMap[q.deptKey] ?? null, q.retentionHours, adminId ?? null]
      )
      const qid = qRes.rows[0].id
      queueIds[q.name] = qid

      for (const pid of q.printers) {
        if (printerIds[pid]) {
          await client.query(
            `INSERT INTO queue_printers (queue_id, printer_id, is_primary) VALUES ($1,$2,true) ON CONFLICT DO NOTHING`,
            [qid, printerIds[pid]]
          )
        }
      }
      console.log(`  ✅  Created queue ${q.name}`)
    }

    // ── Sample device errors ──────────────────────────────────────────────────
    const prt03Id = printerIds['prt-03']
    const prt04Id = printerIds['prt-04']
    if (prt03Id) {
      const ex = await client.query('SELECT id FROM device_errors WHERE printer_id = $1 LIMIT 1', [prt03Id])
      if (!ex.rows.length) {
        await client.query(
          `INSERT INTO device_errors (printer_id, error_code, severity, title, description)
           VALUES ($1,'PAPER_FEED_ERR','critical','Paper Feed Error','Repeated paper feed failures detected. Maintenance required.')`,
          [prt03Id]
        )
        console.log('  ✅  Created device error for Printer C3')
      }
    }
    if (prt04Id) {
      const ex = await client.query('SELECT id FROM device_errors WHERE printer_id = $1 LIMIT 1', [prt04Id])
      if (!ex.rows.length) {
        await client.query(
          `INSERT INTO device_errors (printer_id, error_code, severity, title, description)
           VALUES ($1,'NETWORK_UNREACHABLE','critical','Network Unreachable','Printer offline. Network switch replacement pending.')`,
          [prt04Id]
        )
        console.log('  ✅  Created device error for Printer D1')
      }
    }
  })

  console.log('\n🎉  Seed complete!')
  process.exit(0)
}

seed().catch(err => {
  console.error('❌  Seed failed:', err)
  process.exit(1)
})
