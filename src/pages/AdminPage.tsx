import { useState, useEffect, useMemo } from 'react';
import {
  adminData, getManageData, createTopic, createVideo, createQuestions,
  updateQuestion, deleteQuestion, createEmployee, updateEmployee, deleteEmployee,
  type AdminDataOutputType, type GetManageDataOutputType, type AdminEmployee,
} from '../lib/api';
import Header from '../components/Header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Users, Search, CheckCircle2, XCircle, ChevronDown, ChevronUp, Lock, Loader2,
  ClipboardCheck, Plus, BookOpen, Video, HelpCircle, FileSpreadsheet,
  Settings, Pencil, Trash2, UserPlus,
} from 'lucide-react';
import { toast } from 'sonner';
import { getAllQuizResults, QuizAttempt, QuizAnswer } from '../lib/quizResults';

type Employee = AdminDataOutputType['employees'][0];
type ManageData = GetManageDataOutputType;

function AdminLogin({ onSuccess }: { onSuccess: (emps: Employee[], user: string, pass: string) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await adminData({ adminUser: username, adminPass: password });
      if (result.success) onSuccess(result.employees, username, password);
      else toast.error('שם משתמש או סיסמה שגויים');
    } catch { toast.error('שגיאה בהתחברות'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex items-center justify-center px-4 pt-20">
        <Card className="w-full max-w-sm p-8 bg-card">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-xl font-bold">כניסת מנהל</h1>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>שם משתמש</Label>
              <Input value={username} onChange={e => setUsername(e.target.value)} className="bg-secondary/50 mt-1" autoComplete="off" />
            </div>
            <div>
              <Label>סיסמה</Label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} className="bg-secondary/50 mt-1" />
            </div>
            <Button type="submit" disabled={loading || !username || !password} className="w-full bg-primary text-primary-foreground">
              {loading && <Loader2 className="w-4 h-4 animate-spin ml-2" />}כניסה
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}

function QuizAttemptRow({ attempt, index }: { attempt: QuizAttempt; index: number }) {
  const [showDetail, setShowDetail] = useState(false);
  return (
    <>
      <button onClick={() => setShowDetail(true)} className="w-full flex items-center justify-between p-2 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors text-right">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">ניסיון {index}</span>
          <span className="text-xs font-medium">{attempt.topicName}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{attempt.date}</span>
          <span className="text-sm font-bold text-primary">{attempt.score}</span>
          <Badge variant="outline" className={`text-[10px] h-4 px-1.5 ${attempt.passed ? 'border-emerald-500/30 text-emerald-400' : 'border-destructive/30 text-destructive'}`}>
            {attempt.passed ? 'עבר' : 'נכשל'}
          </Badge>
        </div>
      </button>
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-right">ניסיון {index} — {attempt.topicName}</DialogTitle>
          </DialogHeader>
          <div className="text-sm space-y-1 mb-3">
            <p>עובד/ת: <strong>{attempt.employeeName}</strong></p>
            <p>ציון: <strong className="text-primary">{attempt.score}</strong> | {attempt.correct}/{attempt.total} נכונות | {attempt.date}</p>
            <Badge className={attempt.passed ? 'bg-emerald-500/15 text-emerald-400' : 'bg-destructive/15 text-destructive'}>{attempt.passed ? 'עבר' : 'דורש שיפור'}</Badge>
          </div>
          {attempt.answers.length > 0 ? (
            <div className="space-y-2">
              {attempt.answers.map((a: QuizAnswer, i: number) => (
                <div key={i} className={`p-2.5 rounded-lg border text-xs ${a.isCorrect ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-destructive/20 bg-destructive/5'}`}>
                  <div className="flex items-start gap-2 mb-1">
                    {a.isCorrect ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" /> : <XCircle className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />}
                    <p className="font-medium">{i + 1}. {a.question}</p>
                  </div>
                  <div className="mr-5 space-y-0.5">
                    {!a.isCorrect && <p className="text-destructive">תשובת העובד/ת: {a.answers[a.selectedAnswer - 1]}</p>}
                    <p className="text-emerald-400">תשובה נכונה: {a.answers[a.correctAnswer - 1]}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">פרטי התשובות אינם זמינים לניסיון זה</p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function EmployeeRow({ emp, quizAttempts }: { emp: Employee; quizAttempts: QuizAttempt[] }) {
  const [open, setOpen] = useState(false);
  const totalAll = emp.topics.reduce((s, t) => s + t.total, 0);
  const completedAll = emp.topics.reduce((s, t) => s + t.completed, 0);
  const pct = totalAll > 0 ? Math.round((completedAll / totalAll) * 100) : 0;
  const empQuizzes = quizAttempts.filter(q => q.employeeId === emp.id);

  return (
    <Card className="overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full p-3 sm:p-4 flex items-center justify-between text-right hover:bg-secondary/20 transition-colors">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">{emp.name.charAt(0)}</div>
          <div className="min-w-0">
            <div className="font-semibold text-sm truncate">{emp.name}</div>
            <div className="text-[11px] text-muted-foreground">{emp.role} • {emp.branch}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {empQuizzes.length > 0 && (
            <Badge variant="outline" className="text-[10px] h-5 border-primary/30 text-primary hidden sm:flex">
              <ClipboardCheck className="w-3 h-3 ml-1" />{empQuizzes.length} מבחנים
            </Badge>
          )}
          <div className="w-14 h-2 bg-secondary rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} /></div>
          <span className="text-xs font-bold text-primary w-8 text-left">{pct}%</span>
          {open ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
        </div>
      </button>
      {open && (
        <div className="px-3 sm:px-4 pb-4 border-t border-border pt-3 space-y-3">
          {emp.topics.map(topic => (
            <div key={topic.name}>
              <div className="text-xs font-medium mb-1">{topic.name} ({topic.completed}/{topic.total})</div>
              <div className="flex flex-wrap gap-1">
                {topic.completedNames.map(n => <Badge key={n} className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30 text-[10px]"><CheckCircle2 className="w-3 h-3 ml-1" />{n}</Badge>)}
                {topic.missingNames.map(n => <Badge key={n} variant="secondary" className="text-[10px] text-muted-foreground"><XCircle className="w-3 h-3 ml-1" />{n}</Badge>)}
              </div>
            </div>
          ))}
          {empQuizzes.length > 0 && (
            <div>
              <div className="text-xs font-medium mb-1 flex items-center gap-1"><ClipboardCheck className="w-3 h-3 text-primary" />תוצאות מבחנים</div>
              <div className="space-y-1.5">
                {empQuizzes.map((q, i) => <QuizAttemptRow key={q.id} attempt={q} index={i + 1} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function DataManagement() {
  const [data, setData] = useState<ManageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState<'topics' | 'videos' | 'questions'>('topics');
  const [showForm, setShowForm] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [saving, setSaving] = useState(false);

  const [topicName, setTopicName] = useState('');
  const [topicDesc, setTopicDesc] = useState('');
  const [topicStatus, setTopicStatus] = useState('פעיל');
  const [videoName, setVideoName] = useState('');
  const [videoTopic, setVideoTopic] = useState('');
  const [videoDesc, setVideoDesc] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoPdf, setVideoPdf] = useState('');
  const [videoOrder, setVideoOrder] = useState('1');
  const [videoRequired, setVideoRequired] = useState('חובה');
  const [qTopic, setQTopic] = useState('');
  const [qText, setQText] = useState('');
  const [qA1, setQA1] = useState('');
  const [qA2, setQA2] = useState('');
  const [qA3, setQA3] = useState('');
  const [qA4, setQA4] = useState('');
  const [qCorrect, setQCorrect] = useState('1');
  const [bulkText, setBulkText] = useState('');
  const [bulkTopic, setBulkTopic] = useState('');

  useEffect(() => { loadData(); }, []);
  const loadData = () => { setLoading(true); getManageData({} as never).then(setData).finally(() => setLoading(false)); };

  const resetForms = () => {
    setTopicName(''); setTopicDesc(''); setTopicStatus('פעיל');
    setVideoName(''); setVideoTopic(''); setVideoDesc(''); setVideoUrl(''); setVideoPdf(''); setVideoOrder('1'); setVideoRequired('חובה');
    setQTopic(''); setQText(''); setQA1(''); setQA2(''); setQA3(''); setQA4(''); setQCorrect('1');
    setBulkText(''); setBulkTopic('');
    setShowForm(false); setShowBulk(false);
  };

  const handleCreateTopic = async () => {
    if (!topicName) return;
    setSaving(true);
    try {
      await createTopic({ name: topicName, description: topicDesc, status: topicStatus });
      toast.success('נושא נוצר בהצלחה');
      resetForms(); loadData();
    } catch { toast.error('שגיאה ביצירת נושא'); }
    finally { setSaving(false); }
  };

  const handleCreateVideo = async () => {
    if (!videoName || !videoTopic) return;
    setSaving(true);
    try {
      await createVideo({ topicId: videoTopic, name: videoName, description: videoDesc, videoUrl, pdfUrl: videoPdf, order: Number(videoOrder) || 1, required: videoRequired, status: 'פעיל' });
      toast.success('סרטון נוצר בהצלחה');
      resetForms(); loadData();
    } catch { toast.error('שגיאה ביצירת סרטון'); }
    finally { setSaving(false); }
  };

  const handleCreateQuestion = async () => {
    if (!qText || !qTopic || !qA1 || !qA2 || !qA3) return;
    setSaving(true);
    try {
      await createQuestions({ questions: [{ topicId: qTopic, question: qText, answer1: qA1, answer2: qA2, answer3: qA3, answer4: qA4, correctAnswer: Number(qCorrect) }] });
      toast.success('שאלה נוצרה בהצלחה');
      resetForms(); loadData();
    } catch { toast.error('שגיאה ביצירת שאלה'); }
    finally { setSaving(false); }
  };

  const [bulkPreview, setBulkPreview] = useState<Array<{ topicId: string; question: string; answer1: string; answer2: string; answer3: string; answer4: string; correctAnswer: number }>>([]);
  const [bulkConfirmed, setBulkConfirmed] = useState(false);

  const parseBulk = () => {
    if (!bulkText.trim() || !bulkTopic) return;
    const lines = bulkText.trim().split('\n').filter(l => l.trim());
    const parsed = lines.map(line => {
      const cols = line.split('\t');
      return {
        topicId: bulkTopic,
        question: cols[0]?.trim() || '',
        answer1: cols[1]?.trim() || '',
        answer2: cols[2]?.trim() || '',
        answer3: cols[3]?.trim() || '',
        answer4: cols[4]?.trim() || '',
        correctAnswer: Number(cols[5]?.trim()) || 1,
      };
    }).filter(q => q.question && q.answer1 && q.answer2);
    if (parsed.length === 0) { toast.error('לא נמצאו שאלות תקינות. וודאי שהעמודות מופרדות בטאב'); return; }
    setBulkPreview(parsed);
    setBulkConfirmed(false);
  };

  const handleBulkImport = async () => {
    if (bulkPreview.length === 0) return;
    setSaving(true);
    try {
      await createQuestions({ questions: bulkPreview });
      toast.success(`${bulkPreview.length} שאלות נוצרו בהצלחה`);
      setBulkPreview([]); setBulkConfirmed(false);
      resetForms(); loadData();
    } catch { toast.error('שגיאה בייבוא'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 bg-secondary/30 rounded-xl animate-pulse" />)}</div>;
  if (!data) return null;

  const topics = data.topics;

  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-secondary/30 p-1 rounded-xl">
        {[
          { key: 'topics' as const, label: 'נושאים', icon: BookOpen, count: data.topics.length },
          { key: 'videos' as const, label: 'סרטונים', icon: Video, count: data.videos.length },
          { key: 'questions' as const, label: 'שאלות', icon: HelpCircle, count: data.questions.length },
        ].map(t => (
          <button key={t.key} onClick={() => { setSubTab(t.key); setShowForm(false); setShowBulk(false); }}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${subTab === t.key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
            <t.icon className="w-3.5 h-3.5" />{t.label} ({t.count})
          </button>
        ))}
      </div>

      {subTab === 'topics' && (
        <>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold">נושאי הדרכה</h3>
            <Button size="sm" onClick={() => setShowForm(!showForm)} className="h-8 text-xs bg-primary text-primary-foreground"><Plus className="w-3.5 h-3.5 ml-1" />נושא חדש</Button>
          </div>
          {showForm && (
            <Card className="p-4 space-y-3 border-primary/20">
              <Input placeholder="שם נושא" value={topicName} onChange={e => setTopicName(e.target.value)} className="bg-secondary/50" />
              <Textarea placeholder="תיאור" value={topicDesc} onChange={e => setTopicDesc(e.target.value)} className="bg-secondary/50" rows={2} />
              <Select value={topicStatus} onValueChange={setTopicStatus}>
                <SelectTrigger className="bg-secondary/50"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="פעיל">פעיל</SelectItem><SelectItem value="לא פעיל">לא פעיל</SelectItem></SelectContent>
              </Select>
              <Button onClick={handleCreateTopic} disabled={saving || !topicName} className="w-full bg-primary text-primary-foreground">{saving ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Plus className="w-4 h-4 ml-2" />}צור נושא</Button>
            </Card>
          )}
          <div className="space-y-2">
            {data.topics.map(t => (
              <Card key={t.id} className="p-3 flex items-center justify-between">
                <div><p className="text-sm font-medium">{t.name}</p>{t.description && <p className="text-[11px] text-muted-foreground">{t.description}</p>}</div>
                <Badge variant="outline" className={`text-[10px] ${t.status === 'פעיל' ? 'text-emerald-400 border-emerald-500/30' : 'text-muted-foreground'}`}>{t.status}</Badge>
              </Card>
            ))}
          </div>
        </>
      )}

      {subTab === 'videos' && (
        <>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold">סרטוני הדרכה</h3>
            <Button size="sm" onClick={() => setShowForm(!showForm)} className="h-8 text-xs bg-primary text-primary-foreground"><Plus className="w-3.5 h-3.5 ml-1" />סרטון חדש</Button>
          </div>
          {showForm && (
            <Card className="p-4 space-y-3 border-primary/20">
              <Select value={videoTopic} onValueChange={setVideoTopic}>
                <SelectTrigger className="bg-secondary/50"><SelectValue placeholder="בחר נושא" /></SelectTrigger>
                <SelectContent>{topics.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
              </Select>
              <Input placeholder="שם סרטון" value={videoName} onChange={e => setVideoName(e.target.value)} className="bg-secondary/50" />
              <Textarea placeholder="תיאור קצר" value={videoDesc} onChange={e => setVideoDesc(e.target.value)} className="bg-secondary/50" rows={2} />
              <Input placeholder="קישור לסרטון" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} className="bg-secondary/50" />
              <Input placeholder="קישור ל-PDF (אופציונלי)" value={videoPdf} onChange={e => setVideoPdf(e.target.value)} className="bg-secondary/50" />
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">סדר הצגה</Label><Input type="number" value={videoOrder} onChange={e => setVideoOrder(e.target.value)} className="bg-secondary/50 mt-1" /></div>
                <div><Label className="text-xs">חובה / רשות</Label>
                  <Select value={videoRequired} onValueChange={setVideoRequired}><SelectTrigger className="bg-secondary/50 mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="חובה">חובה</SelectItem><SelectItem value="רשות">רשות</SelectItem></SelectContent></Select>
                </div>
              </div>
              <Button onClick={handleCreateVideo} disabled={saving || !videoName || !videoTopic} className="w-full bg-primary text-primary-foreground">{saving ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Plus className="w-4 h-4 ml-2" />}צור סרטון</Button>
            </Card>
          )}
          <div className="space-y-2">
            {data.videos.map(v => {
              const tName = topics.find(t => t.id === v.topicId)?.name || '';
              return (
                <Card key={v.id} className="p-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium">{v.name}</p>
                    <div className="flex gap-1">
                      <Badge variant="secondary" className="text-[10px]">{v.required}</Badge>
                      <Badge variant="outline" className={`text-[10px] ${v.status === 'פעיל' ? 'text-emerald-400 border-emerald-500/30' : 'text-muted-foreground'}`}>{v.status}</Badge>
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground">{tName} • סדר: {v.order}</p>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {subTab === 'questions' && (
        <QuestionsTab topics={topics} questions={data.questions} onRefresh={loadData} />
      )}
    </div>
  );
}

type QuestionItem = GetManageDataOutputType['questions'][0];
type TopicItem = GetManageDataOutputType['topics'][0];

function EditQuestionDialog({ q, topics, onSave, onClose }: { q: QuestionItem; topics: TopicItem[]; onSave: () => void; onClose: () => void }) {
  const [text, setText] = useState(q.question);
  const [a1, setA1] = useState(q.answer1);
  const [a2, setA2] = useState(q.answer2);
  const [a3, setA3] = useState(q.answer3);
  const [a4, setA4] = useState(q.answer4 || '');
  const [correct, setCorrect] = useState(String(q.correctAnswer));
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateQuestion({ id: q.id, question: text, answer1: a1, answer2: a2, answer3: a3, answer4: a4, correctAnswer: Number(correct) });
      toast.success('שאלה עודכנה בהצלחה');
      onSave();
    } catch { toast.error('שגיאה בעדכון'); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle className="text-right">עריכת שאלה</DialogTitle></DialogHeader>
        <div className="space-y-3 mt-2">
          <Textarea value={text} onChange={e => setText(e.target.value)} className="bg-secondary/50" rows={3} placeholder="טקסט השאלה" />
          {[{ val: a1, set: setA1, ph: 'תשובה 1' }, { val: a2, set: setA2, ph: 'תשובה 2' }, { val: a3, set: setA3, ph: 'תשובה 3' }, { val: a4, set: setA4, ph: 'תשובה 4 (אופציונלי)' }].map(({ val, set, ph }) => (
            <Input key={ph} value={val} onChange={e => set(e.target.value)} placeholder={ph} className="bg-secondary/50" />
          ))}
          <div>
            <Label className="text-xs">תשובה נכונה</Label>
            <Select value={correct} onValueChange={setCorrect}>
              <SelectTrigger className="bg-secondary/50 mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {['1','2','3','4'].map(n => <SelectItem key={n} value={n}>תשובה {n}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">ביטול</Button>
            <Button onClick={handleSave} disabled={saving || !text || !a1 || !a2} className="flex-1 bg-primary text-primary-foreground">
              {saving ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}שמור שינויים
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function QuestionsTab({ topics, questions, onRefresh }: { topics: TopicItem[]; questions: QuestionItem[]; onRefresh: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editQ, setEditQ] = useState<QuestionItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // New question form
  const [qTopic, setQTopic] = useState('');
  const [qText, setQText] = useState('');
  const [qA1, setQA1] = useState(''); const [qA2, setQA2] = useState('');
  const [qA3, setQA3] = useState(''); const [qA4, setQA4] = useState('');
  const [qCorrect, setQCorrect] = useState('1');

  // Bulk import
  const [bulkTopic, setBulkTopic] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [bulkPreview, setBulkPreview] = useState<Array<{ topicId: string; question: string; answer1: string; answer2: string; answer3: string; answer4: string; correctAnswer: number }>>([]);
  const [bulkConfirmed, setBulkConfirmed] = useState(false);

  const handleCreateQuestion = async () => {
    if (!qText || !qTopic || !qA1 || !qA2 || !qA3) return;
    setSaving(true);
    try {
      await createQuestions({ questions: [{ topicId: qTopic, question: qText, answer1: qA1, answer2: qA2, answer3: qA3, answer4: qA4, correctAnswer: Number(qCorrect) }] });
      toast.success('שאלה נוצרה בהצלחה');
      setQTopic(''); setQText(''); setQA1(''); setQA2(''); setQA3(''); setQA4(''); setQCorrect('1');
      setShowForm(false); onRefresh();
    } catch { toast.error('שגיאה ביצירת שאלה'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    setSaving(true);
    try {
      await deleteQuestion(id);
      toast.success('שאלה נמחקה');
      setDeleteId(null); onRefresh();
    } catch { toast.error('שגיאה במחיקה'); }
    finally { setSaving(false); }
  };

  const parseBulk = () => {
    const lines = bulkText.trim().split('\n').filter(l => l.trim());
    const parsed = lines.map(line => {
      const cols = line.split('\t').map(c => c.trim());
      const last = cols[cols.length - 1];
      const lastIsDigit = /^\d+$/.test(last);
      // 3-answer format: question, a1, a2, a3, digit  (5 cols, last is digit)
      // 4-answer format: question, a1, a2, a3, a4, digit (6 cols, last is digit)
      let question='', answer1='', answer2='', answer3='', answer4='', correctAnswer=1;
      if (lastIsDigit && cols.length === 5) {
        // 3 answers
        [question, answer1, answer2, answer3] = cols;
        correctAnswer = Number(last) || 1;
        answer4 = '';
      } else if (lastIsDigit && cols.length >= 6) {
        // 4 answers
        [question, answer1, answer2, answer3, answer4] = cols;
        correctAnswer = Number(last) || 1;
      } else {
        // fallback: try 6-col without digit (old format)
        [question, answer1, answer2, answer3, answer4=''] = cols;
        correctAnswer = Number(cols[5]) || 1;
      }
      return { topicId: bulkTopic, question, answer1, answer2, answer3, answer4, correctAnswer };
    }).filter(q => q.question && q.answer1 && q.answer2);
    if (!parsed.length) { toast.error('לא נמצאו שאלות. וודאי שהעמודות מופרדות בטאב'); return; }
    setBulkPreview(parsed); setBulkConfirmed(false);
  };

  const handleBulkImport = async () => {
    setSaving(true);
    try {
      await createQuestions({ questions: bulkPreview });
      toast.success(`${bulkPreview.length} שאלות נוצרו בהצלחה`);
      setBulkPreview([]); setBulkConfirmed(false); setBulkText(''); setBulkTopic('');
      setShowBulk(false); onRefresh();
    } catch { toast.error('שגיאה בייבוא'); }
    finally { setSaving(false); }
  };

  // Group by topic
  const grouped = useMemo(() => {
    const map = new Map<string, QuestionItem[]>();
    for (const q of questions) {
      const name = topics.find(t => t.id === q.topicId)?.name || 'ללא נושא';
      if (!map.has(name)) map.set(name, []);
      map.get(name)!.push(q);
    }
    return [...map.entries()];
  }, [questions, topics]);

  return (
    <>
      {editQ && <EditQuestionDialog q={editQ} topics={topics} onSave={() => { setEditQ(null); onRefresh(); }} onClose={() => setEditQ(null)} />}

      {/* Delete confirm dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="text-right text-destructive">מחיקת שאלה</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground mt-2">האם למחוק שאלה זו? פעולה זו אינה הפיכה.</p>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteId(null)} className="flex-1">ביטול</Button>
            <Button onClick={() => deleteId && handleDelete(deleteId)} disabled={saving} className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {saving ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Trash2 className="w-4 h-4 ml-2" />}מחק
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-sm font-bold">שאלות מבחן</h3>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => { setShowBulk(!showBulk); setShowForm(false); }} className="h-8 text-xs"><FileSpreadsheet className="w-3.5 h-3.5 ml-1" />ייבוא מאקסל</Button>
          <Button size="sm" onClick={() => { setShowForm(!showForm); setShowBulk(false); }} className="h-8 text-xs bg-primary text-primary-foreground"><Plus className="w-3.5 h-3.5 ml-1" />שאלה חדשה</Button>
        </div>
      </div>

      {showForm && (
        <Card className="p-4 space-y-3 border-primary/20">
          <Select value={qTopic} onValueChange={setQTopic}>
            <SelectTrigger className="bg-secondary/50"><SelectValue placeholder="בחר נושא" /></SelectTrigger>
            <SelectContent>{topics.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
          </Select>
          <Textarea placeholder="טקסט השאלה" value={qText} onChange={e => setQText(e.target.value)} className="bg-secondary/50" rows={2} />
          <Input placeholder="תשובה 1" value={qA1} onChange={e => setQA1(e.target.value)} className="bg-secondary/50" />
          <Input placeholder="תשובה 2" value={qA2} onChange={e => setQA2(e.target.value)} className="bg-secondary/50" />
          <Input placeholder="תשובה 3" value={qA3} onChange={e => setQA3(e.target.value)} className="bg-secondary/50" />
          <Input placeholder="תשובה 4 (אופציונלי)" value={qA4} onChange={e => setQA4(e.target.value)} className="bg-secondary/50" />
          <div>
            <Label className="text-xs">תשובה נכונה</Label>
            <Select value={qCorrect} onValueChange={setQCorrect}>
              <SelectTrigger className="bg-secondary/50 mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>{['1','2','3','4'].map(n => <SelectItem key={n} value={n}>תשובה {n}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Button onClick={handleCreateQuestion} disabled={saving || !qText || !qTopic || !qA1 || !qA2 || !qA3} className="w-full bg-primary text-primary-foreground">
            {saving ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Plus className="w-4 h-4 ml-2" />}צור שאלה
          </Button>
        </Card>
      )}

      {showBulk && (
        <Card className="p-4 space-y-3 border-primary/20">
          <p className="text-xs text-muted-foreground">כל שורה: שאלה, תשובה1, תשובה2, תשובה3, תשובה4, מס׳ תשובה נכונה (מופרדים בטאב)</p>
          <Select value={bulkTopic} onValueChange={v => { setBulkTopic(v); setBulkPreview([]); }}>
            <SelectTrigger className="bg-secondary/50"><SelectValue placeholder="בחר נושא" /></SelectTrigger>
            <SelectContent>{topics.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
          </Select>
          <Textarea placeholder="הדבק כאן שורות מאקסל..." value={bulkText} onChange={e => { setBulkText(e.target.value); setBulkPreview([]); }} className="bg-secondary/50 font-mono text-xs" rows={6} dir="ltr" />
          {bulkPreview.length === 0 ? (
            <Button onClick={parseBulk} disabled={!bulkText.trim() || !bulkTopic} className="w-full bg-secondary text-foreground border border-border">
              <FileSpreadsheet className="w-4 h-4 ml-2" />הצג תצוגה מקדימה
            </Button>
          ) : (
            <>
              <div className="border rounded-xl overflow-hidden">
                <div className="bg-secondary/50 px-3 py-2 text-xs font-bold flex justify-between">
                  <span>{bulkPreview.length} שאלות</span>
                  <span className="text-primary">{topics.find(t => t.id === bulkTopic)?.name}</span>
                </div>
                <div className="divide-y max-h-56 overflow-y-auto">
                  {bulkPreview.map((q, i) => (
                    <div key={i} className="px-3 py-2 text-xs">
                      <p className="font-semibold mb-1">{i+1}. {q.question}</p>
                      <div className="grid grid-cols-2 gap-x-2">
                        {[q.answer1,q.answer2,q.answer3,q.answer4].filter(Boolean).map((a,ai) => (
                          <span key={ai} className={q.correctAnswer===ai+1?'text-emerald-600 font-semibold':'text-muted-foreground'}>
                            {q.correctAnswer===ai+1?'✓':(`${ai+1}.`)} {a}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-xl border border-amber-200">
                <input type="checkbox" id="ci" checked={bulkConfirmed} onChange={e => setBulkConfirmed(e.target.checked)} className="w-4 h-4 accent-primary" />
                <label htmlFor="ci" className="text-xs text-amber-800 font-medium cursor-pointer">אישרתי שהשאלות נכונות</label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => { setBulkPreview([]); setBulkConfirmed(false); }} className="text-xs">עריכה מחדש</Button>
                <Button onClick={handleBulkImport} disabled={saving || !bulkConfirmed} className="bg-primary text-primary-foreground text-xs">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}שמור {bulkPreview.length} שאלות
                </Button>
              </div>
            </>
          )}
        </Card>
      )}

      {/* Questions grouped by topic with edit/delete */}
      <div className="space-y-4 mt-2">
        {grouped.map(([tName, qs]) => (
          <div key={tName}>
            <div className="flex items-center gap-2 py-1.5 px-1 mb-2">
              <HelpCircle className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-foreground">{tName}</span>
              <Badge variant="secondary" className="text-xs">{qs.length} שאלות</Badge>
            </div>
            <div className="space-y-2">
              {qs.map(q => (
                <Card key={q.id} className="p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground mb-1.5">{q.question}</p>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                        {[q.answer1,q.answer2,q.answer3,q.answer4 || ''].filter(Boolean).map((a,i) => (
                          <span key={i} className={`text-xs flex items-center gap-1 ${q.correctAnswer===i+1?'text-emerald-600 font-semibold':'text-muted-foreground'}`}>
                            {q.correctAnswer===i+1?'✓':`${i+1}.`} {a}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => setEditQ(q)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-primary transition-colors" title="עריכה">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setDeleteId(q.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" title="מחיקה">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
        {questions.length === 0 && <Card className="p-8 text-center text-muted-foreground text-sm">אין שאלות עדיין</Card>}
      </div>
    </>
  );
}

function AddEmployeeForm({ onAdded }: { onAdded: () => void }) {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [branch, setBranch] = useState('');
  const [role, setRole] = useState('');
  const [saving, setSaving] = useState(false);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !password) return;
    setSaving(true);
    try {
      await createEmployee({ name, password, branch, role });
      toast.success(`${name} נוסף/ה בהצלחה`);
      setName(''); setPassword(''); setBranch(''); setRole('');
      onAdded();
    } catch { toast.error('שגיאה בהוספת עובד'); }
    finally { setSaving(false); }
  };

  return (
    <Card className="p-4 border-primary/20">
      <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><UserPlus className="w-4 h-4 text-primary" />הוספת עובד חדש</h3>
      <form onSubmit={handle} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div><Label className="text-xs">שם מלא *</Label><Input value={name} onChange={e => setName(e.target.value)} className="bg-secondary/50 mt-1" placeholder="שם מלא" /></div>
          <div><Label className="text-xs">סיסמה *</Label><Input value={password} onChange={e => setPassword(e.target.value)} className="bg-secondary/50 mt-1" placeholder="סיסמה" /></div>
          <div><Label className="text-xs">סניף</Label><Input value={branch} onChange={e => setBranch(e.target.value)} className="bg-secondary/50 mt-1" placeholder="שם סניף" /></div>
          <div><Label className="text-xs">תפקיד</Label><Input value={role} onChange={e => setRole(e.target.value)} className="bg-secondary/50 mt-1" placeholder="תפקיד" /></div>
        </div>
        <Button type="submit" disabled={saving || !name || !password} className="w-full bg-primary text-primary-foreground">
          {saving ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <UserPlus className="w-4 h-4 ml-2" />}הוסף עובד
        </Button>
      </form>
    </Card>
  );
}

// ── EditEmployeeDialog ────────────────────────────────────
function EditEmployeeDialog({ emp, onSaved, onClose }: { emp: AdminEmployee; onSaved: () => void; onClose: () => void }) {
  const [name, setName] = useState(emp.name);
  const [password, setPassword] = useState('');
  const [branch, setBranch] = useState(emp.branch || '');
  const [role, setRole] = useState(emp.role || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: Parameters<typeof updateEmployee>[0] = { id: emp.id, name, branch, role };
      if (password) payload.password = password;
      await updateEmployee(payload);
      toast.success('פרטי עובד עודכנו');
      onSaved();
      onClose();
    } catch {
      toast.error('שגיאה בעדכון');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <Card className="w-full max-w-sm p-5 space-y-4" onClick={e => e.stopPropagation()}>
        <h3 className="font-bold text-base">עריכת עובד</h3>
        <div className="space-y-3">
          <div>
            <Label className="text-xs font-semibold">שם מלא</Label>
            <Input value={name} onChange={e => setName(e.target.value)} className="mt-1 h-9 text-sm" />
          </div>
          <div>
            <Label className="text-xs font-semibold">סיסמה חדשה (השאר ריק לשמור)</Label>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••" className="mt-1 h-9 text-sm" />
          </div>
          <div>
            <Label className="text-xs font-semibold">סניף</Label>
            <Input value={branch} onChange={e => setBranch(e.target.value)} className="mt-1 h-9 text-sm" />
          </div>
          <div>
            <Label className="text-xs font-semibold">תפקיד</Label>
            <Input value={role} onChange={e => setRole(e.target.value)} className="mt-1 h-9 text-sm" />
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <Button size="sm" onClick={handleSave} disabled={saving || !name} className="flex-1 bg-primary text-primary-foreground text-xs">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'שמור'}
          </Button>
          <Button size="sm" variant="outline" onClick={onClose} className="flex-1 text-xs">ביטול</Button>
        </div>
      </Card>
    </div>
  );
}

export default function AdminPage() {
  const [employees, setEmployees] = useState<AdminEmployee[] | null>(null);
  const [adminCreds, setAdminCreds] = useState<{ user: string; pass: string } | null>(null);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'progress' | 'users' | 'manage'>('progress');
  const [showAddUser, setShowAddUser] = useState(false);
  const [editEmp, setEditEmp] = useState<AdminEmployee | null>(null);

  const quizAttempts = useMemo(() => getAllQuizResults(), [employees]);

  const refreshEmployees = async (user: string, pass: string) => {
    try {
      const res = await adminData({ adminUser: user, adminPass: pass });
      if (res.success) setEmployees(res.employees);
    } catch { /* silent */ }
  };

  if (!employees) return (
    <AdminLogin onSuccess={(emps, user, pass) => {
      setEmployees(emps);
      setAdminCreds({ user, pass });
    }} />
  );

  const filtered = employees.filter(e => e.name.includes(search) || e.role?.includes(search) || e.branch?.includes(search));
  const totalEmps = employees.length;
  const totalVids = employees.reduce((s, e) => s + e.topics.reduce((ss: number, t) => ss + t.total, 0), 0);
  const totalDone = employees.reduce((s, e) => s + e.topics.reduce((ss: number, t) => ss + t.completed, 0), 0);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      {editEmp && (
        <EditEmployeeDialog
          emp={editEmp}
          onClose={() => setEditEmp(null)}
          onSaved={() => adminCreds && refreshEmployees(adminCreds.user, adminCreds.pass)}
        />
      )}
      <div className="container mx-auto px-4 py-4 max-w-2xl">
        <div className="flex gap-1 bg-secondary/30 p-1 rounded-xl mb-4">
          {[
            { key: 'progress' as const, label: 'התקדמות', icon: Users },
            { key: 'users' as const, label: 'עובדים', icon: UserPlus },
            { key: 'manage' as const, label: 'ניהול נתונים', icon: Settings },
          ].map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex-1 py-2.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${tab === key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>
              <Icon className="w-3.5 h-3.5" />{label}
            </button>
          ))}
        </div>

        {tab === 'progress' && (
          <>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <Card className="p-3 text-center"><div className="text-2xl font-bold text-primary">{totalEmps}</div><div className="text-xs text-muted-foreground">עובדים</div></Card>
              <Card className="p-3 text-center"><div className="text-2xl font-bold text-primary">{totalDone}/{totalVids}</div><div className="text-xs text-muted-foreground">סרטונים</div></Card>
              <Card className="p-3 text-center"><div className="text-2xl font-bold text-primary">{quizAttempts.length}</div><div className="text-xs text-muted-foreground">מבחנים</div></Card>
            </div>
            <div className="relative mb-4">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="חיפוש עובד..." value={search} onChange={e => setSearch(e.target.value)} className="pr-10 bg-card" />
            </div>
            <div className="space-y-2.5">
              {filtered.map(emp => <EmployeeRow key={emp.id} emp={emp} quizAttempts={quizAttempts} />)}
              {filtered.length === 0 && <Card className="p-10 text-center"><p className="text-muted-foreground text-sm">לא נמצאו עובדים</p></Card>}
            </div>
          </>
        )}

        {tab === 'users' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold">ניהול עובדים</h3>
              <Button size="sm" onClick={() => setShowAddUser(!showAddUser)} className="h-8 text-xs bg-primary text-primary-foreground">
                <Plus className="w-3.5 h-3.5 ml-1" />הוסף עובד
              </Button>
            </div>
            {showAddUser && (
              <AddEmployeeForm onAdded={() => {
                setShowAddUser(false);
                if (adminCreds) refreshEmployees(adminCreds.user, adminCreds.pass);
              }} />
            )}
            <div className="space-y-2">
              {employees.map(emp => (
                <Card key={emp.id} className="p-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">{emp.name.charAt(0)}</div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{emp.name}</p>
                      <p className="text-xs text-muted-foreground">{[emp.role, emp.branch].filter(Boolean).join(' • ')}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => setEditEmp(emp)}
                      className="p-2 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={async () => {
                        if (!confirm(`למחוק את ${emp.name}?`)) return;
                        try {
                          await deleteEmployee(emp.id);
                          toast.success('עובד נמחק');
                          setEmployees(prev => prev?.filter(e => e.id !== emp.id) ?? null);
                        } catch { toast.error('שגיאה במחיקה'); }
                      }}
                      className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {tab === 'manage' && <DataManagement />}
      </div>
    </div>
  );
}
