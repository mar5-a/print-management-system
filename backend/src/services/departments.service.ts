import { query } from '../db/client.js'

export async function listDepartments() {
  const result = await query(
    `SELECT id, department_uuid, name, code
     FROM departments
     ORDER BY name`,
  )

  return result.rows.map((row) => ({
    id: String(row.id),
    uuid: String(row.department_uuid),
    name: String(row.name),
    code: row.code ? String(row.code) : null,
  }))
}
