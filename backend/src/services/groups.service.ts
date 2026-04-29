import { query } from '../db/client.js'
import { NotFoundError, ConflictError } from '../lib/errors.js'

export async function listGroups() {
  const result = await query(
    `SELECT d.id, d.name, d.description,
            COUNT(u.id) AS user_count,
            d.created_at, d.updated_at
     FROM departments d
     LEFT JOIN users u ON u.department_id = d.id AND u.deleted_at IS NULL
     GROUP BY d.id
     ORDER BY d.name`
  )
  return result.rows
}

export async function getGroupById(id: string) {
  const result = await query(
    `SELECT d.id, d.name, d.description, d.created_at, d.updated_at,
            COUNT(u.id) AS user_count
     FROM departments d
     LEFT JOIN users u ON u.department_id = d.id AND u.deleted_at IS NULL
     WHERE d.id = $1
     GROUP BY d.id`,
    [id]
  )
  if (!result.rows[0]) throw new NotFoundError('Group')
  return result.rows[0]
}

export async function createGroup(data: { name: string; description?: string }) {
  const existing = await query('SELECT id FROM departments WHERE name = $1', [data.name])
  if (existing.rows.length) throw new ConflictError('Group name already exists')

  const result = await query(
    'INSERT INTO departments (name, description) VALUES ($1, $2) RETURNING id',
    [data.name, data.description ?? null]
  )
  return getGroupById(result.rows[0].id)
}

export async function updateGroup(id: string, data: { name?: string; description?: string }) {
  await getGroupById(id)
  const fields: string[] = []
  const params: unknown[] = []

  if (data.name) { params.push(data.name); fields.push(`name = $${params.length}`) }
  if (data.description !== undefined) { params.push(data.description); fields.push(`description = $${params.length}`) }

  if (fields.length) {
    params.push(id)
    await query(`UPDATE departments SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${params.length}`, params)
  }

  return getGroupById(id)
}

export async function deleteGroup(id: string) {
  await getGroupById(id)
  await query('DELETE FROM departments WHERE id = $1', [id])
}
