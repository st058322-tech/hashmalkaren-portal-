import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTopics, type Topic } from '../lib/api';
import { getSession } from '../lib/session';
import { useAppTab } from '../components/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  PlayCircle, CheckCircle2, BookOpen, Target, Trophy, ChevronLeft,
  ClipboardCheck, XCircle, User, Building2, Briefcase, Lock,
  Wind, Snowflake, WashingMachine, Thermometer, FileText, Wrench, Package,
  ClipboardList, BookMarked, Zap,
} from 'lucide-react';
import { getMyQuizResults, getAttemptsByEmployee, QuizAttempt, QuizAnswer } from '../lib/quizResults';

// ── Topic icon mapping ────────────────────────────────────────────────────────

const TOPIC_ICONS: { keywords: string[]; icon: React.ElementType; color: string; bg: string }[] = [
  { keywords: ['מייבש', 'מייבשים'], icon: Wind, color: '#e85d00', bg: '#fff0e8' },
  { keywords: ['מקרר', 'מקררים', 'קירור'], icon: Snowflake, color: '#3366dd', bg: '#e8f0ff' },
  { keywords: ['כביסה', 'מכונת כביסה', 'מכונות כביסה'], icon: WashingMachine, color: '#2e9e5a', bg: '#e8f8ee' },
  { keywords: ['מזגן', 'מזגנים', 'אויר'], icon: Thermometer, color: '#7c44cc', bg: '#f0eaff' },
  { keywords: ['נוהל', 'נהלים', 'מסמך', 'מסמכים'], icon: FileText, color: '#b45309', bg: '#fef3c7' },
  { keywords: ['תחזוקה', 'תיקון', 'כלים'], icon: Wrench, color: '#0891b2', bg: '#e0f7fa' },
  { keywords: ['מוצר', 'מוצרים', 'חומר', 'חומרים'], icon: Package, color: '#6b7280', bg: '#f3f4f6' },
  { keywords: ['חשמל', 'בטיחות', 'זרם'], icon: Zap, color: '#d97706', bg: '#fffbeb' },
];

function getTopicIcon(name: string): { icon: React.ElementType; color: string; bg: string } {
  const lower = name.toLowerCase();
  for (const entry of TOPIC_ICONS) {
    if (entry.keywords.some(k => lower.includes(k))) return entry;
  }
  const fallbacks = [
    { icon: BookMarked, color: '#e85d00', bg: '#fff0e8' },
    { icon: ClipboardList, color: '#3366dd', bg: '#e8f0ff' },
    { icon: BookOpen, color: '#2e9e5a', bg: '#e8f8ee' },
    { icon: Target, color: '#7c44cc', bg: '#f0eaff' },
  ];
  const idx = name.charCodeAt(0) % fallbacks.length;
  return fallbacks[idx];
}

// ── Progress circle ───────────────────────────────────────────────────────────

function ProgressCircle({ pct }: { pct: number }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" style={{ transform: 'rotate(-90deg)' }}>
      <circle cx="36" cy="36" r={r} fill="none" stroke="#f0ede8" strokeWidth="6" />
      <circle
        cx="36" cy="36" r={r} fill="none"
        stroke="#e85d00" strokeWidth="6"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.5s ease' }}
      />
      <text x="36" y="38" textAnchor="middle" dominantBaseline="middle"
        style={{ transform: 'rotate(90deg) translate(0px, -72px)', fontSize: '15px', fontWeight: 500, fill: '#e85d00', fontFamily: 'system-ui' }}>
        {pct}%
      </text>
    </svg>
  );
}

// ── Home tab ──────────────────────────────────────────────────────────────────

function NextAction({ topics, onGo }: { topics: Topic[]; onGo: (id: string) => void }) {
  const next = topics.find(t => t.completedVideos < t.totalVideos && t.totalVideos > 0);
  if (!next) return null;
  const remaining = next.totalVideos - next.completedVideos;
  return (
    <div style={{ background: '#fff8f3', borderRadius: 16, border: '1.5px solid #f0c9a8', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: '#e85d00', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <PlayCircle className="w-5 h-5 text-white" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 10, fontWeight: 500, color: '#e85d00', marginBottom: 2 }}>המשימה הבאה שלך</p>
        <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          המשך בנושא &ldquo;{next.name}&rdquo;
        </p>
        <p style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 2 }}>
          {remaining === 1 ? 'נותר סרטון אחד' : `נותרו ${remaining} סרטונים`}
          {next.questionCount > 0 && ' — לאחריו מבחן'}
        </p>
      </div>
      <Button size="sm" onClick={() => onGo(next.id)}
        style={{ background: '#e85d00', color: '#fff', borderRadius: 10, padding: '0 16px', height: 36, fontSize: 13, fontWeight: 500, flexShrink: 0, border: 'none' }}>
        המשך
      </Button>
    </div>
  );
}

function TopicCard({
  topic, index, onClick, lastAttempt,
}: {
  topic: Topic; index: number; onClick: () => void; lastAttempt?: QuizAttempt;
}) {
  const pct = topic.totalVideos > 0 ? Math.round((topic.completedVideos / topic.totalVideos) * 100) : 0;
  const done = pct === 100 && topic.totalVideos > 0;
  const { icon: Icon, color, bg } = getTopicIcon(topic.name);

  const statusBadge = done
    ? { label: 'הושלם', style: { background: '#d0f0de', color: '#1e7a44' } }
    : pct > 0
    ? { label: 'בתהליך', style: { background: '#fff0e8', color: '#c04d00' } }
    : { label: 'טרם התחיל', style: { background: '#f0ede8', color: '#999' } };

  return (
    <div
      onClick={onClick}
      style={{
        background: done ? '#f3fbf6' : 'var(--card)',
        borderRadius: 14,
        border: `0.5px solid ${done ? '#9dd4b0' : 'var(--border)'}`,
        padding: '12px 14px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon style={{ width: 17, height: 17, color }} />
        </div>
        <span style={{ fontSize: 9, borderRadius: 6, padding: '2px 6px', fontWeight: 500, ...statusBadge.style }}>
          {statusBadge.label}
        </span>
      </div>

      <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--foreground)', marginBottom: 3 }}>{topic.name}</p>
      <p style={{ fontSize: 11, color: 'var(--muted-foreground)', marginBottom: 7 }}>
        {topic.completedVideos}/{topic.totalVideos} סרטונים
      </p>

      <div style={{ background: '#f0ede8', borderRadius: 99, height: 5, marginBottom: 6 }}>
        <div style={{ background: done ? '#2e9e5a' : '#e85d00', borderRadius: 99, height: '100%', width: `${pct}%`, transition: 'width 0.4s ease' }} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10, color: '#bbb' }}>{pct}%</span>
        {done
          ? <CheckCircle2 style={{ width: 13, height: 13, color: '#2e9e5a' }} />
          : pct > 0
          ? <ChevronLeft style={{ width: 13, height: 13, color: '#e85d00' }} />
          : <Lock style={{ width: 12, height: 12, color: '#ccc' }} />
        }
      </div>

      {topic.questionCount > 0 && (
        <div style={{ marginTop: 7, paddingTop: 7, borderTop: '0.5px solid var(--border)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <ClipboardCheck style={{ width: 11, height: 11, color: 'var(--muted-foreground)', flexShrink: 0 }} />
          {lastAttempt ? (
            <span style={{ fontSize: 10, color: lastAttempt.passed ? '#2e9e5a' : '#cc4444', fontWeight: 500 }}>
              מבחן: {lastAttempt.score} {lastAttempt.passed ? '— עבר ✓' : '— לא עבר'}
            </span>
          ) : done ? (
            <span style={{ fontSize: 10, color: '#e85d00' }}>מבחן זמין — גש עכשיו</span>
          ) : (
            <span style={{ fontSize: 10, color: 'var(--muted-foreground)' }}>מבחן טרם נפתח</span>
          )}
        </div>
      )}
    </div>
  );
}

function HomeTab({ emp, topics, loading, navigate }: {
  emp: ReturnType<typeof getSession>; topics: Topic[]; loading: boolean; navigate: (p: string) => void;
}) {
  const stats = useMemo(() => {
    const total = topics.reduce((s, t) => s + t.totalVideos, 0);
    const completed = topics.reduce((s, t) => s + t.completedVideos, 0);
    const inProgress = topics.filter(t => t.completedVideos > 0 && t.completedVideos < t.totalVideos).length;
    const doneTopic = topics.filter(t => t.totalVideos > 0 && t.completedVideos === t.totalVideos).length;
    return { total, completed, inProgress, doneTopic, pct: total > 0 ? Math.round((completed / total) * 100) : 0 };
  }, [topics]);

  const quizMap = useMemo(() => {
    if (!emp) return new Map<string, QuizAttempt>();
    const attempts = getMyQuizResults(emp.id);
    const map = new Map<string, QuizAttempt>();
    for (const a of [...attempts].reverse()) {
      map.set(a.topicId, a);
    }
    return map;
  }, [emp]);

  const { setTab } = useAppTab();

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 500, color: 'var(--foreground)' }}>
          {emp?.name ? `שלום, ${emp.name}` : 'שלום'}
        </h1>
        <p style={{ fontSize: 13, color: 'var(--muted-foreground)', marginTop: 3 }}>
          ברוכה הבאה למרכז ההדרכה של חשמל הקרן
        </p>
      </div>

      {loading ? <Skeleton className="h-32 rounded-2xl" /> : (
        <div style={{ background: 'var(--card)', borderRadius: 16, border: '0.5px solid var(--border)', padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
            <ProgressCircle pct={stats.pct} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--foreground)', marginBottom: 8 }}>ההתקדמות שלי</p>
              <div style={{ background: '#f0ede8', borderRadius: 99, height: 8, marginBottom: 10 }}>
                <div style={{ background: '#e85d00', borderRadius: 99, height: '100%', width: `${stats.pct}%`, transition: 'width 0.5s ease' }} />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <CheckCircle2 style={{ width: 14, height: 14, color: '#2e9e5a', flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}><strong style={{ color: 'var(--foreground)' }}>{stats.doneTopic}</strong> הושלמו</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <PlayCircle style={{ width: 14, height: 14, color: '#e85d00', flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}><strong style={{ color: 'var(--foreground)' }}>{stats.inProgress}</strong> בתהליך</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <BookOpen style={{ width: 14, height: 14, color: 'var(--muted-foreground)', flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}><strong style={{ color: 'var(--foreground)' }}>{topics.length}</strong> נושאים</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {!loading && <NextAction topics={topics} onGo={id => navigate(`/topic/${id}`)} />}

      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <BookOpen style={{ width: 14, height: 14, color: '#e85d00' }} />
          <h2 style={{ fontSize: 13, fontWeight: 500, color: 'var(--muted-foreground)' }}>נושאי הלמידה שלך</h2>
          {!loading && (
            <span style={{ marginRight: 'auto', fontSize: 11, color: 'var(--muted-foreground)', background: 'var(--secondary)', padding: '2px 8px', borderRadius: 99 }}>
              {topics.length} נושאים
            </span>
          )}
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-44 rounded-2xl" />)}
          </div>
        ) : topics.length === 0 ? (
          <Card className="p-10 text-center text-muted-foreground text-sm">אין נושאים פעילים כרגע</Card>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {topics.map((t, i) => (
              <TopicCard
                key={t.id} topic={t} index={i}
                onClick={() => navigate(`/topic/${t.id}`)}
                lastAttempt={quizMap.get(t.id)}
              />
            ))}
          </div>
        )}
      </div>

      {!loading && (
        <button
          onClick={() => setTab('quizzes')}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'var(--card)', border: '0.5px solid var(--border)',
            borderRadius: 12, padding: '12px 14px', cursor: 'pointer', width: '100%', textAlign: 'right',
          }}
        >
          <ClipboardList style={{ width: 18, height: 18, color: '#e85d00', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--foreground)', margin: 0 }}>המבחנים שלי</p>
            <p style={{ fontSize: 11, color: 'var(--muted-foreground)', margin: 0 }}>כל הניסיונות והציונים לפי נושא</p>
          </div>
          <ChevronLeft style={{ width: 14, height: 14, color: 'var(--muted-foreground)' }} />
        </button>
      )}
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
