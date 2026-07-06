import type { VercelRequest, VercelResponse } from '@vercel/node';
import { updateRecord, TABLES, FIELDS } from './_airtable.js';

const BASE_ID = process.env.AIRTABLE_BASE_ID!;
const API_KEY = process.env.AIRTABLE_API_KEY!;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { action, id, question, answer1, answer2, answer3, answer4, correctAnswer } = req.body as Record<string, string | number>;

  try {
    if (action === 'update') {
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

    if (action === 'delete') {
      const r = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLES.questions}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${API_KEY}` },
      });
      if (!r.ok) throw new Error(`Airtable error ${r.status}`);
      return res.json({ success: true });
    }

    return res.status(400).json({ error: 'unknown action' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ success: false, error: msg });
  }
}
