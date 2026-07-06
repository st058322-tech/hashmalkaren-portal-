async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${res.status}: ${text}`);
  }
  return res.json();
}

// ── Types ────────────────────────────────────────────────

export type Employee = {
  id: string;
  name: string;
  branch: string;
  role: string;
  status: string;
};

export type Topic = {
  id: string;
  name: string;
  description: string;
  totalVideos: number;
  completedVideos: number;
  questionCount: number;
};

export type Video = {
  id: string;
  name: string;
  description: string;
  videoUrl: string;
  pdfUrl: string;
  required: string;
  order: number;
  status: string;
  locked: boolean;
  progressId?: string;
};

export type Question = {
  id: string;
  question: string;
  answer1: string;
  answer2: string;
  answer3: string;
  answer4: string;
  correctAnswer: number;
  explanation: string;
};

export type AdminEmployee = {
  id: string;
  name: string;
  branch: string;
  role: string;
  status: string;
  topics: Array<{
    name: string;
    total: number;
    completed: number;
    completedNames: string[];
    missingNames: string[];
  }>;
};

export type ManageTopic = { id: string; name: string; description: string; status: string };
export type ManageVideo = { id: string; name: string; topicId: string; description: string; videoUrl: string; pdfUrl: string; required: string; status: string; order: number };
export type ManageQuestion = { id: string; topicId: string; question: string; answer1: string; answer2: string; answer3: string; answer4: string; correctAnswer: number };

// ── Output types ────────────────────────────────────────

export type GetTopicsOutputType = { topics: Topic[] };
export type GetTopicVideosOutputType = { videos: Video[] };
export type GetQuizQuestionsOutputType = { topicName: string; questions: Question[] };
export type AdminDataOutputType = { success: boolean; employees: AdminEmployee[] };
export type GetManageDataOutputType = { topics: ManageTopic[]; videos: ManageVideo[]; questions: ManageQuestion[] };

// ── API functions ─────────────────────────────────────────

export const login = (input: { name: string; password: string }) =>
  post<{ success: boolean; error?: string; employee?: Employee }>('/api/login', input);

export const getTopics = (input: { employeeId: string }) =>
  post<GetTopicsOutputType>('/api/get-topics', input);

export const getTopicVideos = (input: { topicId: string; employeeId: string }) =>
  post<GetTopicVideosOutputType>('/api/get-topic-videos', input);

export const getQuizQuestions = (input: { topicId: string }) =>
  post<GetQuizQuestionsOutputType>('/api/get-quiz-questions', input);

export const markComplete = (input: { employeeId: string; videoId: string; topicId: string; progressId?: string }) =>
  post<{ success: boolean }>('/api/mark-complete', input);

export const adminData = (input: { adminUser: string; adminPass: string }) =>
  post<AdminDataOutputType>('/api/admin-data', input);

export const getManageData = (_input: Record<string, never>) =>
  post<GetManageDataOutputType>('/api/get-manage-data', {});

export const createTopic = (input: { name: string; description?: string; status?: string }) =>
  post<{ id: string; success: boolean }>('/api/create-topic', input);

export const createVideo = (input: { topicId: string; name: string; description?: string; videoUrl?: string; pdfUrl?: string; order?: number; required?: string; status?: string }) =>
  post<{ id: string; success: boolean }>('/api/create-video', input);

export const createQuestions = (input: { questions: Array<{ topicId: string; question: string; answer1: string; answer2: string; answer3: string; answer4?: string; correctAnswer: number }> }) =>
  post<{ count: number; success: boolean }>('/api/create-questions', input);

export const updateQuestion = (input: { id: string; question: string; answer1: string; answer2: string; answer3: string; answer4?: string; correctAnswer: number }) =>
  post<{ success: boolean }>('/api/manage-question', { action: 'update', ...input });

export const deleteQuestion = (id: string) =>
  post<{ success: boolean }>('/api/manage-question', { action: 'delete', id });

export const createEmployee = (input: { name: string; password: string; branch?: string; role?: string }) =>
  post<{ id: string; success: boolean }>('/api/manage-employee', { action: 'create', ...input });

export const updateEmployee = (input: { id: string; name?: string; password?: string; branch?: string; role?: string }) =>
  post<{ success: boolean }>('/api/manage-employee', { action: 'update', ...input });

export const deleteEmployee = (id: string) =>
  post<{ success: boolean }>('/api/manage-employee', { action: 'delete', id });
