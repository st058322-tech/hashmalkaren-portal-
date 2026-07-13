import type { VercelRequest, VercelResponse } from '@vercel/node';
import { findAll, createRecord, updateRecord, TABLES, FIELDS, fStr, fLink } from './_airtable.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { employeeId, videoId, progressId } = req.body as {
    employeeId: string;
    videoId: string;
    topicId: string;
    progressId?: string;
  };

  const today = new Date().toISOString().split('T')[0];

  try {
    // If progressId given, just update that record
    if (progressId) {
      await updateRecord(TABLES.progress, progressId, {
        [FIELDS.progress.status]: 'הושלם',
        [FIELDS.progress.completedDate]: today,
      });
      return res.json({ success: true });
    }

    // Otherwise: look for existing progress record for this employee+video
    const allProgress = await findAll(TABLES.progress);
    const existing = allProgress.filter(p => {
      const empLinked = p.fields[FIELDS.progress.employeeId];
      const vidLinked = p.fields[FIELDS.progress.videoId];
      const empMatch = Array.isArray(empLinked) ? empLinked.includes(employeeId) : fLink(p, FIELDS.progress.employeeId) === employeeId;
      const vidMatch = Array.isArray(vidLinked) ? vidLinked.includes(videoId) : fLink(p, FIELDS.progress.videoId) === videoId;
      return empMatch && vidMatch;
    });

    if (existing.length > 0) {
      // Update the first existing record (and clean up duplicates)
      await updateRecord(TABLES.progress, existing[0].id, {
        [FIELDS.progress.status]: 'הושלם',
        [FIELDS.progress.completedDate]: today,
      });
    } else {
      await createRecord(TABLES.progress, {
        [FIELDS.progress.employeeId]: [employeeId],
        [FIELDS.progress.videoId]: [videoId],
        [FIELDS.progress.status]: 'הושלם',
        [FIELDS.progress.completedDate]: today,
      });
    }

    return res.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ success: false, error: msg });
  }
}
