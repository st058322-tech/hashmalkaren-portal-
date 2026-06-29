import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTopics, type Topic } from '../lib/api';
import { getSession } from '../lib/session';
import { useAppTab } from '../components/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  PlayCircle, CheckCircle2, BookOpen, BarChart3, Target, Clock, Trophy, ChevronLeft,
  ClipboardCheck, XCircle, User, Building2, Briefcase,
} from 'lucide-react';
import { getMyQuizResults, QuizAttempt, QuizAnswer } from '../lib/quizResults';

// ── Home tab ──────────────────────────────────────────────────────────────────

function NextAction({ topics, onGo }: { topics: Topic[]; onGo: (id: string) => void }) {
  const next = topics.find(t => t.completedVideos < t.totalVideos && t.totalVideos > 0);
  if (!next) return null;
  return (
    <Card className="p-4 border-primary/20 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-md shadow-primary/30">
            <PlayCircle className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground font-medium">הפעולה הבאה</p>
            <p className="text-sm font-bold text-foreground truncate">{next.name}</p>
            <p className="text-xs text-muted-foreground">סרטון הבא לצפייה</p>
          </div>
        </div>
        <Button size="sm" onClick={() => onGo(next.id)}
          className="bg-primary text-white h-9 px-5 shrink-0 font-bold rounded-xl shadow-md shadow-primary/25 hover:bg-primary/90">
          המשך
        </Button>
      </div>
    </Card>
  );
}

function TopicCard({ topic, index, onClick }: { topic: Topic; index: number; onClick: () => void }) {
  const pct = topic.totalVideos > 0 ? Math.round((topic.completedVideos / topic.totalVideos) * 100) : 0;
  const done = pct === 100 && topic.totalVideos > 0;
  const icons = ['🧺', '🚿', '❄️', '📋', '🔧', '📦', '🏪', '✅'];

  return (
    <Card onClick={onClick} className="p-4 cursor-pointer hover:shadow-md hover:border-primary/30 transition-all group">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-xl shrink-0">
          {icons[index % icons.length]}
        </div>
        <h3 className="text-sm font-bold text-foreground leading-snug line-clamp-2">{topic.name}</h3>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {topic.completedVideos}/{topic.totalVideos} סרטונים
            {topic.questionCount > 0 && <span className="mr-1.5 text-primary/70">• שאלון</span>}
          </span>
          <span className="text-sm font-extrabold text-primary">{pct}%</span>
        </div>
        <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-500 ${done ? 'bg-emerald-500' : 'bg-primary'}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className="mt-3">
        <Button size="sm" variant={done ? 'outline' : 'default'}
          className={`w-full h-8 text-xs font-bold rounded-lg ${done ? 'border-emerald-500/30 text-emerald-600 hover:bg-emerald-50' : 'bg-primary text-white hover:bg-primary/90 shadow-sm shadow-primary/20'}`}>
          {done ? <><CheckCircle2 className="w-3.5 h-3.5 ml-1" />הושלם</> : <>המשך ללמידה <ChevronLeft className="w-3.5 h-3.5 mr-1" /></>}
        </Button>
      </div>
    </Card>
  );
}

function HomeTab({ emp, topics, loading, navigate }: { emp: ReturnType<typeof getSession>; topics: Topic[]; loading: boolean; navigate: (p: string) => void }) {
  const stats = useMemo(() => {
    const total = topics.reduce((s, t) => s + t.totalVideos, 0);
    const completed = topics.reduce((s, t) => s + t.completedVideos, 0);
    return { total, completed, remaining: total - completed, pct: total > 0 ? Math.round((completed / total) * 100) : 0 };
  }, [topics]);

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-foreground">שלום {emp?.name} 👋</h1>
        <p className="text-sm text-muted-foreground mt-1">ברוכה הבאה למרכז ההדרכה. יש להשלים את ההדרכות לפי הסדר.</p>
      </div>

      {loading ? <Skeleton className="h-36 rounded-2xl" /> : (
        <Card className="p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-foreground">ההתקדמות שלי</span>
            </div>
            <span className="text-3xl font-black text-primary">{stats.pct}%</span>
          </div>
          <Progress value={stats.pct} className="h-3 mb-4 [&>div]:bg-primary [&>div]:rounded-full rounded-full" />
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { icon: Trophy, label: 'הושלמו', value: stats.completed, accent: true },
              { icon: Target, label: 'נותרו', value: stats.remaining },
              { icon: Clock, label: 'סה"כ', value: stats.total },
            ].map(({ icon: Icon, label, value, accent }) => (
              <div key={label} className={`rounded-xl p-2.5 ${accent ? 'bg-primary/8' : 'bg-secondary/60'}`}>
                <Icon className={`w-4 h-4 mx-auto mb-1 ${accent ? 'text-primary' : 'text-muted-foreground'}`} />
                <div className="text-base font-extrabold text-foreground">{value}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {!loading && <NextAction topics={topics} onGo={id => navigate(`/topic/${id}`)} />}

      <div>
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="w-4 h-4 text-primary" />
          <h2 className="text-base font-bold text-foreground">הנושאים שלי</h2>
          {!loading && <span className="mr-auto text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{topics.length} נושאים</span>}
        </div>
        {loading ? (
          <div className="grid grid-cols-2 gap-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-44 rounded-2xl" />)}</div>
        ) : topics.length === 0 ? (
          <Card className="p-10 text-center text-muted-foreground text-sm">אין נושאים פעילים כרגע</Card>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {topics.map((t, i) => <TopicCard key={t.id} topic={t} index={i} onClick={() => navigate(`/topic/${t.id}`)} />)}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Quizzes tab ───────────────────────────────────────────────────────────────

function AnswerDetail({ a, i }: { a: QuizAnswer; i: number }) {
  return (
    <div className={`p-3 rounded-xl border text-sm ${a.isCorrect ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
      <div className="flex items-start gap-2 mb-2">
        {a.isCorrect
          ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          : <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />}
        <p className="font-semibold text-foreground">{i + 1}. {a.question}</p>
      </div>
      <div className="space-y-1 mr-6">
        {a.answers.filter(Boolean).map((ans, idx) => {
          const num = idx + 1;
          const isSelected = a.selectedAnswer === num;
          const isCorrect = a.correctAnswer === num;
          return (
            <div key={num} className={`flex items-center gap-2 text-xs rounded-lg px-2 py-1 ${isCorrect ? 'bg-emerald-100 text-emerald-800 font-semibold' : isSelected && !a.isCorrect ? 'bg-red-100 text-red-700 line-through' : 'text-muted-foreground'}`}>
              {isCorrect && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
              {isSelected && !isCorrect && <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />}
              {!isCorrect && !isSelected && <span className="w-3.5 h-3.5 shrink-0" />}
              {ans}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function QuizCard({ attempt }: { attempt: QuizAttempt }) {
  const [open, setOpen] = useState(false);
  return (
    <Card className="overflow-hidden shadow-sm">
      <button onClick={() => setOpen(!open)} className="w-full p-4 flex items-center justify-between gap-3 text-right hover:bg-secondary/20 transition-colors">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 font-black text-lg ${attempt.passed ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
            {attempt.score}
          </div>
          <div className="min-w-0 text-right">
            <p className="font-bold text-foreground text-sm truncate">{attempt.topicName}</p>
            <p className="text-xs text-muted-foreground">{attempt.date} • {attempt.correct}/{attempt.total} נכונות</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge className={`text-xs ${attempt.passed ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-red-100 text-red-600 border-red-200'}`} variant="outline">
            {attempt.passed ? '✓ עבר' : '✗ לא עבר'}
          </Badge>
          <ChevronLeft className={`w-4 h-4 text-muted-foreground transition-transform ${open ? 'rotate-90' : ''}`} />
        </div>
      </button>
      {open && attempt.answers.length > 0 && (
        <div className="px-4 pb-4 border-t border-border pt-3 space-y-2">
          <p className="text-xs font-bold text-muted-foreground mb-2">פירוט תשובות:</p>
          {attempt.answers.map((a, i) => <AnswerDetail key={i} a={a} i={i} />)}
        </div>
      )}
    </Card>
  );
}

function QuizzesTab({ empId, navigate }: { empId: string; navigate: (p: string) => void }) {
  const results = useMemo(() => getMyQuizResults(empId), [empId]);

  // Group by topic
  const grouped = useMemo(() => {
    const map = new Map<string, QuizAttempt[]>();
    for (const r of results) {
      if (!map.has(r.topicName)) map.set(r.topicName, []);
      map.get(r.topicName)!.push(r);
    }
    return [...map.entries()];
  }, [results]);

  if (results.length === 0) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <h1 className="text-xl font-extrabold text-foreground mb-6 flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5 text-primary" />המבחנים שלי
        </h1>
        <Card className="p-10 text-center">
          <ClipboardCheck className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
          <p className="text-muted-foreground font-medium">עדיין לא ניגשת למבחן</p>
          <p className="text-xs text-muted-foreground mt-1">השלם נושא הדרכה כדי לגשת למבחן</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-xl font-extrabold text-foreground flex items-center gap-2">
        <ClipboardCheck className="w-5 h-5 text-primary" />המבחנים שלי
      </h1>

      {grouped.map(([topicName, attempts]) => {
        const best = Math.max(...attempts.map(a => a.score));
        const passed = attempts.some(a => a.passed);
        return (
          <div key={topicName}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${passed ? 'bg-emerald-100' : 'bg-red-100'}`}>
                {passed ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-red-500" />}
              </div>
              <div>
                <h2 className="font-bold text-foreground text-base">{topicName}</h2>
                <p className="text-xs text-muted-foreground">{attempts.length} ניסיונות • ציון מקסימלי: {best}</p>
              </div>
            </div>
            <div className="space-y-2">
              {attempts.map(a => <QuizCard key={a.id} attempt={a} />)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Profile tab ───────────────────────────────────────────────────────────────

function ProfileTab({ emp }: { emp: NonNullable<ReturnType<typeof getSession>> }) {
  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-xl font-extrabold text-foreground mb-5 flex items-center gap-2">
        <User className="w-5 h-5 text-primary" />הפרופיל שלי
      </h1>
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl font-black text-primary">
            {emp.name.charAt(0)}
          </div>
          <div>
            <p className="text-lg font-extrabold text-foreground">{emp.name}</p>
            {emp.role && <p className="text-sm text-muted-foreground flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" />{emp.role}</p>}
            {emp.branch && <p className="text-sm text-muted-foreground flex items-center gap-1"><Building2 className="w-3.5 h-3.5" />סניף {emp.branch}</p>}
          </div>
        </div>
      </Card>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function HomePage() {
  const navigate = useNavigate();
  const emp = getSession();
  const { tab } = useAppTab();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!emp) { navigate('/'); return; }
    getTopics({ employeeId: emp.id }).then(r => setTopics(r.topics)).finally(() => setLoading(false));
  }, []);

  if (!emp) return null;

  if (tab === 'quizzes') return <QuizzesTab empId={emp.id} navigate={navigate} />;
  if (tab === 'profile') return <ProfileTab emp={emp} />;
  return <HomeTab emp={emp} topics={topics} loading={loading} navigate={navigate} />;
}
