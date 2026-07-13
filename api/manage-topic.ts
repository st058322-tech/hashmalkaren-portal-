import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createRecord, updateRecord, TABLES, FIELDS } from './_airtable.js';

const BASE_ID = process.env.AIRTABLE_BASE_ID!;
const API_KEY = process.env.AIRTABLE_API_KEY!;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { action, id, name, description, status } = req.body as Record<string, string>;
  try {
    if (action === 'create') {
      const rec = await createRecord(TABLES.topics, {
        [FIELDS.topics.name]: name,
        [FIELDS.topics.description]: description || '',
        [FIELDS.topics.status]: status || 'פעיל',
      });
      return res.json({ id: rec.id, success: true });
    }
    if (action === 'update') {
      await updateRecord(TABLES.topics, id, {
        [FIELDS.topics.name]: name,
        [FIELDS.topics.description]: description || '',
        [FIELDS.topics.status]: status || 'פעיל',
      });
      return res.json({ success: true });
    }
    if (action === 'delete') {
      const r = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLES.topics}/${id}`, {
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
