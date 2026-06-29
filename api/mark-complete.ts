import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createRecord, updateRecord, TABLES, FIELDS } from './_airtable.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { employeeId, videoId, progressId } = req.body as {
    employeeId: string;
    videoId: string;
    topicId: string;
    progressId?: string;
  };

  const today = new Date().toISOString().split('T')[0];

  if (progressId) {
    await updateRecord(TABLES.progress, progressId, {
      [FIELDS.progress.status]: '׳”׳•׳©׳׳',
      [FIELDS.progress.completedDate]: today,
    });
  } else {
    await createRecord(TABLES.progress, {
      [FIELDS.progress.employeeId]: [employeeId],
      [FIELDS.progress.videoId]: [videoId],
      [FIELDS.progress.status]: '׳”׳•׳©׳׳',
      [FIELDS.progress.startDate]: today,
      [FIELDS.progress.completedDate]: today,
    });
  }

  return res.json({ success: true });
}

