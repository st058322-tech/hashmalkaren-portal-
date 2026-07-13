import type { VercelRequest, VercelResponse } from '@vercel/node';
import { findAll, TABLES, FIELDS, fStr, fLink, fNum } from './_airtable.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { topicId, employeeId } = req.body as { topicId: string; employeeId: string };

  const [allVideos, allProgress] = await Promise.all([
    findAll(TABLES.videos),
    findAll(TABLES.progress),
  ]);

  // Filter progress to this employee in JS (Airtable formula doesn't work on linked record fields)
  const progress = allProgress.filter(p => {
    const linked = p.fields[FIELDS.progress.employeeId];
    return Array.isArray(linked) ? linked.includes(employeeId) : String(linked ?? '') === employeeId;
  });

  const videos = allVideos.filter(v => {
    if (fStr(v, FIELDS.videos.status) === 'לא פעיל') return false;
    const linked = v.fields[FIELDS.videos.topicId];
    return Array.isArray(linked) ? linked.includes(topicId) : String(linked ?? '') === topicId;
  });

  const sorted = [...videos].sort((a, b) => fNum(a, FIELDS.videos.order) - fNum(b, FIELDS.videos.order));

  let prevDone = true;
  const result = sorted.map(v => {
    const progs = progress.filter(p => {
      const linked = p.fields[FIELDS.progress.videoId];
      return Array.isArray(linked) ? linked.includes(v.id) : fLink(p, FIELDS.progress.videoId) === v.id;
    });
    // Prefer completed record if duplicates exist (e.g. admin-marked over in-progress)
    const prog = progs.find(p => fStr(p, FIELDS.progress.status) === 'הושלם') ?? progs[0];
    const status = prog ? fStr(prog, FIELDS.progress.status) : 'טרם התחיל';
    const done = status === 'הושלם';
    const locked = !prevDone;
    if (done) prevDone = true;
    else if (!locked) prevDone = false;

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
