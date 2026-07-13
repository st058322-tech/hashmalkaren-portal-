import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createRecord, updateRecord, TABLES, FIELDS } from './_airtable.js';

const BASE_ID = process.env.AIRTABLE_BASE_ID!;
const API_KEY = process.env.AIRTABLE_API_KEY!;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { action, id, topicId, name, description, videoUrl, pdfUrl, order, required, status } = req.body as Record<string, string>;
  try {
    if (action === 'create') {
      const rec = await createRecord(TABLES.videos, {
        [FIELDS.videos.name]: name,
        [FIELDS.videos.topicId]: [topicId],
        [FIELDS.videos.description]: description || '',
        [FIELDS.videos.videoUrl]: videoUrl || '',
        [FIELDS.videos.pdfUrl]: pdfUrl || '',
        [FIELDS.videos.order]: Number(order) || 1,
        [FIELDS.videos.required]: required || 'חובה',
        [FIELDS.videos.status]: status || 'פעיל',
      });
      return res.json({ id: rec.id, success: true });
    }
    if (action === 'update') {
      await updateRecord(TABLES.videos, id, {
        [FIELDS.videos.name]: name,
        [FIELDS.videos.description]: description || '',
        [FIELDS.videos.videoUrl]: videoUrl || '',
        [FIELDS.videos.pdfUrl]: pdfUrl || '',
        [FIELDS.videos.order]: Number(order) || 1,
        [FIELDS.videos.required]: required || 'חובה',
        [FIELDS.videos.status]: status || 'פעיל',
      });
      return res.json({ success: true });
    }
    if (action === 'delete') {
      const r = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLES.videos}/${id}`, {
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
