import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import type { IncomingMessage, ServerResponse } from 'http';

// ── Demo data fallback (used only when AIRTABLE_API_KEY is not set) ───────────
const DEMO_EMPLOYEES = [
  { id: 'emp1', name: 'דנה כהן', branch: 'תל אביב', role: 'מוכרת', status: 'פעיל', password: '1234' },
  { id: 'emp2', name: 'מיכל לוי', branch: 'ירושלים', role: 'קופאית', status: 'פעיל', password: '1234' },
];
const DEMO_TOPICS = [
  { id: 't1', name: 'בטיחות בעבודה', description: 'נהלי בטיחות ומניעת תאונות', status: 'פעיל' },
  { id: 't2', name: 'שירות לקוחות', description: 'כיצד לתת שירות מעולה', status: 'פעיל' },
];
const DEMO_VIDEOS = [
  { id: 'v1', name: 'מבוא לבטיחות', topicId: 't1', description: 'סרטון פתיחה', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', pdfUrl: '', required: 'חובה', status: 'פעיל', order: 1 },
  { id: 'v2', name: 'ציוד מגן', topicId: 't1', description: 'שימוש נכון בציוד', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', pdfUrl: '', required: 'חובה', status: 'פעיל', order: 2 },
  { id: 'v3', name: 'טיפול בלקוח קשה', topicId: 't2', description: 'טכניקות הרגעה', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', pdfUrl: '', required: 'רשות', status: 'פעיל', order: 1 },
];
const DEMO_QUESTIONS = [
  { id: 'q1', topicId: 't1', question: 'מה ציוד המגן החובה?', answer1: 'כובע + נעלי בטיחות', answer2: 'כפפות בלבד', answer3: 'שום דבר', answer4: '', correctAnswer: 1, explanation: '' },
  { id: 'q2', topicId: 't1', question: 'מה לעשות בשריפה?', answer1: 'להמשיך לעבוד', answer2: 'לפנות את הבניין', answer3: 'לכבות לבד', answer4: '', correctAnswer: 2, explanation: '' },
];

function readBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise(resolve => {
    let data = '';
    req.on('data', (chunk: Buffer) => { data += chunk; });
    req.on('end', () => { try { resolve(JSON.parse(data)); } catch { resolve({}); } });
  });
}
function jsonReply(res: ServerResponse, body: unknown, status = 200) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

// ── Airtable constants (mirror of api/_airtable.ts) ──────────────────────────
const TABLES = {
  employees: 'tblzGsmpqB3WZBN6S',
  videos: 'tblN67jDZLvVnSByK',
  progress: 'tblSVcW9XoZYjDeZc',
  topics: 'tblYRUA1QH9stsiqr',
  questions: 'tblresysikmVA3bKj',
};
const F = {
  emp: { name: 'fldQ0bIPjNy2JxNhA', password: 'fldlJNNNZv5dxbR1x', branch: 'fldEarEpOhL61rUFR', role: 'fld1JmgdVva6lmOpZ', status: 'fldE5U1ZkUYgsAIm4' },
  video: { name: 'fldU0buso6E5bcJQo', topicId: 'fld0RrMaIjeVYqKpN', description: 'fldhlnXv5ZEEWpHNA', videoUrl: 'fldk8h9fGjckvbc54', pdfUrl: 'fldwiBNgB2aREpTZq', required: 'fld5vrvT6esszqMkL', status: 'fldW2rR91dld05wLI', order: 'fldck86vFW0axZXEI' },
  progress: { videoId: 'fldtnFIE0LL1T4Y5B', status: 'fldFFqcLEyGOjO2zy', completedDate: 'fld1Zne7Vddg6Tiz6', employeeId: 'fldTi2UEM0tFOcS6Z' },
  topic: { name: 'fldc16v94HfhRyQcJ', description: 'fldKePgVV63CWqU4F', status: 'fldHj8ldYspJEceUZ' },
  question: { question: 'fldKsLv9WmzMDiMqi', topicId: 'fldDFzQbQAVwDpzVQ', answer1: 'fldkd9Zc1zjA9qLNU', answer2: 'fldj3NgnE5fiX5Gw5', answer3: 'fldKlawGlZUrvzTcT', answer4: 'fldMRvlq9TLbUYNim', correctAnswer: 'fldaqQ69rTJwY2Lo2' },
};

type AirRec = { id: string; fields: Record<string, unknown> };
function fStr(r: AirRec, fid: string): string { const v = r.fields[fid]; return v != null ? String(v) : ''; }
function fNum(r: AirRec, fid: string): number { const v = r.fields[fid]; return typeof v === 'number' ? v : Number(v) || 0; }
function fLink(r: AirRec, fid: string): string { const v = r.fields[fid]; if (Array.isArray(v)) return String(v[0] ?? ''); return v != null ? String(v) : ''; }

async function airFetch(apiKey: string, baseId: string, path: string, opts?: RequestInit) {
  const res = await fetch(`https://api.airtable.com/v0/${baseId}${path}`, {
    ...opts,
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', ...(opts?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`Airtable ${res.status}: ${await res.text()}`);
  return res.json() as Promise<{ records: AirRec[]; offset?: string }>;
}

async function airFindAll(apiKey: string, baseId: string, table: string, filter?: string): Promise<AirRec[]> {
  const records: AirRec[] = [];
  let offset: string | undefined;
  do {
    const p = new URLSearchParams({ pageSize: '100', returnFieldsByFieldId: 'true' });
    if (filter) p.set('filterByFormula', filter);
    if (offset) p.set('offset', offset);
    const data = await airFetch(apiKey, baseId, `/${table}?${p}`);
    records.push(...data.records);
    offset = data.offset;
  } while (offset);
  return records;
}

async function airCreate(apiKey: string, baseId: string, table: string, fields: Record<string, unknown>) {
  return airFetch(apiKey, baseId, `/${table}`, { method: 'POST', body: JSON.stringify({ fields }) });
}
async function airUpdate(apiKey: string, baseId: string, table: string, id: string, fields: Record<string, unknown>) {
  return airFetch(apiKey, baseId, `/${table}/${id}`, { method: 'PATCH', body: JSON.stringify({ fields }) });
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const AT_KEY = env.AIRTABLE_API_KEY || '';
  const AT_BASE = env.AIRTABLE_BASE_ID || 'appusYeM0TaRD6J7T';
  const USE_REAL = !!AT_KEY;

  if (USE_REAL) {
    console.log('\x1b[32m✓ Airtable connected — using real data\x1b[0m');
  } else {
    console.log('\x1b[33m⚠ No AIRTABLE_API_KEY — using demo data\x1b[0m');
  }

  return {
    plugins: [
      react(),
      {
        name: 'mock-api',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            const url = req.url?.split('?')[0] ?? '';
            if (!url.startsWith('/api/')) return next();
            const body = await readBody(req);
            const route = url.replace('/api/', '');

            try {
              if (!USE_REAL) {
                // ── DEMO / MOCK ──────────────────────────────────────────────
                if (route === 'login') {
                  const emp = DEMO_EMPLOYEES.find(e => e.name === body.name && e.password === body.password);
                  if (emp) { const { password: _p, ...rest } = emp; return jsonReply(res, { success: true, employee: rest }); }
                  return jsonReply(res, { success: false, error: 'שם או סיסמה שגויים' });
                }
                if (route === 'get-topics') {
                  return jsonReply(res, { topics: DEMO_TOPICS.map(t => ({ ...t, totalVideos: DEMO_VIDEOS.filter(v => v.topicId === t.id).length, completedVideos: 0 })) });
                }
                if (route === 'get-topic-videos') {
                  const videos = DEMO_VIDEOS.filter(v => v.topicId === body.topicId).sort((a, b) => a.order - b.order).map((v, i) => ({ ...v, locked: i > 0, status: 'טרם התחיל', progressId: undefined }));
                  return jsonReply(res, { videos });
                }
                if (route === 'get-quiz-questions') {
                  return jsonReply(res, { topicName: DEMO_TOPICS.find(t => t.id === body.topicId)?.name ?? '', questions: DEMO_QUESTIONS.filter(q => q.topicId === body.topicId) });
                }
                if (route === 'mark-complete') return jsonReply(res, { success: true });
                if (route === 'admin-data') {
                  if (body.adminUser === 'אסתי' && body.adminPass === '111') {
                    return jsonReply(res, { success: true, employees: DEMO_EMPLOYEES.map(({ password: _p, ...emp }) => ({ ...emp, topics: DEMO_TOPICS.map(t => ({ name: t.name, total: DEMO_VIDEOS.filter(v => v.topicId === t.id).length, completed: 0, completedNames: [], missingNames: DEMO_VIDEOS.filter(v => v.topicId === t.id).map(v => v.name) })) })) });
                  }
                  return jsonReply(res, { success: false, employees: [] });
                }
                if (route === 'get-manage-data') return jsonReply(res, { topics: DEMO_TOPICS, videos: DEMO_VIDEOS, questions: DEMO_QUESTIONS });
                if (['create-topic', 'create-video', 'create-questions'].includes(route)) return jsonReply(res, { id: 'new', count: 1, success: true });
                return next();
              }

              // ── REAL AIRTABLE ─────────────────────────────────────────────
              const AT = (t: string, f?: string) => airFindAll(AT_KEY, AT_BASE, t, f);
              const CREATE = (t: string, fields: Record<string, unknown>) => airCreate(AT_KEY, AT_BASE, t, fields);
              const UPDATE = (t: string, id: string, fields: Record<string, unknown>) => airUpdate(AT_KEY, AT_BASE, t, id, fields);

              if (route === 'login') {
                const emps = await AT(TABLES.employees);
                const inputPass = String(body.password ?? '').trim();
                const inputName = String(body.name ?? '').trim();
                const emp = emps.find(r =>
                  fStr(r, F.emp.name).trim() === inputName &&
                  String(r.fields[F.emp.password] ?? '').trim() === inputPass
                );
                if (!emp) return jsonReply(res, { success: false, error: 'שם או סיסמה שגויים' });
                return jsonReply(res, { success: true, employee: { id: emp.id, name: fStr(emp, F.emp.name), branch: fStr(emp, F.emp.branch), role: fStr(emp, F.emp.role) } });
              }

              if (route === 'get-topics') {
                const empId = String(body.employeeId ?? '');
                const [topics, allVideos, progress, allQuestions] = await Promise.all([
                  AT(TABLES.topics),
                  AT(TABLES.videos),
                  empId ? AT(TABLES.progress) : Promise.resolve([]),
                  AT(TABLES.questions),
                ]);
                const activeTopics = topics.filter(t => fStr(t, F.topic.status) === 'פעיל');
                const activeVideos = allVideos.filter(v => fStr(v, F.video.status) === 'פעיל');
                // filter progress to this employee only
                const myProgress = empId
                  ? progress.filter(p => {
                      const linked = p.fields[F.progress.employeeId];
                      return Array.isArray(linked) ? linked.includes(empId) : String(linked ?? '') === empId;
                    })
                  : progress;
                const completedVideoIds = new Set(
                  myProgress.filter(p => fStr(p, F.progress.status) === 'הושלם').map(p => fLink(p, F.progress.videoId))
                );
                return jsonReply(res, {
                  topics: activeTopics.map(t => {
                    const tvids = activeVideos.filter(v => {
                      const linked = v.fields[F.video.topicId];
                      return Array.isArray(linked) ? linked.includes(t.id) : String(linked ?? '') === t.id;
                    });
                    const questionCount = allQuestions.filter(q => {
                      const linked = q.fields[F.question.topicId];
                      return Array.isArray(linked) ? linked.includes(t.id) : String(linked ?? '') === t.id;
                    }).length;
                    return { id: t.id, name: fStr(t, F.topic.name), description: fStr(t, F.topic.description), status: fStr(t, F.topic.status), totalVideos: tvids.length, completedVideos: tvids.filter(v => completedVideoIds.has(v.id)).length, questionCount };
                  }),
                });
              }

              if (route === 'get-topic-videos') {
                const empId = String(body.employeeId ?? '');
                const topicId = String(body.topicId ?? '');
                const [allVideos, allProgress] = await Promise.all([
                  AT(TABLES.videos),
                  empId ? AT(TABLES.progress) : Promise.resolve([]),
                ]);
                const progress = allProgress.filter(p => {
                  const linked = p.fields[F.progress.employeeId];
                  return Array.isArray(linked) ? linked.includes(empId) : String(linked ?? '') === empId;
                });
                // linked record field is an array of record IDs
                const videos = allVideos.filter(v => {
                  const linked = v.fields[F.video.topicId];
                  const inTopic = Array.isArray(linked) ? linked.includes(topicId) : String(linked ?? '') === topicId;
                  return inTopic && fStr(v, F.video.status) === 'פעיל';
                });
                const sorted = videos.sort((a, b) => fNum(a, F.video.order) - fNum(b, F.video.order));
                let prevDone = true;
                const result = sorted.map(v => {
                  const prog = progress.find(p => {
                    const linked = p.fields[F.progress.videoId];
                    return Array.isArray(linked) ? linked.includes(v.id) : fLink(p, F.progress.videoId) === v.id;
                  });
                  const status = prog ? fStr(prog, F.progress.status) : 'טרם התחיל';
                  const done = status === 'הושלם';
                  const locked = !prevDone;
                  if (done) prevDone = true;
                  else if (!locked) prevDone = false;
                  return { id: v.id, name: fStr(v, F.video.name), description: fStr(v, F.video.description), videoUrl: fStr(v, F.video.videoUrl), pdfUrl: fStr(v, F.video.pdfUrl), required: fStr(v, F.video.required), order: fNum(v, F.video.order), status, locked, progressId: prog?.id };
                });
                return jsonReply(res, { videos: result });
              }

              if (route === 'mark-complete') {
                const { employeeId, videoId, progressId } = body as Record<string, string>;
                const now = new Date().toISOString().slice(0, 10);
                if (progressId) {
                  await UPDATE(TABLES.progress, progressId, { [F.progress.status]: 'הושלם', [F.progress.completedDate]: now });
                } else {
                  await CREATE(TABLES.progress, { [F.progress.employeeId]: [employeeId], [F.progress.videoId]: [videoId], [F.progress.status]: 'הושלם', [F.progress.completedDate]: now });
                }
                return jsonReply(res, { success: true });
              }

              if (route === 'get-quiz-questions') {
                const topicId = String(body.topicId ?? '');
                const [topics, allQuestions] = await Promise.all([
                  AT(TABLES.topics),
                  AT(TABLES.questions),
                ]);
                const questions = allQuestions.filter(q => {
                  const linked = q.fields[F.question.topicId];
                  return Array.isArray(linked) ? linked.includes(topicId) : String(linked ?? '') === topicId;
                });
                return jsonReply(res, {
                  topicName: topics[0] ? fStr(topics[0], F.topic.name) : '',
                  questions: questions.map(q => ({ id: q.id, question: fStr(q, F.question.question), answer1: fStr(q, F.question.answer1), answer2: fStr(q, F.question.answer2), answer3: fStr(q, F.question.answer3), answer4: fStr(q, F.question.answer4), correctAnswer: fNum(q, F.question.correctAnswer) })),
                });
              }

              if (route === 'admin-data') {
                const adminUser = env.ADMIN_USER || 'אסתי';
                const adminPass = env.ADMIN_PASS || '111';
                if (body.adminUser !== adminUser || body.adminPass !== adminPass) return jsonReply(res, { success: false, employees: [] });
                const [emps, topics, videos, progress] = await Promise.all([
                  AT(TABLES.employees),
                  AT(TABLES.topics, `{${F.topic.status}}="פעיל"`),
                  AT(TABLES.videos, `{${F.video.status}}="פעיל"`),
                  AT(TABLES.progress, `{${F.progress.status}}="הושלם"`),
                ]);
                const employees = emps.map(e => {
                  const empProgress = progress.filter(p => fLink(p, F.progress.employeeId) === e.id);
                  const completedVideoIds = new Set(empProgress.map(p => fLink(p, F.progress.videoId)));
                  return {
                    id: e.id, name: fStr(e, F.emp.name), branch: fStr(e, F.emp.branch), role: fStr(e, F.emp.role), status: fStr(e, F.emp.status),
                    topics: topics.map(t => {
                      const tvids = videos.filter(v => fLink(v, F.video.topicId) === t.id);
                      const done = tvids.filter(v => completedVideoIds.has(v.id));
                      const missing = tvids.filter(v => !completedVideoIds.has(v.id));
                      return {
                        topicId: t.id,
                        name: fStr(t, F.topic.name),
                        total: tvids.length,
                        completed: done.length,
                        completedVideos: done.map(v => ({ id: v.id, name: fStr(v, F.video.name) })),
                        missingVideos: missing.map(v => ({ id: v.id, name: fStr(v, F.video.name) })),
                        completedNames: done.map(v => fStr(v, F.video.name)),
                        missingNames: missing.map(v => fStr(v, F.video.name)),
                      };
                    }),
                  };
                });
                return jsonReply(res, { success: true, employees });
              }

              if (route === 'get-manage-data') {
                const [topics, videos, questions] = await Promise.all([AT(TABLES.topics), AT(TABLES.videos), AT(TABLES.questions)]);
                return jsonReply(res, {
                  topics: topics.map(t => ({ id: t.id, name: fStr(t, F.topic.name), description: fStr(t, F.topic.description), status: fStr(t, F.topic.status) })),
                  videos: videos.map(v => ({ id: v.id, name: fStr(v, F.video.name), topicId: fLink(v, F.video.topicId), description: fStr(v, F.video.description), videoUrl: fStr(v, F.video.videoUrl), pdfUrl: fStr(v, F.video.pdfUrl), required: fStr(v, F.video.required), status: fStr(v, F.video.status), order: fNum(v, F.video.order) })),
                  questions: questions.map(q => ({ id: q.id, topicId: fLink(q, F.question.topicId), question: fStr(q, F.question.question), answer1: fStr(q, F.question.answer1), answer2: fStr(q, F.question.answer2), answer3: fStr(q, F.question.answer3), answer4: fStr(q, F.question.answer4), correctAnswer: fNum(q, F.question.correctAnswer) })),
                });
              }

              if (route === 'manage-topic') {
                const { action, id, name, description, status } = body as Record<string, string>;
                if (action === 'create') {
                  const rec = await CREATE(TABLES.topics, { [F.topic.name]: name, [F.topic.description]: description || '', [F.topic.status]: status || 'פעיל' });
                  return jsonReply(res, { id: (rec as unknown as AirRec).id, success: true });
                }
                if (action === 'update') {
                  await UPDATE(TABLES.topics, id, { [F.topic.name]: name, [F.topic.description]: description || '', [F.topic.status]: status || 'פעיל' });
                  return jsonReply(res, { success: true });
                }
                if (action === 'delete') {
                  await airFetch(AT_KEY, AT_BASE, `/${TABLES.topics}/${id}`, { method: 'DELETE' });
                  return jsonReply(res, { success: true });
                }
              }
              if (route === 'manage-video') {
                const { action, id, name, topicId, description, videoUrl, pdfUrl, required, status, order } = body as Record<string, string>;
                if (action === 'create') {
                  const rec = await CREATE(TABLES.videos, { [F.video.name]: name, [F.video.topicId]: [topicId], [F.video.description]: description || '', [F.video.videoUrl]: videoUrl || '', [F.video.pdfUrl]: pdfUrl || '', [F.video.required]: required || 'חובה', [F.video.status]: status || 'פעיל', [F.video.order]: Number(order) || 1 });
                  return jsonReply(res, { id: (rec as unknown as AirRec).id, success: true });
                }
                if (action === 'update') {
                  await UPDATE(TABLES.videos, id, { [F.video.name]: name, [F.video.description]: description || '', [F.video.videoUrl]: videoUrl || '', [F.video.pdfUrl]: pdfUrl || '', [F.video.required]: required || 'חובה', [F.video.status]: status || 'פעיל', [F.video.order]: Number(order) || 1 });
                  return jsonReply(res, { success: true });
                }
                if (action === 'delete') {
                  await airFetch(AT_KEY, AT_BASE, `/${TABLES.videos}/${id}`, { method: 'DELETE' });
                  return jsonReply(res, { success: true });
                }
              }
              if (route === 'create-questions') {
                const questions = body.questions as Array<{ topicId: string; question: string; answer1: string; answer2: string; answer3: string; answer4?: string; correctAnswer: number }>;
                // Airtable allows max 10 records per request — send in batches
                for (let i = 0; i < questions.length; i += 10) {
                  const batch = questions.slice(i, i + 10);
                  const batchFields = batch.map(q => ({
                    [F.question.question]: q.question,
                    [F.question.topicId]: [q.topicId],
                    [F.question.answer1]: q.answer1,
                    [F.question.answer2]: q.answer2,
                    [F.question.answer3]: q.answer3,
                    [F.question.answer4]: q.answer4 || '',
                    [F.question.correctAnswer]: q.correctAnswer,
                  }));
                  await airFetch(AT_KEY, AT_BASE, `/${TABLES.questions}`, {
                    method: 'POST',
                    body: JSON.stringify({ records: batchFields.map(fields => ({ fields })) }),
                  });
                }
                return jsonReply(res, { count: questions.length, success: true });
              }

              if (route === 'update-question') {
                const { id, question, answer1, answer2, answer3, answer4, correctAnswer } = body as Record<string, string | number>;
                await UPDATE(TABLES.questions, String(id), {
                  [F.question.question]: question,
                  [F.question.answer1]: answer1,
                  [F.question.answer2]: answer2,
                  [F.question.answer3]: answer3,
                  [F.question.answer4]: answer4 || '',
                  [F.question.correctAnswer]: Number(correctAnswer),
                });
                return jsonReply(res, { success: true });
              }

              if (route === 'delete-question') {
                const { id } = body as { id: string };
                await airFetch(AT_KEY, AT_BASE, `/${TABLES.questions}/${id}`, { method: 'DELETE' });
                return jsonReply(res, { success: true });
              }

              if (route === 'create-employee') {
                const { name, password, branch, role } = body as Record<string, string>;
                const rec = await CREATE(TABLES.employees, {
                  [F.emp.name]: name,
                  [F.emp.password]: Number(password) || password,
                  [F.emp.branch]: branch || '',
                  [F.emp.role]: role || '',
                  [F.emp.status]: 'פעיל',
                });
                return jsonReply(res, { id: (rec as unknown as AirRec).id, success: true });
              }

              if (route === 'update-employee') {
                const { id, name, password, branch, role } = body as Record<string, string>;
                const fields: Record<string, unknown> = {};
                if (name) fields[F.emp.name] = name;
                if (password) fields[F.emp.password] = Number(password) || password;
                if (branch !== undefined) fields[F.emp.branch] = branch;
                if (role !== undefined) fields[F.emp.role] = role;
                await UPDATE(TABLES.employees, id, fields);
                return jsonReply(res, { success: true });
              }

              if (route === 'delete-employee') {
                const { id } = body as { id: string };
                await airFetch(AT_KEY, AT_BASE, `/${TABLES.employees}/${id}`, { method: 'DELETE' });
                return jsonReply(res, { success: true });
              }

            } catch (err) {
              console.error('[API error]', route, err);
              return jsonReply(res, { error: String(err) }, 500);
            }
            next();
          });
        },
      },
    ],
    resolve: {
      alias: { '@': path.resolve(__dirname, './src') },
    },
  };
});
