import type { VercelRequest, VercelResponse } from '@vercel/node';
import { updateRecord, TABLES, FIELDS } from './_airtable.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { id, name, password, branch, role } = req.body as Record<string, string>;
  const fields: Record<string, unknown> = {};
  if (name) fields[FIELDS.employees.name] = name;
  if (password) fields[FIELDS.employees.password] = Number(password) || password;
  if (branch !== undefined) fields[FIELDS.employees.branch] = branch;
  if (role !== undefined) fields[FIELDS.employees.role] = role;
  await updateRecord(TABLES.employees, id, fields);
  return res.json({ success: true });
}
