import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createRecord, TABLES, FIELDS } from './_airtable.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { name, password, branch, role } = req.body as Record<string, string>;
  const rec = await createRecord(TABLES.employees, {
    [FIELDS.employees.name]: name,
    [FIELDS.employees.password]: Number(password) || password,
    [FIELDS.employees.branch]: branch || '',
    [FIELDS.employees.role]: role || '',
    [FIELDS.employees.status]: 'פעיל',
  });
  return res.json({ id: rec.id, success: true });
}
