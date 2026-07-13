import type { VercelRequest, VercelResponse } from '@vercel/node';
import { findAll, TABLES, FIELDS, fStr, fLink } from './_airtable.js';

const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { adminUser, adminPass } = req.body as { adminUser: string; adminPass: string };

  if (adminUser !== ADMIN_USER || adminPass !== ADMIN_PASS) {
    return res.json({ success: false, employees: [] });
  }

  const [employees, topics, videos, progress] = await Promise.all([
    findAll(TABLES.employees),
    findAll(TABLES.topics),
    findAll(TABLES.videos),
    findAll(TABLES.progress),
  ]);

  const result = employees.map(emp => {
    const empProgress = progress.filter(p => {
      const linked = p.fields[FIELDS.progress.employeeId];
      return Array.isArray(linked) ? linked.includes(emp.id) : fLink(p, FIELDS.progress.employeeId) === emp.id;
    });
    const completedVideoIds = new Set(
      empProgress
        .filter(p => fStr(p, FIELDS.progress.status) === 'הושלם')
        .map(p => {
          const linked = p.fields[FIELDS.progress.videoId];
          return Array.isArray(linked) ? linked[0] : fLink(p, FIELDS.progress.videoId);
        })
        .filter(Boolean)
    );

    const topicData = topics.map(topic => {
      const topicVids = videos.filter(v => {
        if (fStr(v, FIELDS.videos.status) === 'לא פעיל') return false;
        const linked = v.fields[FIELDS.videos.topicId];
        return Array.isArray(linked) ? linked.includes(topic.id) : fLink(v, FIELDS.videos.topicId) === topic.id;
      });
      const completed = topicVids.filter(v => completedVideoIds.has(v.id));
      const missing   = topicVids.filter(v => !completedVideoIds.has(v.id));
      return {
        topicId: topic.id,
        name: fStr(topic, FIELDS.topics.name),
        total: topicVids.length,
        completed: completed.length,
        completedVideos: completed.map(v => ({ id: v.id, name: fStr(v, FIELDS.videos.name) })),
        missingVideos:   missing.map(v =>   ({ id: v.id, name: fStr(v, FIELDS.videos.name) })),
        // kept for backwards-compat
        completedNames: completed.map(v => fStr(v, FIELDS.videos.name)),
        missingNames:   missing.map(v =>   fStr(v, FIELDS.videos.name)),
      };
    }).filter(t => t.total > 0);

    return {
      id: emp.id,
      name: fStr(emp, FIELDS.employees.name),
      branch: fStr(emp, FIELDS.employees.branch),
      role: fStr(emp, FIELDS.employees.role),
      status: fStr(emp, FIELDS.employees.status),
      topics: topicData,
    };
  });

  return res.json({ success: true, employees: result });
}
