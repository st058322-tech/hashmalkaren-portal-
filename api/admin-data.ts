import type { VercelRequest, VercelResponse } from '@vercel/node';
import { findAll, TABLES, FIELDS, fStr, fLink } from './_airtable.js';

const ADMIN_USER = process.env.ADMIN_USER || '׳׳¡׳×׳™';
const ADMIN_PASS = process.env.ADMIN_PASS || '111';

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
    const empProgress = progress.filter(p => fLink(p, FIELDS.progress.employeeId) === emp.id);
    const completedIds = new Set(
      empProgress
        .filter(p => fStr(p, FIELDS.progress.status) === '׳”׳•׳©׳׳')
        .map(p => fLink(p, FIELDS.progress.videoId))
        .filter(Boolean)
    );

    const topicData = topics.map(topic => {
      const topicVids = videos.filter(v => {
        if (fStr(v, FIELDS.videos.status) === '׳׳ ׳₪׳¢׳™׳') return false;
        return fLink(v, FIELDS.videos.topicId) === topic.id;
      });
      return {
        name: fStr(topic, FIELDS.topics.name),
        total: topicVids.length,
        completed: topicVids.filter(v => completedIds.has(v.id)).length,
        completedNames: topicVids.filter(v => completedIds.has(v.id)).map(v => fStr(v, FIELDS.videos.name)),
        missingNames: topicVids.filter(v => !completedIds.has(v.id)).map(v => fStr(v, FIELDS.videos.name)),
      };
    });

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

