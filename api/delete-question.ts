import type { VercelRequest, VercelResponse } from '@vercel/node';
import { TABLES } from './_airtable.js';

const BASE_ID = process.env.AIRTABLE_BASE_ID!;
const API_KEY = process.env.AIRTABLE_API_KEY!;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { id } = req.body as { id: string };
  const r = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLES.questions}/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${API_KEY}` },
  });
  if (!r.ok) throw new Error(`Airtable error ${r.status}`);
  return res.json({ success: true });
}
