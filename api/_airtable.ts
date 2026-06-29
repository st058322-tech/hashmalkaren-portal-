const BASE_ID = process.env.AIRTABLE_BASE_ID!;
const API_KEY = process.env.AIRTABLE_API_KEY!;

// Table IDs
export const TABLES = {
  employees: 'tblzGsmpqB3WZBN6S',
  videos: 'tblN67jDZLvVnSByK',
  progress: 'tblSVcW9XoZYjDeZc',
  topics: 'tblYRUA1QH9stsiqr',
  questions: 'tblresysikmVA3bKj',
} as const;

// Field IDs per table
export const FIELDS = {
  employees: {
    name: 'fldQ0bIPjNy2JxNhA',
    password: 'fldlJNNNZv5dxbR1x',
    branch: 'fldEarEpOhL61rUFR',
    role: 'fld1JmgdVva6lmOpZ',
    email: 'fldW7nG6GoKzM71wi',
    status: 'fldE5U1ZkUYgsAIm4',
  },
  videos: {
    name: 'fldU0buso6E5bcJQo',
    topicId: 'fld0RrMaIjeVYqKpN',
    description: 'fldhlnXv5ZEEWpHNA',
    videoUrl: 'fldk8h9fGjckvbc54',
    pdfUrl: 'fldwiBNgB2aREpTZq',
    required: 'fld5vrvT6esszqMkL',
    status: 'fldW2rR91dld05wLI',
    order: 'fldck86vFW0axZXEI',
  },
  progress: {
    videoId: 'fldtnFIE0LL1T4Y5B',
    status: 'fldFFqcLEyGOjO2zy',
    startDate: 'fldKu3YOM9QKjiPv7',
    completedDate: 'fld1Zne7Vddg6Tiz6',
    employeeId: 'fldTi2UEM0tFOcS6Z',
  },
  topics: {
    name: 'fldc16v94HfhRyQcJ',
    description: 'fldKePgVV63CWqU4F',
    status: 'fldHj8ldYspJEceUZ',
  },
  questions: {
    question: 'fldKsLv9WmzMDiMqi',
    topicId: 'fldDFzQbQAVwDpzVQ',
    answer1: 'fldkd9Zc1zjA9qLNU',
    answer2: 'fldj3NgnE5fiX5Gw5',
    answer3: 'fldKlawGlZUrvzTcT',
    answer4: 'fldMRvlq9TLbUYNim',
    correctAnswer: 'fldaqQ69rTJwY2Lo2',
  },
} as const;

type AirtableRecord = { id: string; fields: Record<string, unknown> };

async function airtableFetch(path: string, options?: RequestInit) {
  const res = await fetch(`https://api.airtable.com/v0/${BASE_ID}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Airtable error ${res.status}: ${err}`);
  }
  return res.json();
}

export async function findAll(tableId: string, filterFormula?: string): Promise<AirtableRecord[]> {
  const records: AirtableRecord[] = [];
  let offset: string | undefined;
  do {
    const params = new URLSearchParams({ pageSize: '100', returnFieldsByFieldId: 'true' });
    if (filterFormula) params.set('filterByFormula', filterFormula);
    if (offset) params.set('offset', offset);
    const data = await airtableFetch(`/${tableId}?${params}`);
    records.push(...data.records);
    offset = data.offset;
  } while (offset);
  return records;
}

export async function findOne(tableId: string, id: string): Promise<AirtableRecord | null> {
  try {
    return await airtableFetch(`/${tableId}/${id}`);
  } catch {
    return null;
  }
}

export async function createRecord(tableId: string, fields: Record<string, unknown>): Promise<AirtableRecord> {
  return airtableFetch(`/${tableId}`, {
    method: 'POST',
    body: JSON.stringify({ fields }),
  });
}

export async function updateRecord(tableId: string, id: string, fields: Record<string, unknown>): Promise<AirtableRecord> {
  return airtableFetch(`/${tableId}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ fields }),
  });
}

export async function bulkCreate(tableId: string, recordsFields: Record<string, unknown>[]): Promise<AirtableRecord[]> {
  const results: AirtableRecord[] = [];
  for (let i = 0; i < recordsFields.length; i += 10) {
    const batch = recordsFields.slice(i, i + 10);
    const data = await airtableFetch(`/${tableId}`, {
      method: 'POST',
      body: JSON.stringify({ records: batch.map(fields => ({ fields })) }),
    });
    results.push(...data.records);
  }
  return results;
}

// Helper to extract field value from an Airtable record
export function f(record: AirtableRecord, fieldId: string): unknown {
  return record.fields[fieldId] ?? null;
}

export function fStr(record: AirtableRecord, fieldId: string): string {
  const v = f(record, fieldId);
  return v != null ? String(v) : '';
}

export function fNum(record: AirtableRecord, fieldId: string): number {
  const v = f(record, fieldId);
  return typeof v === 'number' ? v : Number(v) || 0;
}

// Linked record fields return an array of IDs
export function fLink(record: AirtableRecord, fieldId: string): string {
  const v = f(record, fieldId);
  if (Array.isArray(v)) return v[0] ?? '';
  return v != null ? String(v) : '';
}
