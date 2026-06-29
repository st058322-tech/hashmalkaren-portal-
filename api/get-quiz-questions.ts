import type { VercelRequest, VercelResponse } from '@vercel/node';
import { findAll, findOne, TABLES, FIELDS, fStr, fLink, fNum } from './_airtable';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { topicId } = req.body as { topicId: string };

  const [topic, allQuestions] = await Promise.all([
    findOne(TABLES.topics, topicId),
    findAll(TABLES.questions),
  ]);

  const topicName = topic ? fStr(topic, FIELDS.topics.name) : '';

  const questions = allQuestions
    .filter(q => fLink(q, FIELDS.questions.topicId) === topicId)
    .map(q => ({
      id: q.id,
      question: fStr(q, FIELDS.questions.question),
      answer1: fStr(q, FIELDS.questions.answer1),
      answer2: fStr(q, FIELDS.questions.answer2),
      answer3: fStr(q, FIELDS.questions.answer3),
      answer4: fStr(q, FIELDS.questions.answer4),
      correctAnswer: fNum(q, FIELDS.questions.correctAnswer) || 1,
      explanation: '',
    }));

  return res.json({ topicName, questions });
}
