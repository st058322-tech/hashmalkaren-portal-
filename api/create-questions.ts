import type { VercelRequest, VercelResponse } from '@vercel/node';
import { bulkCreate, TABLES, FIELDS } from './_airtable.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { questions } = req.body as {
    questions: Array<{
      topicId: string;
      question: string;
      answer1: string;
      answer2: string;
      answer3: string;
      answer4?: string;
      correctAnswer: number;
    }>;
  };

  const records = questions.map(q => ({
    [FIELDS.questions.question]: q.question,
    [FIELDS.questions.topicId]: [q.topicId],
    [FIELDS.questions.answer1]: q.answer1,
    [FIELDS.questions.answer2]: q.answer2,
    [FIELDS.questions.answer3]: q.answer3,
    [FIELDS.questions.answer4]: q.answer4 || '',
    [FIELDS.questions.correctAnswer]: q.correctAnswer,
  }));

  await bulkCreate(TABLES.questions, records);
  return res.json({ count: questions.length, success: true });
}

