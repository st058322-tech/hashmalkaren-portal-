import type { VercelRequest, VercelResponse } from '@vercel/node';
import { findAll, TABLES, FIELDS, fStr, fLink, fNum } from './_airtable';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { employeeId } = req.body as { employeeId: string };

  const [topics, videos, progress] = await Promise.all([
    findAll(TABLES.topics),
    findAll(TABLES.videos),
    findAll(TABLES.progress, `{${FIELDS.progress.employeeId}} = "${employeeId}"`),
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

    return {
      id: topic.id,
      name: fStr(topic, FIELDS.topics.name),
      description: fStr(topic, FIELDS.topics.description),
      totalVideos: topicVideos.length,
      completedVideos: topicVideos.filter(v => completedVideoIds.has(v.id)).length,
    };
  });

  return res.json({ topics: result });
}
