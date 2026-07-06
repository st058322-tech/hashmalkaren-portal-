import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createRecord, updateRecord, TABLES, FIELDS } from './_airtable.js';

const BASE_ID = process.env.AIRTABLE_BASE_ID!;
const API_KEY = process.env.AIRTABLE_API_KEY!;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { action, id, name, password, branch, role } = req.body as Record<string, string>;

  try {
    if (action === 'create') {
      const rec = await createRecord(TABLES.employees, {
        [FIELDS.employees.name]: name,
        [FIELDS.employees.password]: Number(password) || password,
        [FIELDS.employees.branch]: branch || '',
        [FIELDS.employees.role]: role || '',
        [FIELDS.employees.status]: 'פעיל',
      });
      return res.json({ id: rec.id, success: true });
    }

    if (action === 'update') {
      const fields: Record<string, unknown> = {};
      if (name) fields[FIELDS.employees.name] = name;
      if (password) fields[FIELDS.employees.password] = Number(password) || password;
      if (branch !== undefined) fields[FIELDS.employees.branch] = branch;
      if (role !== undefined) fields[FIELDS.employees.role] = role;
      await updateRecord(TABLES.employees, id, fields);
      return res.json({ success: true });
    }

    if (action === 'delete') {
      const r = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLES.employees}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${API_KEY}` },
      });
      if (!r.ok) throw new Error(`Airtable error ${r.status}`);
      return res.json({ success: true });
    }

    return res.status(400).json({ error: 'unknown action' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ success: false, error: msg });
  }
}
