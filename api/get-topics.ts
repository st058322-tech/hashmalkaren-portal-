import type { VercelRequest, VercelResponse } from '@vercel/node';
import { findAll, TABLES, FIELDS, fStr, fLink } from './_airtable.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { employeeId } = req.body as { employeeId: string };

  const [topics, videos, allProgress, questions] = await Promise.all([
    findAll(TABLES.topics),
    findAll(TABLES.videos),
    findAll(TABLES.progress),
    findAll(TABLES.questions),
  ]);

  // Filter progress to this employee in JS (Airtable formula doesn't work on linked record fields)
  const progress = allProgress.filter(p => {
    const linked = p.fields[FIELDS.progress.employeeId];
    return Array.isArray(linked) ? linked.includes(employeeId) : String(linked ?? '') === employeeId;
  });

  const completedVideoIds = new Set(
    progress
      .filter(p => fStr(p, FIELDS.progress.status) === 'הושלם')
      .map(p => fLink(p, FIELDS.progress.videoId))
      .filter(Boolean)
  );

  const result = topics.map(topic => {
    const topicVideos = videos.filter(v => {
      if (fStr(v, FIELDS.videos.status) === 'לא פעיל') return false;
      const linked = v.fields[FIELDS.videos.topicId];
      return Array.isArray(linked) ? linked.includes(topic.id) : String(linked ?? '') === topic.id;
    });

    const questionCount = questions.filter(q => {
      const linked = q.fields[FIELDS.questions.topicId];
      return Array.isArray(linked) ? linked.includes(topic.id) : String(linked ?? '') === topic.id;
    }).length;

    return {
      id: topic.id,
      name: fStr(topic, FIELDS.topics.name),
      description: fStr(topic, FIELDS.topics.description),
      totalVideos: topicVideos.length,
      completedVideos: topicVideos.filter(v => completedVideoIds.has(v.id)).length,
      questionCount,
    };
  });

  return res.json({ topics: result });
}
