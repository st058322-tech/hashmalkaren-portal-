import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createRecord, TABLES, FIELDS } from './_airtable';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { name, description, status } = req.body as {
    name: string;
    description?: string;
    status?: string;
  };

  const record = await createRecord(TABLES.topics, {
    [FIELDS.topics.name]: name,
    [FIELDS.topics.description]: description || '',
    [FIELDS.topics.status]: status || 'פעיל',
  });

  return res.json({ id: record.id, success: true });
}
