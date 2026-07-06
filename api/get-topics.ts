import type { VercelRequest, VercelResponse } from '@vercel/node';
import { findAll, TABLES, FIELDS, fStr, fLink } from './_airtable.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { employeeId } = req.body as { employeeId: string };

  const [topics, videos, progress, questions] = await Promise.all([
    findAll(TABLES.topics),
    findAll(TABLES.videos),
    findAll(TABLES.progress, `{${FIELDS.progress.employeeId}} = "${employeeId}"`),
    findAll(TABLES.questions),
  ]);

  const completedVideoIds = new Set(
    progress
      .filter(p => fStr(p, FIELDS.progress.status) === 'הושלם')
      .map(p => fLink(p, FIELDS.progress.videoId))
      .filter(Boolean)
  );

  const result = topics.map(topic => {
    const topicVideos = videos.filter(v => {
      if (fStr(v, FIELDS.videos.status) === 'לא פעיל') return false;
      return fLink(v, FIELDS.videos.topicId) === topic.id;
    });

    const questionCount = questions.filter(q => fLink(q, FIELDS.questions.topicId) === topic.id).length;

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
