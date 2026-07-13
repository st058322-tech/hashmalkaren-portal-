import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTopics, type Topic } from '../lib/api';
import { getSession } from '../lib/session';
import { useAppTab } from '../components/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  PlayCircle, CheckCircle2, BookOpen, Target, Trophy, ChevronLeft,
  ClipboardCheck, XCircle, User, Building2, Briefcase, Lock,
  Wind, Snowflake, WashingMachine, Thermometer, FileText, Wrench, Package,
  ClipboardList, BookMarked, Zap, Star, TrendingUp,
} from 'lucide-react';
import { getMyQuizResults, QuizAttempt, QuizAnswer } from '../lib/quizResults';

// ── Card style helper ─────────────────────────────────────────────────────────
const card: React.CSSProperties = {
  background: '#ffffff',
  borderRadius: 16,
  border: '1px solid #e8e5e0',
  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
};

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

function getTopicIcon(name: string) {
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
  return fallbacks[name.charCodeAt(0) % fallbacks.length];
}

// ── SVG progress ring ─────────────────────────────────────────────────────────
function ProgressRing({ pct }: { pct: number }) {
  const r = 30, circ = 2 * Math.PI * r;
  return (
    <div style={{ position: 'relative', width: 80, height: 80, flexShrink: 0 }}>
      <svg width="80" height="80" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="40" cy="40" r={r} fill="none" stroke="#f0ede8" strokeWidth="7" />
        <circle cx="40" cy="40" r={r} fill="none" stroke="#e85d00" strokeWidth="7"
          strokeDasharray={`${(pct / 100) * circ} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.6s ease' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: '#e85d00', lineHeight: 1 }}>{pct}%</span>
        <span style={{ fontSize: 9, color: '#aaa', marginTop: 1 }}>הושלם</span>
      </div>
    </div>
  );
}

// ── Stat pill ─────────────────────────────────────────────────────────────────
function StatPill({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f7f5f2', borderRadius: 10, padding: '6px 10px' }}>
      <Icon style={{ width: 14, height: 14, color, flexShrink: 0 }} />
      <span style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>{value}</span>
      <span style={{ fontSize: 11, color: '#888' }}>{label}</span>
    </div>
  );
}

// ── Next action card ──────────────────────────────────────────────────────────
function NextAction({ topics, onGo }: { topics: Topic[]; onGo: (id: string) => void }) {
  const next = topics.find(t => t.completedVideos < t.totalVideos && t.totalVideos > 0);
  if (!next) return null;
  const remaining = next.totalVideos - next.completedVideos;
  const { icon: Icon, color, bg } = getTopicIcon(next.name);
  return (
    <div style={{ background: '#fff8f3', borderRadius: 16, border: '1.5px solid #f0c9a8', boxShadow: '0 2px 8px rgba(232,93,0,0.08)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: '#e85d00', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 3px 10px rgba(232,93,0,0.3)' }}>
        <PlayCircle style={{ width: 22, height: 22, color: '#fff' }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 10, fontWeight: 600, color: '#e85d00', marginBottom: 2, letterSpacing: '0.04em' }}>המשימה הבאה שלך</p>
        <p style={{ fontSize: 14, fontWeight: 600, color: '#2d2d2d', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          המשך בנושא &ldquo;{next.name}&rdquo;
        </p>
        <p style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
          {remaining === 1 ? 'נותר סרטון אחד' : `נותרו ${remaining} סרטונים`}
          {next.questionCount > 0 && ' — לאחריו מבחן'}
        </p>
      </div>
      <button onClick={() => onGo(next.id)}
        style={{ background: '#e85d00', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', flexShrink: 0, boxShadow: '0 2px 6px rgba(232,93,0,0.35)', fontFamily: 'inherit' }}>
        המשך
      </button>
    </div>
  );
}

// ── Topic card ────────────────────────────────────────────────────────────────
function TopicCard({ topic, onClick, lastAttempt }: { topic: Topic; onClick: () => void; lastAttempt?: QuizAttempt }) {
  const pct = topic.totalVideos > 0 ? Math.round((topic.completedVideos / topic.totalVideos) * 100) : 0;
  const done = pct === 100 && topic.totalVideos > 0;
  const { icon: Icon, color, bg } = getTopicIcon(topic.name);

  return (
    <div onClick={onClick} style={{
      ...card,
      borderRadius: 14,
      padding: '14px',
      cursor: 'pointer',
      display: 'flex', flexDirection: 'column',
      transition: 'box-shadow 0.15s, border-color 0.15s',
      ...(done ? { borderColor: '#9dd4b0', background: '#f6fcf8' } : {}),
    }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)')}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ width: 40, height: 40, borderRadius: 11, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 2px 6px ${color}22` }}>
          <Icon style={{ width: 20, height: 20, color }} />
        </div>
        {done ? (
          <span style={{ fontSize: 10, background: '#d0f0de', color: '#1a7a42', borderRadius: 6, padding: '3px 7px', fontWeight: 600 }}>הושלם ✓</span>
        ) : pct > 0 ? (
          <span style={{ fontSize: 10, background: '#fff0e8', color: '#c04d00', borderRadius: 6, padding: '3px 7px', fontWeight: 600 }}>בתהליך</span>
        ) : (
          <span style={{ fontSize: 10, background: '#f0ede8', color: '#aaa', borderRadius: 6, padding: '3px 7px', fontWeight: 500 }}>טרם התחיל</span>
        )}
      </div>

      <p style={{ fontSize: 13, fontWeight: 600, color: '#2d2d2d', marginBottom: 3 }}>{topic.name}</p>
      <p style={{ fontSize: 11, color: '#aaa', marginBottom: 8 }}>{topic.completedVideos}/{topic.totalVideos} סרטונים</p>

      <div style={{ background: '#f0ede8', borderRadius: 99, height: 6, marginBottom: 5 }}>
        <div style={{ background: done ? '#2e9e5a' : '#e85d00', borderRadius: 99, height: '100%', width: `${pct}%`, transition: 'width 0.4s ease' }} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: topic.questionCount > 0 ? 8 : 0 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: done ? '#2e9e5a' : pct > 0 ? '#e85d00' : '#ccc' }}>{pct}%</span>
        {done
          ? <CheckCircle2 style={{ width: 14, height: 14, color: '#2e9e5a' }} />
          : pct > 0
          ? <ChevronLeft style={{ width: 14, height: 14, color: '#e85d00' }} />
          : <Lock style={{ width: 13, height: 13, color: '#ccc' }} />
        }
      </div>

      {topic.questionCount > 0 && (
        <div style={{ paddingTop: 8, borderTop: '1px solid #f0ede8', display: 'flex', alignItems: 'center', gap: 5 }}>
          <ClipboardCheck style={{ width: 12, height: 12, color: '#bbb', flexShrink: 0 }} />
          {lastAttempt ? (
            <span style={{ fontSize: 10, color: lastAttempt.passed ? '#2e9e5a' : '#cc4444', fontWeight: 600 }}>
              מבחן: {lastAttempt.score} {lastAttempt.passed ? '— עבר ✓' : '— לא עבר'}
            </span>
          ) : done ? (
            <span style={{ fontSize: 10, color: '#e85d00', fontWeight: 600 }}>מבחן זמין — גש עכשיו</span>
          ) : (
            <span style={{ fontSize: 10, color: '#bbb' }}>מבחן טרם נפתח</span>
          )}
        </div>
      )}
    </div>
  );
}

// ── Home tab ──────────────────────────────────────────────────────────────────
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
    for (const a of [...attempts].reverse()) map.set(a.topicId, a);
    return map;
  }, [emp]);

  const { setTab } = useAppTab();
  const allDone = !loading && topics.length > 0 && stats.doneTopic === topics.length;

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Greeting */}
      <div>
        <h1 style={{ fontSize: 21, fontWeight: 700, color: '#2d2d2d' }}>
          שלום, {emp?.name ?? ''} 👋
        </h1>
        <p style={{ fontSize: 13, color: '#888', marginTop: 3 }}>ברוכה הבאה למרכז ההדרכה של חשמל הקרן</p>
      </div>

      {/* All-done banner */}
      {allDone && (
        <div style={{ background: 'linear-gradient(135deg,#d0f0de,#b8f0d0)', borderRadius: 14, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, border: '1px solid #9dd4b0' }}>
          <Trophy style={{ width: 28, height: 28, color: '#1a7a42', flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#1a7a42' }}>כל הכבוד! סיימת את כל ההדרכות</p>
            <p style={{ fontSize: 11, color: '#2e9e5a', marginTop: 2 }}>תוצאה מרשימה — עכשיו את מוכנה לעבוד!</p>
          </div>
        </div>
      )}

      {/* Progress card */}
      {loading ? <Skeleton className="h-32 rounded-2xl" /> : (
        <div style={{ ...card, padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <ProgressRing pct={stats.pct} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <TrendingUp style={{ width: 15, height: 15, color: '#e85d00' }} />
                <span style={{ fontSize: 14, fontWeight: 600, color: '#2d2d2d' }}>ההתקדמות שלי</span>
              </div>
              <div style={{ background: '#f0ede8', borderRadius: 99, height: 9, marginBottom: 12 }}>
                <div style={{ background: '#e85d00', borderRadius: 99, height: '100%', width: `${stats.pct}%`, transition: 'width 0.6s ease' }} />
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <StatPill icon={CheckCircle2} label="הושלמו" value={stats.doneTopic} color="#2e9e5a" />
                <StatPill icon={PlayCircle} label="בתהליך" value={stats.inProgress} color="#e85d00" />
                <StatPill icon={BookOpen} label="נושאים" value={topics.length} color="#888" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Next action */}
      {!loading && <NextAction topics={topics} onGo={id => navigate(`/topic/${id}`)} />}

      {/* Topic cards */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <BookOpen style={{ width: 14, height: 14, color: '#e85d00' }} />
          <h2 style={{ fontSize: 13, fontWeight: 600, color: '#555' }}>נושאי הלמידה שלך</h2>
          {!loading && (
            <span style={{ marginRight: 'auto', fontSize: 11, color: '#888', background: '#f0ede8', padding: '2px 8px', borderRadius: 99 }}>
              {topics.length} נושאים
            </span>
          )}
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-44 rounded-2xl" />)}
          </div>
        ) : topics.length === 0 ? (
          <div style={{ ...card, padding: 40, textAlign: 'center', color: '#aaa', fontSize: 14 }}>אין נושאים פעילים כרגע</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {topics.map((t, i) => (
              <TopicCard key={t.id} topic={t} onClick={() => navigate(`/topic/${t.id}`)} lastAttempt={quizMap.get(t.id)} />
            ))}
          </div>
        )}
      </div>

      {/* Quizzes link */}
      {!loading && (
        <button onClick={() => setTab('quizzes')} style={{
          ...card, border: '1px solid #e8e5e0',
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '13px 16px', cursor: 'pointer', width: '100%', textAlign: 'right', borderRadius: 14,
        }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: '#fff0e8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ClipboardList style={{ width: 18, height: 18, color: '#e85d00' }} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#2d2d2d', margin: 0 }}>המבחנים שלי</p>
            <p style={{ fontSize: 11, color: '#aaa', margin: 0, marginTop: 2 }}>כל הניסיונות והציונים לפי נושא</p>
          </div>
          <ChevronLeft style={{ width: 15, height: 15, color: '#ccc' }} />
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
    <div style={{ ...card, borderRadius: 12, overflow: 'hidden' }}>
      <button onClick={() => setOpen(!open)} style={{ width: '100%', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, textAlign: 'right', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 17, fontWeight: 700, background: attempt.passed ? '#d0f0de' : '#ffe0e0', color: attempt.passed ? '#1a7a42' : '#cc3333' }}>
            {attempt.score}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontWeight: 600, color: '#2d2d2d', fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{attempt.topicName}</p>
            <p style={{ fontSize: 11, color: '#aaa', margin: 0, marginTop: 2 }}>{attempt.date} • {attempt.correct}/{attempt.total} נכונות</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 11, borderRadius: 6, padding: '3px 8px', fontWeight: 600, background: attempt.passed ? '#d0f0de' : '#ffe0e0', color: attempt.passed ? '#1a7a42' : '#cc3333' }}>
            {attempt.passed ? '✓ עבר' : '✗ לא עבר'}
          </span>
          <ChevronLeft style={{ width: 15, height: 15, color: '#ccc', transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
        </div>
      </button>
      {open && attempt.answers.length > 0 && (
        <div style={{ padding: '0 16px 16px', borderTop: '1px solid #f0ede8' }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#aaa', margin: '12px 0 8px' }}>פירוט תשובות:</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {attempt.answers.map((a, i) => <AnswerDetail key={i} a={a} i={i} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function QuizzesTab({ empId }: { empId: string }) {
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
      <div style={{ padding: '24px 20px', maxWidth: 600, margin: '0 auto' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#2d2d2d', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <ClipboardCheck style={{ width: 20, height: 20, color: '#e85d00' }} />המבחנים שלי
        </h1>
        <div style={{ ...card, padding: 40, textAlign: 'center' }}>
          <ClipboardCheck style={{ width: 48, height: 48, color: '#ddd', margin: '0 auto 12px' }} />
          <p style={{ color: '#888', fontWeight: 500, margin: 0 }}>עדיין לא ניגשת למבחן</p>
          <p style={{ fontSize: 12, color: '#bbb', marginTop: 4 }}>השלם נושא הדרכה כדי לגשת למבחן</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: 600, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#2d2d2d', display: 'flex', alignItems: 'center', gap: 8 }}>
        <ClipboardCheck style={{ width: 20, height: 20, color: '#e85d00' }} />המבחנים שלי
      </h1>

      {grouped.map(([topicName, attempts]) => {
        const best = Math.max(...attempts.map(a => a.score));
        const passed = attempts.some(a => a.passed);
        return (
          <div key={topicName}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: passed ? '#d0f0de' : '#ffe0e0', flexShrink: 0 }}>
                {passed ? <CheckCircle2 style={{ width: 16, height: 16, color: '#1a7a42' }} /> : <XCircle style={{ width: 16, height: 16, color: '#cc3333' }} />}
              </div>
              <div>
                <p style={{ fontWeight: 700, color: '#2d2d2d', fontSize: 15, margin: 0 }}>{topicName}</p>
                <p style={{ fontSize: 11, color: '#aaa', margin: 0 }}>{attempts.length} ניסיונות • ציון מקסימלי: {best}</p>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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
    <div style={{ padding: '24px 20px', maxWidth: 500, margin: '0 auto' }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#2d2d2d', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
        <User style={{ width: 20, height: 20, color: '#e85d00' }} />הפרופיל שלי
      </h1>
      <div style={{ ...card, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 60, height: 60, borderRadius: 16, background: '#fff0e8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 700, color: '#e85d00' }}>
            {emp.name.charAt(0)}
          </div>
          <div>
            <p style={{ fontSize: 17, fontWeight: 700, color: '#2d2d2d', margin: 0 }}>{emp.name}</p>
            {emp.role && <p style={{ fontSize: 13, color: '#888', margin: '3px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}><Briefcase style={{ width: 13, height: 13 }} />{emp.role}</p>}
            {emp.branch && <p style={{ fontSize: 13, color: '#888', margin: '2px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}><Building2 style={{ width: 13, height: 13 }} />סניף {emp.branch}</p>}
          </div>
        </div>
      </div>
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
  if (tab === 'quizzes') return <QuizzesTab empId={emp.id} />;
  if (tab === 'profile') return <ProfileTab emp={emp} />;
  return <HomeTab emp={emp} topics={topics} loading={loading} navigate={navigate} />;
}
