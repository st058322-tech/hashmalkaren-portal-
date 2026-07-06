import type { VercelRequest, VercelResponse } from '@vercel/node';
import { findAll, TABLES, FIELDS, fStr } from './_airtable.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { name, password } = req.body as { name: string; password: string };

  const records = await findAll(TABLES.employees);

  const inputName = name.trim();
  const inputPass = String(password ?? '').trim();
  const emp = records.find(r =>
    fStr(r, FIELDS.employees.name).trim() === inputName &&
    String(r.fields[FIELDS.employees.password] ?? '').trim() === inputPass
  );

  if (!emp) {
    return res.json({ success: false, error: 'שם או סיסמה שגויים' });
  }

  return res.json({
    success: true,
    employee: {
      id: emp.id,
      name: fStr(emp, FIELDS.employees.name),
      branch: fStr(emp, FIELDS.employees.branch),
      role: fStr(emp, FIELDS.employees.role),
      status: fStr(emp, FIELDS.employees.status),
    },
  });
}
