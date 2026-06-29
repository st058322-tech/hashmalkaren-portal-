export type QuizAnswer = {
  question: string;
  selectedAnswer: number;
  correctAnswer: number;
  answers: string[];
  explanation: string;
  isCorrect: boolean;
};

export type QuizAttempt = {
  id: string;
  topicId: string;
  topicName: string;
  score: number;
  correct: number;
  total: number;
  passed: boolean;
  date: string;
  employeeId: string;
  employeeName: string;
  answers: QuizAnswer[];
};

const KEY = 'hk_quiz_attempts';

function getAll(): QuizAttempt[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function save(results: QuizAttempt[]) {
  localStorage.setItem(KEY, JSON.stringify(results));
}

export function saveQuizAttempt(attempt: Omit<QuizAttempt, 'id'>): QuizAttempt {
  const all = getAll();
  const full: QuizAttempt = { ...attempt, id: `qa_${Date.now()}_${Math.random().toString(36).slice(2, 8)}` };
  all.push(full);
  save(all);
  return full;
}

export function getMyQuizResults(employeeId: string): QuizAttempt[] {
  return getAll().filter(r => r.employeeId === employeeId).sort((a, b) => b.date.localeCompare(a.date));
}

export function getAllQuizResults(): QuizAttempt[] {
  return getAll().sort((a, b) => b.date.localeCompare(a.date));
}

export function getAttemptsByEmployee(employeeId: string, topicId?: string): QuizAttempt[] {
  let results = getAll().filter(r => r.employeeId === employeeId);
  if (topicId) results = results.filter(r => r.topicId === topicId);
  return results.sort((a, b) => a.date.localeCompare(b.date));
}

export type QuizResult = QuizAttempt;
export function saveQuizResult(r: Omit<QuizAttempt, 'id' | 'answers'>) {
  return saveQuizAttempt({ ...r, answers: [] });
}
