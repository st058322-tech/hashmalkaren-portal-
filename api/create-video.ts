import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createRecord, TABLES, FIELDS } from './_airtable';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { topicId, name, description, videoUrl, pdfUrl, order, required, status } = req.body as {
    topicId: string;
    name: string;
    description?: string;
    videoUrl?: string;
    pdfUrl?: string;
    order?: number;
    required?: string;
    status?: string;
  };

  const record = await createRecord(TABLES.videos, {
    [FIELDS.videos.name]: name,
    [FIELDS.videos.topicId]: [topicId],
    [FIELDS.videos.description]: description || '',
    [FIELDS.videos.videoUrl]: videoUrl || '',
    [FIELDS.videos.pdfUrl]: pdfUrl || '',
    [FIELDS.videos.order]: order || 1,
    [FIELDS.videos.required]: required || 'חובה',
    [FIELDS.videos.status]: status || 'פעיל',
  });

  return res.json({ id: record.id, success: true });
}
