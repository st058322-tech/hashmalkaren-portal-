import type { VercelRequest, VercelResponse } from '@vercel/node';
import { updateRecord, TABLES, FIELDS } from './_airtable.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { id, question, answer1, answer2, answer3, answer4, correctAnswer } = req.body as Record<string, string | number>;
  await updateRecord(TABLES.questions, String(id), {
    [FIELDS.questions.question]: question,
    [FIELDS.questions.answer1]: answer1,
    [FIELDS.questions.answer2]: answer2,
    [FIELDS.questions.answer3]: answer3,
    [FIELDS.questions.answer4]: answer4 || '',
    [FIELDS.questions.correctAnswer]: Number(correctAnswer),
  });
  return res.json({ success: true });
}
