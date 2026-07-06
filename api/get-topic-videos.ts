import type { VercelRequest, VercelResponse } from '@vercel/node';
import { findAll, TABLES, FIELDS, fStr, fLink, fNum } from './_airtable.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { topicId, employeeId } = req.body as { topicId: string; employeeId: string };

  const [allVideos, progress] = await Promise.all([
    findAll(TABLES.videos),
    findAll(TABLES.progress, `{${FIELDS.progress.employeeId}} = "${employeeId}"`),
  ]);

  const videos = allVideos.filter(v => {
    if (fStr(v, FIELDS.videos.status) === 'לא פעיל') return false;
    return fLink(v, FIELDS.videos.topicId) === topicId;
  });

  const progressByVideo = new Map<string, { status: string; id: string }>();
  for (const p of progress) {
    const vid = fLink(p, FIELDS.progress.videoId);
    if (vid) progressByVideo.set(vid, { status: fStr(p, FIELDS.progress.status) || 'טרם התחיל', id: p.id });
  }

  const sorted = [...videos].sort((a, b) => fNum(a, FIELDS.videos.order) - fNum(b, FIELDS.videos.order));

  const result = sorted.map((v, index) => {
    const prog = progressByVideo.get(v.id);
    const status = prog?.status || 'טרם התחיל';
    let locked = false;
    if (index > 0) {
      const prevStatus = progressByVideo.get(sorted[index - 1].id)?.status || 'טרם התחיל';
      locked = prevStatus !== 'הושלם';
    }

    return {
      id: v.id,
      name: fStr(v, FIELDS.videos.name),
      description: fStr(v, FIELDS.videos.description),
      videoUrl: fStr(v, FIELDS.videos.videoUrl),
      pdfUrl: fStr(v, FIELDS.videos.pdfUrl),
      required: fStr(v, FIELDS.videos.required) || 'רשות',
      order: fNum(v, FIELDS.videos.order),
      status,
      locked,
      progressId: prog?.id,
    };
  });

  return res.json({ videos: result });
}
