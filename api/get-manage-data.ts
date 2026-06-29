import type { VercelRequest, VercelResponse } from '@vercel/node';
import { findAll, TABLES, FIELDS, fStr, fLink, fNum } from './_airtable.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const [topics, videos, questions] = await Promise.all([
    findAll(TABLES.topics),
    findAll(TABLES.videos),
    findAll(TABLES.questions),
  ]);

  return res.json({
    topics: topics.map(t => ({
      id: t.id,
      name: fStr(t, FIELDS.topics.name),
      description: fStr(t, FIELDS.topics.description),
      status: fStr(t, FIELDS.topics.status) || '׳₪׳¢׳™׳',
    })),
    videos: videos.map(v => ({
      id: v.id,
      name: fStr(v, FIELDS.videos.name),
      topicId: fLink(v, FIELDS.videos.topicId),
      description: fStr(v, FIELDS.videos.description),
      videoUrl: fStr(v, FIELDS.videos.videoUrl),
      pdfUrl: fStr(v, FIELDS.videos.pdfUrl),
      required: fStr(v, FIELDS.videos.required) || '׳¨׳©׳•׳×',
      status: fStr(v, FIELDS.videos.status) || '׳₪׳¢׳™׳',
      order: fNum(v, FIELDS.videos.order),
    })),
    questions: questions.map(q => ({
      id: q.id,
      topicId: fLink(q, FIELDS.questions.topicId),
      question: fStr(q, FIELDS.questions.question),
      answer1: fStr(q, FIELDS.questions.answer1),
      answer2: fStr(q, FIELDS.questions.answer2),
      answer3: fStr(q, FIELDS.questions.answer3),
      answer4: fStr(q, FIELDS.questions.answer4),
      correctAnswer: fNum(q, FIELDS.questions.correctAnswer) || 1,
    })),
  });
}

